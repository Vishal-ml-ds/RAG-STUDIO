import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0a0b",
          panel: "#111114",
          raised: "#16161a",
          inset: "#0d0d10",
        },
        border: {
          DEFAULT: "#1f1f23",
          subtle: "#18181c",
          strong: "#2a2a31",
        },
        text: {
          primary: "#fafafa",
          secondary: "#a1a1aa",
          tertiary: "#71717a",
        },
        accent: {
          DEFAULT: "#7c3aed",
          hover: "#6d28d9",
          subtle: "#3b1e6b",
        },
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      backgroundImage: {
        "gradient-hero":
          "radial-gradient(ellipse at top, rgba(124,58,237,0.18), transparent 60%), radial-gradient(ellipse at bottom right, rgba(34,197,94,0.06), transparent 60%)",
      },
      boxShadow: {
        "panel": "0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.4)",
        "glow-accent": "0 0 0 1px rgba(124,58,237,0.6), 0 0 32px rgba(124,58,237,0.25)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
