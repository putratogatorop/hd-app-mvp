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
        "hd-dark": "#2B2B2B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
