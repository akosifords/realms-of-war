/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          600: 'rgb(255, 119, 0)', // From Figma design - #FF7700
        },
        purple: {
          500: '#6F62E2', // Purple for navigation links
        }
      },
      fontFamily: {
        jersey: ['Jersey 15', 'sans-serif'],
        'jersey-10': ['Jersey 10', 'sans-serif'],
      },
      fontSize: {
        // Custom font sizes from the Figma design
        '28': '28px',
        '40': '40px',
        '48': '48px',
        '56': '56px',
        '72': '72px',
      },
      borderRadius: {
        '38': '38px',
      }
    },
  },
  plugins: [],
} 