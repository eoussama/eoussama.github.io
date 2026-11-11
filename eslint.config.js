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
});
