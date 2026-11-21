"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

type MotionState = { x: number; y: number; scroll: number };

function Particles({ compact }: { compact: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = compact ? 120 : 320;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.1 + Math.random() * 1.5;
      data[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.75;
      data[i * 3 + 2] = radius * Math.cos(phi);
    }
    return data;
  }, [compact]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#8B0D1A" size={compact ? 0.02 : 0.016} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function CoreStructure({
  motion,
  compact,
  interactive,
  scrollDriven,
}: {
  motion: MutableRefObject<MotionState>;
  compact: boolean;
  interactive: boolean;
  scrollDriven: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const orbit = useRef<THREE.Group>(null);

  const shards = useMemo(() => {
    const count = compact ? 4 : 7;
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 1.95 + (i % 2) * 0.38,
      y: Math.sin(i * 1.7) * 0.5,
      scale: 0.085 + (i % 3) * 0.03,
    }));
  }, [compact]);

  useFrame((_, delta) => {
    const state = motion.current;
    if (group.current) {
      group.current.rotation.y += delta * (scrollDriven ? 0.2 : 0.11);
      if (interactive) {
        group.current.rotation.x = THREE.MathUtils.lerp(
          group.current.rotation.x,
          -state.y * 0.16,
          0.045,
        );
        group.current.position.x = THREE.MathUtils.lerp(
          group.current.position.x,
          state.x * 0.22,
          0.045,
        );
      }
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        Math.sin(state.scroll * 1.6) * -0.35,
        0.03,
      );
    }
    if (shell.current) {
      shell.current.rotation.z -= delta * 0.07;
      shell.current.rotation.x += delta * 0.045;
    }
    if (orbit.current) {
      orbit.current.rotation.y -= delta * 0.16;
      orbit.current.rotation.z = Math.sin(state.scroll * 1.2) * 0.12;
    }
  });

  return (
    <group ref={group} rotation={[0.18, 0.4, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.22, 0]} />
        <meshStandardMaterial
          color="#0B0B0B"
          metalness={0.92}
          roughness={0.26}
          flatShading
          emissive="#8B0D1A"
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh ref={shell} scale={1.1}>
        <icosahedronGeometry args={[1.22, 1]} />
        <meshBasicMaterial color="#8B0D1A" wireframe transparent opacity={0.32} />
      </mesh>

      <group ref={orbit}>
        {shards.map((shard, index) => (
          <mesh
            key={index}
            position={[
              Math.cos(shard.angle) * shard.radius,
              shard.y,
              Math.sin(shard.angle) * shard.radius,
            ]}
            rotation={[shard.angle, shard.angle * 0.7, 0]}
            scale={shard.scale}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#8B0D1A" metalness={0.8} roughness={0.3} flatShading />
          </mesh>
        ))}

        <mesh rotation={[Math.PI / 2.25, 0.2, 0]}>
          <torusGeometry args={[1.85, 0.006, 6, 96]} />
          <meshBasicMaterial color="#8B0D1A" transparent opacity={0.42} />
        </mesh>
        <mesh rotation={[Math.PI / 1.7, -0.5, 0.4]}>
          <torusGeometry args={[2.2, 0.004, 6, 96]} />
          <meshBasicMaterial color="#F5F2ED" transparent opacity={0.14} />
        </mesh>
      </group>

      <Particles compact={compact} />
    </group>
  );
}

export function CoreScene({
  compact = false,
  interactive = true,
  scrollDriven = false,
}: {
  compact?: boolean;
  interactive?: boolean;
  scrollDriven?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useRef<MotionState>({ x: 0, y: 0, scroll: 0 });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(node);

    const onPointer = (event: PointerEvent) => {
      motion.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      motion.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      motion.current.scroll = Math.min(2, window.scrollY / Math.max(1, window.innerHeight));
    };

    if (interactive) window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      if (interactive) window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [interactive]);

  return (
    <div ref={host} className="h-full w-full" aria-hidden="true">
      <Canvas
        dpr={compact ? 1 : [1, 1.6]}
        camera={{ position: [0, 0, compact ? 6.6 : 5.8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={visible ? "always" : "never"}
        onCreated={({ gl }) => gl.setClearColor(0x0B0B0B, 0)}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 5, 5]} intensity={1.7} color="#F5F2ED" />
        <pointLight position={[-4, -2, 3]} intensity={2.2} color="#8B0D1A" distance={14} />
        <CoreStructure
          motion={motion}
          compact={compact}
          interactive={interactive}
          scrollDriven={scrollDriven}
        />
      </Canvas>
    </div>
  );
}
