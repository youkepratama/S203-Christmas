/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'uph-green': '#00504C',
        'uph-green-light': '#2B746A',
        'uph-green-pale': '#EAF3F0',
        'uph-gold': '#BD8C00',
        'uph-amber': '#FFBF00',
        'uph-navy': '#0B004A',
        'uph-grey': '#333333',
      },
      fontFamily: {
        heading: ['Poppins', 'Montserrat', 'sans-serif'],
        body: ['Inter', 'Open Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
};
