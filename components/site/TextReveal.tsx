"use client";

import { motion, useReducedMotion } from "framer-motion";

export type RevealLine = { text: string; className?: string };

export function TextReveal({
  lines,
  className = "",
  delay = 0,
  as: Tag = "h1",
}: {
  lines: RevealLine[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3";
}) {
  const reduceMotion = useReducedMotion();
  const Heading = Tag;

  return (
    <Heading className={className}>
      {lines.map((line, index) => (
        <span key={line.text} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className={`block will-change-transform ${line.className ?? ""}`}
            initial={reduceMotion ? false : { y: "110%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: reduceMotion ? 0 : 0.85,
              delay: reduceMotion ? 0 : delay + index * 0.09,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line.text}
          </motion.span>
        </span>
      ))}
    </Heading>
  );
}
