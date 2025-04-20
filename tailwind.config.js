import daisyui from 'daisyui'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  darkMode: 'media',
  daisyui: {
    themes: ['light', 'dark'], 
    darkTheme: 'dark',        
  },
}
