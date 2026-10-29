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
        background: "var(--background)",
        foreground: "var(--foreground)",
        aisle: {
          charcoal: "#1C1917",
          ink: "#23201D",
          warm: "#2C2523",
          gold: "#C59B27",
          "gold-deep": "#9E7B1A",
          "gold-light": "#F2D888",
          terracotta: "#9E5A44",
          olive: "#5F6F52",
          navy: "#0F172A",
          blush: "#E8C8C0",
          cream: "#FAF7F2",
          sand: "#F4EDE2",
          linen: "#F7F5F0",
          border: "#E8E1D7",
          muted: "#78716C",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        editorial: ["var(--font-cormorant)", "serif"],
        script: ["var(--font-script)", "cursive"],
      },
      boxShadow: {
        'wedding': '0 4px 20px -2px rgba(44, 37, 35, 0.05), 0 2px 6px -1px rgba(44, 37, 35, 0.03)',
        'wedding-lg': '0 20px 40px -15px rgba(44, 37, 35, 0.1), 0 0 1px 1px rgba(44, 37, 35, 0.04)',
        'wax': '0 4px 14px 0 rgba(158, 90, 68, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        'phone': '0 25px 60px -15px rgba(28, 25, 23, 0.35), 0 0 0 1px rgba(28, 25, 23, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
