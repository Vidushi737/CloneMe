/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f8fafc',
          dark: '#0b0f19'
        },
        card: {
          light: '#ffffff',
          dark: '#161e31'
        },
        border: {
          light: '#e2e8f0',
          dark: '#27354f'
        },
        accent: {
                primary: '#6366f1', // Indigo
    
                secondary: '#a855f7', // Violet
  
                success: '#10b981', // Emerald
  
                warning: '#f59e0b', // Amber
  
                danger: '#ef4444' // Rose
}
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
