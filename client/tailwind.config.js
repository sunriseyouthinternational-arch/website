/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6a5f00',
        'primary-container': '#ffe950',
        surface: '#fff9ea',
        'surface-container': '#ffef92',
        'surface-container-low': '#fff4c0',
        'surface-container-lowest': '#ffffff',
        'surface-container-highest': '#fae44b',
        'on-surface': '#201c00',
        'on-surface-variant': '#4b4734',
        'on-primary': '#ffffff',
        'on-background': '#201c00',
        secondary: '#5f5e5e',
        'secondary-container': '#e0e0e0',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'outline-variant': '#cdc7ae',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '2rem',
        '3xl': '3rem',
      },
      boxShadow: {
        'ambient': '0 12px 40px 0 rgba(32, 28, 0, 0.06)',
        'ambient-lg': '0 12px 24px rgba(32, 28, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
