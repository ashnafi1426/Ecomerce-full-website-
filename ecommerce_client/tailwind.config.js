/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'amazon-orange': '#FF9900',
        'amazon-dark': '#131921',
        'amazon-light': '#232F3E',
        'amazon-blue': '#146EB4',
      },
    },
  },
  plugins: [],
}
