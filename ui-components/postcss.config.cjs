module.exports = {
  plugins: [
    require('postcss-import'),

    // // Plugin for allowing nested CSS rules
    // // See: https://tailwindcss.com/docs/using-with-preprocessors#nesting
    // require('tailwindcss/nesting'),

    // // Plugin for applying Tailwind CSS classes only inside the .react-app class
    // // TODO: remove this after fully migrated to Tailwind CSS in both extensions
    // require('postcss-prefix-selector')({
    //   prefix: '.react-app',
    //   // Only change the index.css file not to break storybook styles
    //   includeFiles: ['index.css'],
    // }),

    require('tailwindcss'),
    require('autoprefixer'),
  ]
}
