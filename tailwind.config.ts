import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#140C08',
        surface: '#241410',
        elevated: '#2C1C14',
        border: '#402820',
        primary: '#D0884C',
        'primary-soft': '#38200C',
        'text-primary': '#F8F0D8',
        'text-secondary': '#C4B18A',
        muted: '#8E795A',
        'on-primary': '#140C08',
        selection: '#D0884C',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
        display: 'var(--font-display)',
      },
      borderRadius: {
        card: '0.5rem',
        'card-mobile': '1rem',
        button: '0.375rem',
        'button-pill': '999px',
        input: '0.25rem',
        'input-mobile': '0.75rem',
        badge: '0.25rem',
        'badge-pill': '999px',
        modal: '0.5rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
