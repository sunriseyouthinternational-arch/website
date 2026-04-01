/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Design System Colors
        primary: '#6a5f00',
        'primary-container': '#ffe950',
        'primary-fixed': '#fae44b',
        'primary-fixed-dim': '#dcc830',
        'on-primary': '#ffffff',
        'on-primary-container': '#746800',
        'on-primary-fixed': '#201c00',
        'on-primary-fixed-variant': '#504700',

        secondary: '#5f5e5e',
        'secondary-container': '#e2dfde',
        'secondary-fixed': '#e5e2e1',
        'secondary-fixed-dim': '#c8c6c5',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#636262',
        'on-secondary-fixed': '#1b1c1c',
        'on-secondary-fixed-variant': '#474746',

        tertiary: '#5d5f5f',
        'tertiary-container': '#e7e7e7',
        'tertiary-fixed': '#e2e2e2',
        'tertiary-fixed-dim': '#c6c6c7',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#666768',
        'on-tertiary-fixed': '#1a1c1c',
        'on-tertiary-fixed-variant': '#454747',

        surface: '#fff9ea',
        'surface-bright': '#fff9ea',
        'surface-dim': '#f1db43',
        'surface-container': '#ffef92',
        'surface-container-low': '#fff4c0',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#ffea59',
        'surface-container-highest': '#fae44b',
        'surface-variant': '#fae44b',
        'surface-tint': '#6a5f00',
        'on-surface': '#201c00',
        'on-surface-variant': '#4b4734',

        background: '#fff9ea',
        'on-background': '#201c00',

        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        outline: '#7c7762',
        'outline-variant': '#cdc7ae',

        'inverse-surface': '#373100',
        'inverse-on-surface': '#fff2a9',
        'inverse-primary': '#dcc830',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        headline: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        label: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      boxShadow: {
        'ambient': '0 12px 40px 0 rgba(32, 28, 0, 0.06)',
        'ambient-lg': '0 12px 24px rgba(32, 28, 0, 0.2)',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
