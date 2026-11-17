/**
 * Where to find Oussama, shared by the home page and the command menu. Pages link to,
 * and show, these through their short links (lib/short-links.ts).
 */
export const PROFILE = {
  email: "hi@ouss.es",
  site: "https://ouss.es",
  github: "https://github.com/eoussama",
  linkedin: "https://www.linkedin.com/in/eoussama",
  behance: "https://www.behance.net/eoussama",
  dribbble: "https://dribbble.com/EOussama",
  figma: "https://www.figma.com/@eoussama",
  /** The CV page, printed to PDF, inside the site under /p/ like every page but the home page. */
  resume: "p/resume.pdf",
  /** Ways to support the work, the two the site offers (the repository's FUNDING.yml lists more). */
  sponsors: "https://github.com/sponsors/eoussama",
  paypal: "https://paypal.me/OussamaEssamadi",
} as const;
