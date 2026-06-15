/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",   // Next.js app router
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0a2352", // ⭐ important
          50: "#eef2f8",
          100: "#d4ddef",
          200: "#a9bbdf",
          300: "#7e99cf",
          400: "#5477bf",
          500: "#0a2352",
          600: "#091f49",
          700: "#071a3d",
          800: "#061631",
          900: "#040f21",
        },
      },
    },
  },
  plugins: [],
};