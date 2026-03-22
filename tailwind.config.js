/* tailwind configuration file */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"], // busca las clases en todos los HTML y JS en todas las subcarpetas
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          600: '#004e92',
          800: '#003366',
          900: '#00264d',
        }
      }
    }
  },
  plugins: [],
}