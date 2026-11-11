/**
 * The site's languages, in the order the language menu lists them. English is the
 * default: its pages live at the root, every other language under /p/<code>/.
 */
export const LANGS = [
  { code: "ar", name: "العربية", short: "AR", dir: "rtl", hello: "مرحبا!" },
  { code: "ary", name: "الدارجة", short: "ARY", dir: "rtl", hello: "سلام!" },
  { code: "en", name: "English", short: "EN", dir: "ltr", hello: "Hi!" },
  { code: "fr", name: "Français", short: "FR", dir: "ltr", hello: "Salut !" },
  { code: "es", name: "Español", short: "ES", dir: "ltr", hello: "¡Hola!" },
  { code: "it", name: "Italiano", short: "IT", dir: "ltr", hello: "Ciao!" },
  { code: "ja", name: "日本語", short: "JA", dir: "ltr", hello: "やあ！" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];

export const DEFAULT_LANG: Lang = "en";

/** The order the greeting cycles through, starting from the page's own language. */
export const HELLO_ORDER: Lang[] = ["en", "fr", "es", "it", "ja", "ar", "ary"];

/**
 * A language's details.
 *
 * @param code - The language's code
 * @returns Its name, short label, direction and greeting
 */
export function langInfo(code: Lang) {
  return LANGS.find(l => l.code === code) ?? LANGS[2];
}

/**
 * Whether a value is one of the site's language codes.
 *
 * @param value - The value to check
 * @returns True for a supported language code
 */
export function isLang(value: unknown): value is Lang {
  return LANGS.some(l => l.code === value);
}
