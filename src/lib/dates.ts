import type { Lang } from "~/i18n/langs";



/** The locale each language formats dates in; Arabic and Darija as in Morocco. */
const LOCALES: Record<Lang, string> = { ar: "ar-MA", ary: "ar-MA", en: "en-GB", fr: "fr-FR", es: "es-ES", it: "it-IT", ja: "ja-JP" };

/**
 * A date as the page's language writes it, such as "11 November 2026".
 *
 * @param date - The date
 * @param lang - The page's language
 * @returns The date, spelled out
 */
export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}
