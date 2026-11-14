import type { Lang } from "./langs";



/** On the days of Eid, the greeting each language gives then. */
export const EID: Record<Lang, string> = {
  en: "Eid Mubarak!",
  fr: "Aïd Moubarak !",
  es: "¡Eid Mubarak!",
  it: "Eid Mubarak!",
  ja: "イード・ムバラク！",
  ar: "عيد مبارك!",
  ary: "عواشر مبروكة!",
};

/** The greeting each language gives in the morning, the afternoon and the evening. */
export const DAY: Record<Lang, [string, string, string]> = {
  en: ["Good morning!", "Good afternoon!", "Good evening!"],
  fr: ["Bonjour !", "Bonjour !", "Bonsoir !"],
  es: ["¡Buenos días!", "¡Buenas tardes!", "¡Buenas noches!"],
  it: ["Buongiorno!", "Buongiorno!", "Buonasera!"],
  ja: ["おはよう！", "こんにちは！", "こんばんは！"],
  ar: ["صباح الخير!", "مساء الخير!", "مساء الخير!"],
  ary: ["صباح الخير!", "مسا الخير!", "مسا الخير!"],
};
