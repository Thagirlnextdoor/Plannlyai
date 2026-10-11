import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        ink: "#1E1E1E",
        muted: "#6B6B6B",
        line: "#E8E4DC",
        primary: "#0F766E",
        success: "#15803D",
        warm: "#D97706",
        danger: "#DC2626",
      },
      borderRadius: { card: "12px" },
    },
  },
  plugins: [],
};
export default config;
