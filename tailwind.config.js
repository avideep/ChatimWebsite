import colors from 'tailwindcss/colors';

/*
 * Palette derived from the Chatim logo:
 *   marigold #FBB802 · vermilion #E75B11 · terracotta #D7510C · peach-cream #FEDEBD
 *   dusty blush (the pink brush stroke) · ink line-art · leaf green
 * Used minimally: warm ivory canvas, ink typography, terracotta for actions,
 * marigold only as a small accent.
 */
const sand = { // replaces Tailwind's pink scale everywhere (tints, borders, hovers)
  50: '#FBF6EE', 100: '#F5EADB', 200: '#EBD8C0', 300: '#DEBE9B', 400: '#CF9C70',
  500: '#BF7C4A', 600: '#A0623A', 700: '#7F4C2F', 800: '#5E3824', 900: '#3F261A', 950: '#2A190F',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        gray: colors.stone, // warm neutrals instead of cool greys
        pink: sand,
        rose: sand,
        chatim: {
          ink: '#1F1B17',        // logo line-art
          ivory: '#FBF6EE',      // page canvas
          paper: '#FFFDF9',      // raised surfaces
          sand: '#F3E6D4',       // image wells, quiet fills
          line: '#E9DCCB',       // hairline borders
          peach: '#FDE7D2',      // logo cream-peach tint
          blush: '#F2C6BC',      // logo brush stroke
          clay: '#C24E17',       // terracotta – primary action (AA with white text)
          clayDark: '#9C3D11',   // hover / text-on-light
          clayDeep: '#74300F',
          vermilion: '#E75B11',  // logo band, used sparingly
          marigold: '#F6B114',   // logo sun, accents only
          marigoldLight: '#FFF1CF',
          leaf: '#4F7A3A',       // logo sprig
          muted: '#6F665D',
        },
      },
      borderRadius: { '3xl': '1.25rem' },
      boxShadow: {
        soft: '0 1px 2px rgba(31,27,23,.04), 0 8px 24px -16px rgba(31,27,23,.18)',
        card: '0 22px 40px -24px rgba(31,27,23,.35)',
      },
      letterSpacing: { luxe: '0.22em' },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        fadeIn: 'fadeIn .25s ease-out',
        slideUp: 'slideUp .5s cubic-bezier(.2,.7,.2,1) both',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
