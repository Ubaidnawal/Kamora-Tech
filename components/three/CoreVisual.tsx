"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CoreFallback } from "./CoreFallback";

const CoreScene = dynamic(
  () => import("./CoreScene").then((module) => module.CoreScene),
  { ssr: false, loading: () => <CoreFallback /> },
);

function useSmallScreen() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setSmall(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return small;
}

export function CoreVisual({
  variant = "hero",
  className = "",
}: {
  variant?: "hero" | "accent";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const smallScreen = useSmallScreen();
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(variant !== "hero");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || reduceMotion) return;
    if (variant !== "hero") {
      setVisible(true);
      return;
    }
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [mounted, reduceMotion, variant]);

  if (!mounted || reduceMotion || !visible) {
    return (
      <div ref={hostRef} className={className} aria-hidden="true">
        <CoreFallback compact={variant === "accent"} />
      </div>
    );
  }

  return (
    <div ref={hostRef} className={className} aria-hidden="true">
      <CoreScene
        compact={smallScreen || variant === "accent"}
        interactive={variant === "hero" && !smallScreen}
        scrollDriven={variant === "accent"}
      />
    </div>
  );
}
