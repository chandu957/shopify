/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          50: '#f9f5f0',
          900: '#232f3e',
          950: '#131921',
          orange: '#f0c14b',
          yellow: '#febd69'
        }
      },
      fontFamily: {
        'amazon': ['Amazon Ember', 'sans-serif']
      }
    },
  },
  plugins: [],
}

