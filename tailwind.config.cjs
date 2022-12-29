/** @type {import('tailwindcss').Config} */
const { withMaterialColors } = require("tailwind-material-colors");

module.exports = withMaterialColors(
  {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {},
    },
    plugins: [],
    darkMode: "class",
  },
  { primary: "#448aff" }
);
