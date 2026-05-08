/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#2D5F3F',
          light: '#A8C9A4',
          dark: '#1F4530',
        },
        terracotta: {
          DEFAULT: '#C97B4F',
          light: '#E0A584',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          dark: '#F0EBE2',
        },
        ink: {
          DEFAULT: '#1A1F1B',
          soft: '#4A524C',
          mute: '#7A8478',
        },
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        'display-bold': ['Fraunces_700Bold'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
    },
  },
  plugins: [],
};
