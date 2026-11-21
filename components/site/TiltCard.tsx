"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

export function TiltCard({
  children,
  className = "",
  max = 5,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse" || !host.current) return;
    const rect = host.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      host.current?.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
      host.current?.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
      host.current?.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
      host.current?.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
      frame.current = 0;
    });
  };

  const onLeave = () => {
    if (!host.current) return;
    host.current.style.setProperty("--rx", "0deg");
    host.current.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={host}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group/tilt [perspective:1200px] ${className}`}
    >
      <div
        className="relative h-full transform-gpu transition-transform duration-200 ease-editorial will-change-transform"
        style={{
          transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
        }}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{
            background:
              "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(139,13,26,0.08), transparent 65%)",
          }}
        />
      </div>
    </div>
  );
}
