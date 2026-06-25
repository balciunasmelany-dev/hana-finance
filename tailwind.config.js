/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dancheong: {
          red:  '#C0392B',
          teal: '#1A7A6E',
          gold: '#C9920A',
          blue: '#2C5F8A',
        },
        sakura: {
          light: '#FFF0F5',
          mid:   '#FFB7C5',
          deep:  '#E8899A',
        },
        hanji: {
          DEFAULT: '#FBF5E6',
          dark:    '#F0E8D5',
        },
        ink: {
          DEFAULT: '#2D2417',
          mid:     '#5C4A3A',
          light:   '#9E8872',
        },
        success: '#00C47D',
        warning: '#F5A623',
        danger:  '#E53E3E',
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(45,36,23,0.08)',
        'card-md': '0 8px 32px rgba(45,36,23,0.12)',
      },
    },
  },
  plugins: [],
}
