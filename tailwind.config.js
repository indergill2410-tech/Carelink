/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f4f7fb',
        navy: '#0f2a44',
        teal: '#028090',
        mint: '#4fd1b2',
      }
    },
  },
  plugins: [],
}