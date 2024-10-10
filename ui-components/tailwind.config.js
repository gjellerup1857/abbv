/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{js,ts,jsx,tsx}",

    // Tailwind support for Storybook and Docs directories
    "./.storybook/**/*.{js,jsx,ts,tsx}",
    "./docs/**/*.{js,jsx,ts,tsx}",

    // Paths outside the package root
    "../host/adblock/adblock-betafish/**/*.{jsx,tsx}", // Include React components from host/adblock
    "!../host/adblock/node_modules/**", // Exclude node_modules from host/adblock
    "../host/adblockplus/**/*.{jsx,tsx}", // Include React components from host/adblockplus
    "!../host/adblockplus/node_modules/**", // Exclude node_modules from host/adblockplus
  ],
  theme: {
    extend: {
      // We can take these out of extend and put in theme once we have all the colors we want
      // if we want to prohibit other Tailwind-defined colors
      colors: {
        "theme-primary": "rgb(var(--theme-primary))",
        "theme-secondary": "rgb(var(--theme-secondary))",
        "theme-text-primary": "rgb(var(--theme-text-primary))",
        "theme-text-secondary": "rgb(var(--theme-text-secondary))",
        "theme-link-color": "rgb(var(--theme-link-color))",
        "theme-accent-dark": "rgb(var(--theme-accent-dark))",
        "theme-accent-light": "rgb(var(--theme-accent-light))",
        "theme-text-accent": "rgb(var(--theme-text-accent))",
        "theme-button-primary": "rgb(var(--theme-button-primary))",
        "theme-button-secondary": "rgb(var(--theme-button-secondary))",

        // Error color
        "error": "rgb(var(--error))",
        // Foreground content color to use on error color
        "error-content": "rgb(var(--error-content))",
      },
      fontFamily: {
       "sans": "var(--extension-font-family)",
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
