interface ImportMetaEnv {
  /** Google Analytics 4 measurement ID (G-…); leave unset to turn analytics off. */
  readonly PUBLIC_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
