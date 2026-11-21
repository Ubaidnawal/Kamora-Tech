import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        13: "3.25rem",
      },
      colors: {
        background: "#0B0B0B",
        surface: "#0B0B0B",
        ink: {
          DEFAULT: "#0B0B0B",
          deep: "#0B0B0B",
          soft: "#0B0B0B",
          raised: "#0B0B0B",
          line: "#8B0D1A",
        },
        paper: {
          DEFAULT: "#F5F2ED",
          pure: "#F5F2ED",
          dim: "#F5F2ED",
          faint: "#F5F2ED",
        },
        brass: {
          DEFAULT: "#8B0D1A",
          soft: "#8B0D1A",
          deep: "#8B0D1A",
        },
        burgundy: "#8B0D1A",
        cream: "#F5F2ED",
        white: "#F5F2ED",
        black: "#0B0B0B",
        red: {
          200: "#8B0D1A",
          300: "#8B0D1A",
          400: "#8B0D1A",
        },
      },
      borderColor: {
        DEFAULT: "#8B0D1A",
      },
      ringColor: {
        DEFAULT: "#8B0D1A",
      },
      fontFamily: {
        display: ["var(--font-oswald)", "Arial Narrow", "sans-serif"],
        condense: ["var(--font-oswald)", "Arial Narrow", "sans-serif"],
        title: ["var(--font-oswald)", "Arial Narrow", "sans-serif"],
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
      },
      maxWidth: {
        site: "1440px",
      },
      letterSpacing: {
        tightest: "-0.02em",
        wider2: "0.18em",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        scrollpulse: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.3" },
          "50%": { transform: "translateY(9px)", opacity: "1" },
        },
        spin_slow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        scrollpulse: "scrollpulse 2.2s ease-in-out infinite",
        "spin-slow": "spin_slow 30s linear infinite",
        float: "float 7s ease-in-out infinite",
        scan: "scan 5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
