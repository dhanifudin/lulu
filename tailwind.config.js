/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pink / flower palette
        pink: {
          50:  '#FFF0F5',
          100: '#FFE5EC',
          200: '#FFC2D1',
          300: '#FF8FB1',
          400: '#FF6B9D',
          500: '#FF4785',
          600: '#E8316E',
          700: '#C71F58',
          800: '#A01245',
          900: '#7A0934',
        },
        cream: '#FFF7F0',
        // Accent: mint & lavender
        mint: {
          100: '#D8F5EC',
          300: '#B5EAD7',
          500: '#79D9B8',
        },
        lavender: {
          100: '#E8EAFF',
          300: '#C7CEEA',
          500: '#9BA3D5',
        },
        // Warm text
        plum: {
          700: '#5A3E4D',
          900: '#3B2132',
        },
      },
      fontFamily: {
        display: ['"Fredoka"', '"Nunito"', 'sans-serif'],
        body: ['"Nunito"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        flower: '0 4px 20px 0 rgba(255, 143, 177, 0.25)',
        'flower-lg': '0 8px 32px 0 rgba(255, 143, 177, 0.35)',
      },
      animation: {
        'bounce-soft': 'bounce 1s ease-in-out 2',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        pop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
