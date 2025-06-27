module.exports = {
  content: [
    './src/**/*.{astro,js,ts,jsx,tsx}',
    './pages/**/*.{astro,js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Enable dark mode via class toggle
  theme: {
    extend: {
      colors: {
        'custom-dark': '#1a1a2e',
        'custom-accent': '#0f3460',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
};