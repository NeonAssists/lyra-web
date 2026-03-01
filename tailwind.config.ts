import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        surface2: '#1c1c1e',
        border: 'rgba(255,255,255,0.08)',
        accent: '#6C63FF',
        'text-secondary': '#8E8E93',
        'text-tertiary': '#48484A',
        'rating-green': '#34C759',
        'rating-yellow': '#FFD60A',
        'rating-red': '#FF453A',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderColor: { DEFAULT: 'rgba(255,255,255,0.08)' },
    },
  },
  plugins: [],
};

export default config;
