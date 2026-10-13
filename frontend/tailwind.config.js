/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0f172a",
        "surface-card": "#131e36",
        "surface-border": "#1e293b",
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          neon: "#00f0ff"
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
          neon: "#ff3366"
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b"
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.4)',
        'glow-coral': '0 0 25px -5px rgba(255, 51, 102, 0.4)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
      }
    },
  },
  plugins: [],
}
