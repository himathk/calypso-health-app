/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        elevated: v('elevated'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        coral: v('coral'),
        peach: v('peach'),
        aqua: v('aqua'),
        violet: v('violet'),
        lime: v('lime'),
        sun: v('sun'),
      },
      fontFamily: {
        display: ['"Outfit Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgb(var(--coral) / 0.55)',
        'glow-aqua': '0 0 40px -8px rgb(var(--aqua) / 0.55)',
        card: '0 10px 40px -12px rgb(0 0 0 / 0.35)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
      },
    },
  },
  plugins: [],
};
