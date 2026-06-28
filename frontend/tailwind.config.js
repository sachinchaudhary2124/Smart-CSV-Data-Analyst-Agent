/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Zinc 950
        panel: '#18181b', // Zinc 900
        panelLight: '#27272a', // Zinc 800
        borderLight: 'rgba(63, 63, 70, 0.4)', // border-zinc-700/40
        primary: {
          DEFAULT: '#6366f1', // Indigo 500
          hover: '#4f46e5', // Indigo 600
          light: 'rgba(99, 102, 241, 0.1)',
        },
        success: {
          DEFAULT: '#10b981', // Emerald 500
          hover: '#059669',
          light: 'rgba(16, 185, 129, 0.1)',
        },
        accent: {
          DEFAULT: '#ec4899', // Pink 500
          purple: '#a855f7', // Purple 500
          cyan: '#06b6d4', // Cyan 500
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, rgba(63, 63, 70, 0.15) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid-size': '24px 24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'premium': '0 4px 20px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
