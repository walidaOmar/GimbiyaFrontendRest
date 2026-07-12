/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand — extracted from logo ──────────────────────────────────
        forest:      '#0D4A3A',   // Logo background green
        'forest-d':  '#092E24',   // Deeper forest for gradients
        'forest-l':  '#155C49',   // Lighter forest for hover
        brass:       '#C8A84B',   // Burnished gold — primary accent
        'brass-l':   '#E8C86B',   // Light brass — hover / highlights
        'brass-d':   '#A08535',   // Dark brass — pressed states
        'brass-dim': '#7A6530',   // Dimmed brass — labels / metadata

        // ── Midnight surfaces — dashboards ───────────────────────────────
        midnight:    '#050510',
        surface:     '#0D0D1F',
        'surface-h': '#12122A',
        border:      '#1E1E3F',

        // ── Text ─────────────────────────────────────────────────────────
        'text-p':    '#E8E8F0',
        'text-m':    '#9B9BB8',
        'text-d':    '#3A3A5A',

        // ── Status ───────────────────────────────────────────────────────
        success:     '#00D98B',
        warning:     '#F59E0B',
        danger:      '#EF4444',
        info:        '#3B82F6',

        // ── Role accent colors ────────────────────────────────────────────
        'role-ceo':        '#C8A84B',
        'role-coord':      '#8B5CF6',
        'role-merchant':   '#3B82F6',
        'role-stock':      '#10B981',
        'role-rider':      '#F59E0B',
        'role-affiliate':  '#EC4899',
        'role-buyer':      '#06B6D4',
      },

      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      backgroundImage: {
        'forest-gradient':  'linear-gradient(135deg, #092E24 0%, #0D4A3A 50%, #155C49 100%)',
        'midnight-gradient':'linear-gradient(135deg, #050510 0%, #0D0D1F 100%)',
        'brass-gradient':   'linear-gradient(135deg, #A08535 0%, #C8A84B 50%, #E8C86B 100%)',
        'hero-gradient':    'radial-gradient(ellipse at center top, #155C49 0%, #0D4A3A 40%, #050510 100%)',
      },

      boxShadow: {
        'brass':     '0 0 20px rgba(200,168,75,0.25)',
        'brass-lg':  '0 0 40px rgba(200,168,75,0.35)',
        'forest':    '0 0 20px rgba(13,74,58,0.4)',
        'glow-sm':   '0 0 8px rgba(200,168,75,0.4)',
        'glow-md':   '0 0 16px rgba(200,168,75,0.3)',
        'card':      '0 4px 24px rgba(0,0,0,0.4)',
      },

      animation: {
        'ticker':         'ticker 30s linear infinite',
        'shimmer':        'shimmer 3s ease-in-out infinite',
        'pulse-brass':    'pulseBrass 2s ease-in-out infinite',
        'fade-up':        'fadeUp 0.5s ease-out forwards',
        'spin-slow':      'spin 8s linear infinite',
        'glow':           'glow 2s ease-in-out infinite alternate',
      },

      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        pulseBrass: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(200,168,75,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(200,168,75,0.7)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%':   { textShadow: '0 0 4px rgba(200,168,75,0.4)' },
          '100%': { textShadow: '0 0 20px rgba(200,168,75,0.9)' },
        },
      },

      borderRadius: {
        'card': '12px',
        'btn':  '8px',
      },
    },
  },
  plugins: [],
}
