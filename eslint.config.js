import dx from "@eoussama/dx";



export default dx({
  astro: true,
  ignores: ["archive/**", "scripts/**", "_site/**", "dist/**"],
}, {
  // Command-line tools report to the terminal.
  files: ["tools/**"],
  rules: {
    "no-console": "off",
  },
}, {
  // A code sample in a post shows a file as it is written, not as this site lays out
  // its own code: no house rule spacing what readers see.
  files: ["**/*.md/**"],
  rules: {
    "import/newline-after-import": "off",
  },
});
