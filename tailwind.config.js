/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kpm: {
          blue: '#0B3C5D',
          navy: '#1D2731',
          gold: '#D9B310',
          red: '#C0392B',
          light: '#F4F7F6',
        },
      },
    },
  },
  plugins: [],
}
