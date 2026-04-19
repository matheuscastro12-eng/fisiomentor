/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Clinical Curator - Surface colors
        surface: '#061423',
        'surface-container': '#0a1f33',
        'surface-container-high': '#0f2b45',

        // Clinical Curator - Primary colors
        primary: '#42dec3',
        'on-primary': '#061423',

        // Clinical Curator - Secondary colors
        secondary: '#8b9db3',
        'on-secondary': '#061423',

        // Clinical Curator - Status colors
        error: '#ff6b6b',
        warning: '#ffa726',
        success: '#66bb6a',

        // Clinical Curator - Surface text
        'on-surface': '#e8eef4',
        'on-surface-variant': '#8b9db3',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
