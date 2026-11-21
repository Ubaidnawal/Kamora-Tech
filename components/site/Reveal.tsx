"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  variant?: "rise" | "fade" | "scale" | "clip";
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 30,
  duration = 0.7,
  variant = "rise",
}: RevealProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style = {
    "--reveal-y": `${y}px`,
    "--reveal-duration": `${duration}s`,
    "--reveal-delay": visible ? `${delay}s` : "0s",
  } as CSSProperties;

  return (
    <div
      ref={nodeRef}
      data-variant={variant}
      className={`reveal${visible ? " is-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
