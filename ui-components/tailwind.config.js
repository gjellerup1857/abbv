/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./scratchpad/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{js,ts,jsx,tsx}",

    // Tailwind support for Storybook and Docs directories
    "./website/**/*.{js,ts,jsx,tsx}",
    "./.storybook/**/*.{js,jsx,ts,tsx}",
    "./docs/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // We can take these out of extend and put in theme once we have all the colors we want
      // if we want to prohibit other Tailwind-defined colors
      colors: {
        "theme-primary": "var(--theme-primary)",
        "theme-secondary": "var(--theme-secondary)",
        "theme-text-primary": "var(--theme-text-primary)",
        "theme-text-secondary": "var(--theme-text-secondary)",
        "theme-link-color": "var(--theme-link-color)",
        "theme-accent-dark": "var(--theme-accent-dark)",
        "theme-accent-light": "var(--theme-accent-light)",
        "theme-text-accent": "var(--theme-text-accent)",
        "theme-button-primary": "var(--theme-button-primary)",
        "theme-button-secondary": "var(--theme-button-secondary)",
      },
    },
  },
  plugins: [],
}
