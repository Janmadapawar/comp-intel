/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08090a",
        card: "#0f1012",
        border: "#1c1e21",
        muted: "#252729",
        accent: "#00e5a0",
        "accent-dim": "rgba(0,229,160,0.12)",
        "accent-glow": "rgba(0,229,160,0.25)",
        faint: "#888e96",
        sub: "#555c63",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "slide-up": "slideUp 0.4s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        pulse2: "pulse2 2s ease-in-out infinite",
      },
      keyframes: {
        slideUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        pulse2: {
          "0%,100%": { opacity: 0.5 },
          "50%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
