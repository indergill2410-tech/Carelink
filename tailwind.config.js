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
        // Brand — warm amber palette
        navy:  '#1C1917',
        teal:  '#D97706',
        mint:  '#FDE68A',
        // Semantic
        ink:      '#1C1917',
        electric: '#D97706',
        'electric-dim': '#B45309',
        // Surface — warm stone tones
        surface: {
          0: '#FFFCF7',
          1: '#FBF6EE',
          2: '#F4ECDD',
          3: '#EBE0CD',
        },
        // Secondary accent — sage (from the hero photo's greenery)
        sage: { 50:'#F4F6EE', 100:'#E5EAD7', 200:'#CFD8B6', 300:'#B2C08C', 400:'#96A86B', 500:'#7C8B5E', 600:'#647155', 700:'#4F594A', 800:'#3D4439' },
        // Tertiary accent — clay/dusty-rose (from the resident's cardigan), role-coding only
        clay: { 50:'#FAF1EF', 100:'#F3DED9', 200:'#E6C0B8', 300:'#D6A097', 400:'#C5897E', 500:'#B06E62', 600:'#915951', 700:'#714640', 800:'#553633' },
        // Role colors — all warm: RN amber · EN sage · PCA clay
        nurse:    '#D97706',
        en:       '#7C8B5E',
        pca:      '#B06E62',
        // Status
        'status-pending':    '#F59E0B',
        'status-matched':    '#10B981',
        'status-clocked':    '#7C8B5E',
        'status-completed':  '#10B981',
        'status-cancelled':  '#94A3B8',
        'status-urgent':     '#F43F5E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(28,25,23,0.07), 0 0 1px rgba(28,25,23,0.05)',
        'card-hover': '0 8px 24px rgba(28,25,23,0.12), 0 2px 6px rgba(28,25,23,0.06)',
        'modal':      '0 32px 80px rgba(28,25,23,0.28), 0 0 1px rgba(28,25,23,0.1)',
        'btn':        '0 2px 8px rgba(217,119,6,0.30)',
        'btn-hover':  '0 4px 20px rgba(217,119,6,0.45)',
        'glow-electric': '0 0 20px rgba(217,119,6,0.40)',
        'glow-blue':     '0 0 20px rgba(124,139,94,0.40)',
        'glow-rose':     '0 0 20px rgba(244,63,94,0.40)',
        'focus':         '0 0 0 3px rgba(217,119,6,0.25)',
        'inner-top':     'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      backgroundImage: {
        'gradient-electric':  'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
        'gradient-navy':      'linear-gradient(180deg, #292524 0%, #1C1917 100%)',
        'gradient-navy-rich': 'linear-gradient(135deg, #292524 0%, #1C1917 50%, #0C0A09 100%)',
        'gradient-mesh':      'radial-gradient(ellipse at 20% 50%, rgba(217,119,6,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124,139,94,0.12) 0%, transparent 50%)',
        'gradient-nurse':     'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
        'gradient-facility':  'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
        'gradient-worker':    'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
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
          '0%':   { boxShadow: '0 0 0 0 rgba(217,119,6,0.45)' },
          '70%':  { boxShadow: '0 0 0 7px rgba(217,119,6,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(217,119,6,0)' },
        },
        'pulse-ring-blue': {
          '0%':   { boxShadow: '0 0 0 0 rgba(124,139,94,0.45)' },
          '70%':  { boxShadow: '0 0 0 7px rgba(124,139,94,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(124,139,94,0)' },
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
