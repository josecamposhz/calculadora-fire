/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        bg:       '#0a0c0f',
        surface:  '#111318',
        surface2: '#181b22',
        border:   '#1e2330',
        gold:     '#c9a84c',
        emerald:  '#4caf90',
        blue:     '#5b8dee',
        muted:    '#6b7280',
        danger:   '#e05c5c',
        ink:      '#e8e4da',
      },
    },
  },
  plugins: [],
};
