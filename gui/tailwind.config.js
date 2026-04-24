/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#121212',
          card: '#1e1e1e',
          hover: '#2a2a2a',
          border: '#333333'
        },
        primary: {
          DEFAULT: '#7b68ee', // SaaS Purple
          hover: '#6a5acd'
        },
        secondary: '#e0e0e0'
      }
    },
  },
  plugins: [],
}
