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

/**
 * Two dates as one span, the way the page's language writes a range: "14 March 2021 –
 * 8 November 2026", shortened when they share a year ("21 July – 11 November 2026").
 *
 * @param from - When it began, as an ISO date
 * @param to - When it was last active, as an ISO date
 * @param lang - The page's language
 * @returns The span, spelled out
 */
export function formatSpan(from: string, to: string, lang: Lang): string {
  // Japanese ranges come out in figures ("2021/03/14～…"), unlike its dates elsewhere:
  // there, the two dates are written out and joined.
  if (lang === "ja") {
    return `${formatDate(new Date(from), lang)}～${formatDate(new Date(to), lang)}`;
  }

  return new Intl.DateTimeFormat(LOCALES[lang], { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).formatRange(new Date(from), new Date(to));
}
