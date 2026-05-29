/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        navy: '#0f2a44',
        ink: '#07111f',
        teal: '#028090',
        mint: '#4fd1b2',
        electric: '#00c9a7',
        'electric-dim': '#008f78',
        'pulse-blue': '#3b82f6',
      }
    },
    boxShadow: {
      card: 'var(--shadow-card)',
      hover: 'var(--shadow-hover)',
      modal: 'var(--shadow-modal)',
      electric: 'var(--glow-electric)',
    },
    transitionTimingFunction: {
      spring: 'var(--ease-spring)',
    },
    keyframes: {
      shimmer: {
        '100%': { transform: 'translateX(100%)' },
      },
    },
    animation: {
      shimmer: 'shimmer 1.5s linear infinite',
    },
  },
  plugins: [],
}
