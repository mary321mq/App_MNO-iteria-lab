import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"],
        mono: ["Consolas", "Monaco", "monospace"],
      },
      colors: {
        navy: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          700: "#1d4ed8",
          900: "#0b1f3a",
          950: "#071528",
        },
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
