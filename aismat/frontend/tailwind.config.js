/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Палітра прив'язана до CSS-змінних: при зміні data-theme на <html>
        // усі Tailwind-утиліти `bg-mint-500`, `text-mint-700`, `ring-mint-200`
        // автоматично перефарбовуються — без модифікацій компонентів.
        mint: {
          50: 'rgb(var(--mint-50) / <alpha-value>)',
          100: 'rgb(var(--mint-100) / <alpha-value>)',
          200: 'rgb(var(--mint-200) / <alpha-value>)',
          300: 'rgb(var(--mint-300) / <alpha-value>)',
          400: 'rgb(var(--mint-400) / <alpha-value>)',
          500: 'rgb(var(--mint-500) / <alpha-value>)',
          600: 'rgb(var(--mint-600) / <alpha-value>)',
          700: 'rgb(var(--mint-700) / <alpha-value>)',
          800: 'rgb(var(--mint-800) / <alpha-value>)',
          900: 'rgb(var(--mint-900) / <alpha-value>)',
          950: 'rgb(var(--mint-950) / <alpha-value>)',
        },
        brand: {
          50: 'rgb(var(--mint-50) / <alpha-value>)',
          100: 'rgb(var(--mint-100) / <alpha-value>)',
          500: 'rgb(var(--mint-500) / <alpha-value>)',
          600: 'rgb(var(--mint-600) / <alpha-value>)',
          700: 'rgb(var(--mint-700) / <alpha-value>)',
          900: 'rgb(var(--mint-900) / <alpha-value>)',
        },
        cream: {
          50: '#fefcf8',
          100: '#fdf7ed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        mint: '0 10px 30px -10px rgb(var(--mint-500) / 0.35)',
        'mint-lg': '0 25px 50px -12px rgb(var(--mint-500) / 0.4)',
        'mint-glow': '0 0 0 6px rgb(var(--mint-400) / 0.15), 0 10px 30px -10px rgb(var(--mint-500) / 0.35)',
        soft: '0 8px 24px -8px rgb(var(--mint-700) / 0.18)',
      },
      backgroundImage: {
        'mint-gradient':
          'linear-gradient(135deg, rgb(var(--mint-400)) 0%, rgb(var(--mint-500)) 50%, rgb(var(--mint-600)) 100%)',
        'mint-soft':
          'linear-gradient(135deg, rgb(var(--mint-50)) 0%, rgb(var(--mint-100)) 100%)',
        'mint-radial':
          'radial-gradient(circle at 30% 0%, rgb(var(--mint-300) / 0.45), transparent 55%), radial-gradient(circle at 80% 100%, rgb(var(--mint-500) / 0.35), transparent 50%), linear-gradient(180deg, rgb(var(--mint-50)) 0%, rgb(var(--mint-50)) 100%)',
        'mint-radial-dark':
          'radial-gradient(circle at 30% 0%, rgb(var(--mint-500) / 0.30), transparent 55%), radial-gradient(circle at 80% 100%, rgb(var(--mint-700) / 0.40), transparent 50%), linear-gradient(180deg, rgb(var(--mint-950)) 0%, rgb(var(--mint-900)) 100%)',
      },
      animation: {
        'float-slow': 'float 12s ease-in-out infinite',
        'float-slower': 'float 18s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -30px) scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
