/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'nunito': ['Nunito Sans', 'sans-serif'],
      },
      colors: {
        primary: '#00A8E8',
        secondary: '#2ECC71',
        'yes-button': '#2ECC71',
        'no-button': '#E74C3C',
        'dark-bg': '#0D1117',
        'dark-card': '#1E1E1E',
        'dark-hover': '#2A2A2A',
      }
    },
  },
  plugins: [],
}
