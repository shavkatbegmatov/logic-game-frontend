/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gate-and': '#3B82F6',
        'gate-or': '#10B981',
        'gate-not': '#EF4444',
        'gate-xor': '#8B5CF6',
        'gate-nand': '#F59E0B',
        'gate-nor': '#EC4899',
        'wire-active': '#22C55E',
        'wire-inactive': '#6B7280',
      },
      animation: {
        'pulse-signal': 'pulseSignal 1s infinite',
      },
      keyframes: {
        pulseSignal: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        }
      }
    },
  },
  plugins: [],
}