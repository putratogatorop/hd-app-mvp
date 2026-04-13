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
        "hd-burgundy": "#650A30",
        "hd-burgundy-dark": "#40061E",
        "hd-burgundy-light": "#801237",
        "hd-gold": "#B8922A",
        "hd-gold-light": "#F5E6C8",
        "hd-cream": "#FEF2E3",
        "hd-cream-deep": "#F4E3CA",
        "hd-ink": "#1A1414",
        "hd-dark": "#2B2B2B",
        "hd-paper": "#FBF6EC",
      },
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Instrument Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3.5rem, 10vw, 6.5rem)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.5rem, 7vw, 4.5rem)", { lineHeight: "0.95", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(2rem, 5vw, 3rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "eyebrow": ["0.6875rem", { lineHeight: "1", letterSpacing: "0.22em" }],
      },
      letterSpacing: {
        "editorial": "-0.02em",
        "wide-editorial": "0.22em",
      },
      boxShadow: {
        "editorial": "0 1px 0 rgba(26, 20, 20, 0.08), 0 24px 48px -24px rgba(64, 6, 30, 0.25)",
        "paper": "0 1px 2px rgba(26, 20, 20, 0.06), 0 12px 32px -16px rgba(26, 20, 20, 0.18)",
        "inset-rule": "inset 0 -1px 0 rgba(26, 20, 20, 0.12)",
      },
      animation: {
        "reveal-up": "revealUp 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "reveal-fade": "revealFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "curtain": "curtain 1.1s cubic-bezier(0.76, 0, 0.24, 1) both",
        "grain-shift": "grainShift 8s steps(6) infinite",
      },
      keyframes: {
        revealUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        revealFade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        curtain: {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "100%": { transform: "scaleY(1)", transformOrigin: "top" },
        },
        grainShift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "20%": { transform: "translate(-2%, 3%)" },
          "40%": { transform: "translate(3%, -2%)" },
          "60%": { transform: "translate(-1%, 2%)" },
          "80%": { transform: "translate(2%, 1%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
