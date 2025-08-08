/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'todo': '#ef4444',
        'doing': '#f59e0b', 
        'done': '#10b981',
      }
    },
  },
  plugins: [],
}