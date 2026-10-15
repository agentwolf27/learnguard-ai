import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f7f4ef",
        line: "#d8d2c7",
        forest: "#1f7a5a",
        coral: "#d45d4c",
        gold: "#b7791f",
        sky: "#2f6fbb"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
