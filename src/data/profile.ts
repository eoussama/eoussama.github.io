/** Where to find Oussama, shared by the home page and the command menu. */
export const PROFILE = {
  email: "oussama.essamadi@gmail.com",
  site: "https://ouss.es",
  github: { url: "https://github.com/eoussama", label: "github.com/eoussama" },
  linkedin: { url: "https://www.linkedin.com/in/eoussama", label: "linkedin.com/in/eoussama" },
  /** The CV page, printed to PDF, inside the site under /p/ like every page but the home page. */
  resume: "p/resume.pdf",
  /** Ways to support the work, as in the repository's FUNDING.yml. */
  sponsors: "https://github.com/sponsors/eoussama",
  paypal: "https://paypal.me/OussamaEssamadi",
} as const;
