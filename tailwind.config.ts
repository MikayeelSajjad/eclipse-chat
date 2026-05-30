import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        eclipse: {
          bg: "#020617",
          panel: "#0f172a",
          border: "#1e293b",
          glow: "#6366f1",
          cyan: "#22d3ee",
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.35)",
        "glow-cyan": "0 0 16px rgba(34, 211, 238, 0.25)",
      },
      animation: {
        "pulse-soft": "pulse-soft 1.5s ease-in-out infinite",
        "typing-dot": "typing-dot 1.4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
