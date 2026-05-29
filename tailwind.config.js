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
        // Brand
        navy:  '#07111F',
        teal:  '#00C9A7',
        mint:  '#5EEBD4',
        // Semantic
        ink:      '#07111F',
        electric: '#00C9A7',
        'electric-dim': '#008F78',
        // Surface
        surface: {
          0: '#FFFFFF',
          1: '#F8FAFB',
          2: '#EFF2F6',
          3: '#E4E9F0',
        },
        // Role colors
        nurse:    '#0EA5E9',
        en:       '#8B5CF6',
        pca:      '#F59E0B',
        // Status
        'status-pending':    '#F59E0B',
        'status-matched':    '#00C9A7',
        'status-clocked':    '#3B82F6',
        'status-completed':  '#10B981',
        'status-cancelled':  '#94A3B8',
        'status-urgent':     '#F43F5E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(7,17,31,0.07), 0 0 1px rgba(7,17,31,0.05)',
        'card-hover': '0 8px 24px rgba(7,17,31,0.12), 0 2px 6px rgba(7,17,31,0.06)',
        'modal':      '0 32px 80px rgba(7,17,31,0.28), 0 0 1px rgba(7,17,31,0.1)',
        'btn':        '0 2px 8px rgba(0,201,167,0.28)',
        'btn-hover':  '0 4px 20px rgba(0,201,167,0.45)',
        'glow-electric': '0 0 20px rgba(0,201,167,0.40)',
        'glow-blue':     '0 0 20px rgba(59,130,246,0.40)',
        'glow-rose':     '0 0 20px rgba(244,63,94,0.40)',
        'focus':         '0 0 0 3px rgba(0,201,167,0.25)',
        'inner-top':     'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      backgroundImage: {
        'gradient-electric':  'linear-gradient(135deg, #00C9A7 0%, #007A66 100%)',
        'gradient-navy':      'linear-gradient(180deg, #0E1E34 0%, #07111F 100%)',
        'gradient-navy-rich': 'linear-gradient(135deg, #0E1E34 0%, #0A1628 50%, #070F1C 100%)',
        'gradient-mesh':      'radial-gradient(ellipse at 20% 50%, rgba(0,201,167,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.10) 0%, transparent 50%)',
        'gradient-nurse':     'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
        'gradient-facility':  'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
        'gradient-worker':    'linear-gradient(135deg, #00C9A7 0%, #008F78 100%)',
        'shimmer':            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-800px 0' },
          '100%': { backgroundPosition: '800px 0' },
        },
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(0,201,167,0.45)' },
          '70%':  { boxShadow: '0 0 0 7px rgba(0,201,167,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0,201,167,0)' },
        },
        'pulse-ring-blue': {
          '0%':   { boxShadow: '0 0 0 0 rgba(59,130,246,0.45)' },
          '70%':  { boxShadow: '0 0 0 7px rgba(59,130,246,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(-14deg)' },
          '35%': { transform: 'rotate(10deg)' },
          '55%': { transform: 'rotate(-7deg)' },
          '75%': { transform: 'rotate(4deg)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in-up':   'fade-in-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':      'fade-in 0.25s ease-out both',
        shimmer:        'shimmer 1.6s linear infinite',
        'pulse-ring':   'pulse-ring 1.8s ease-out infinite',
        'pulse-ring-blue': 'pulse-ring-blue 1.8s ease-out infinite',
        wiggle:         'wiggle 0.5s ease-in-out',
        'scale-in':     'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':   'slide-down 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'count-up':     'count-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'gradient-x':   'gradient-x 4s ease infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
