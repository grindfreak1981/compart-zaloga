import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        compart: {
          red: {
            50: '#fdf2f4',
            500: '#c41230',
            600: '#a00e26',
          },
          dark: {
            900: '#1c1c1c',
            950: '#111827',
          },
        },
      },
    },
  },
}
export default config
