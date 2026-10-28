/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        navy: {
          DEFAULT: '#153464',
          900: '#0b1e33',
          800: '#12263A',
          700: '#1B3348',
          600: '#1e3f5e',
        },
        charcoal: {
          DEFAULT: '#1e2530',
          800: '#2a3240',
          700: '#343d4e',
          600: '#4a5568',
        },
        brand: {
          DEFAULT: '#0d30a1',
          dark: '#0A2373',
          light: '#1B75BB',
          soft: '#E8F0FE',
        },
        // dark-red — the primary accent used for highlights, kickers, active states
        accent: {
          DEFAULT: '#8B1E35',
          dark: '#6d1728',
          soft: '#A12A42',
          muted: '#B21E36',
          light: '#f9e8eb',
        },
        sand: '#F6C9A8',
        // Light grays for section backgrounds
        stone: {
          50: '#f9f8f7',
          100: '#f2f0ed',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px rgba(10, 22, 40, 0.08)',
        card: '0 2px 12px rgba(14, 77, 181, 0.06), 0 1px 3px rgba(0,0,0,0.06)',
        elevated: '0 12px 40px rgba(10, 22, 40, 0.14)',
        glow: '0 0 32px rgba(14, 77, 181, 0.12)',
        'accent-glow': '0 0 24px rgba(139, 30, 53, 0.15)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      borderRadius: {
        // Engineering aesthetic: sharp but not brutalist
        DEFAULT: '0.25rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        full: '9999px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'logos-marquee': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'logo-ripple': {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '100%': { transform: 'scale(1.2)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'logos-marquee': 'logos-marquee var(--marquee-duration, 42s) linear infinite',
        'logo-ripple': 'logo-ripple 640ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
