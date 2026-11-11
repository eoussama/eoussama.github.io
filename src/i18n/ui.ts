import type { Lang } from "./langs";



/**
 * Interface strings, per language. English, Arabic, Darija and Japanese come from the
 * approved design; French, Spanish and Italian follow the English. Keys grow as each
 * part of the site is built.
 */
const en = {
  skip: "Skip to the content",
  name: "Oussama Essamadi",
  home: "Home",
  whoami: "Whoami",
  intro: " I'm Oussama, a software engineer. I build web, desktop and mobile apps, system programs, AI tools, cloud services and open-source tools.",
  hiAria: "Greeting. Select it for another language",
  anchor: ", link to this section",
  newTab: " (opens in a new tab)",
  copyright: "© 2026 Oussama Essamadi",
  signature: "Signature of Oussama Essamadi",
  palOpen: "Open the command menu",
  palTitle: "Command menu",
  language: "Language",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  auto: "Auto",
  versions: "Versions of this site",
  versionButton: "Site version 0.5, from 2026. Show all versions",
};

export type UI = typeof en;

const ar: UI = {
  skip: "انتقل إلى المحتوى",
  name: "أسامة الصمدي",
  home: "الرئيسية",
  whoami: "من أنا",
  intro: " أنا أسامة، مهندس برمجيات. أبني تطبيقات الويب وسطح المكتب والجوال، وبرامج النظام، وأدوات الذكاء الاصطناعي، والخدمات السحابية، وأدوات مفتوحة المصدر.",
  hiAria: "تحية. اخترها لتظهر بلغة أخرى",
  anchor: "، رابط إلى هذا القسم",
  newTab: " (يُفتح في علامة تبويب جديدة)",
  copyright: "© 2026 أسامة الصمدي",
  signature: "توقيع أسامة الصمدي",
  palOpen: "افتح قائمة الأوامر",
  palTitle: "قائمة الأوامر",
  language: "اللغة",
  theme: "المظهر",
  light: "فاتح",
  dark: "داكن",
  auto: "تلقائي",
  versions: "إصدارات هذا الموقع",
  versionButton: "إصدار الموقع 0.5، من 2026. اعرض كل الإصدارات",
};

const ary: UI = {
  ...ar,
  skip: "سير للمحتوى",
  home: "الصفحة الرئيسية",
  whoami: "شكون أنا",
  intro: " أنا أسامة، مهندس برمجيات. كنبني تطبيقات الويب وسطح المكتب والموبايل، وبرامج النظام، وأدوات الذكاء الاصطناعي، والخدمات السحابية، وأدوات مفتوحة المصدر.",
  hiAria: "تحية. ختارها باش تبان بلغة أخرى",
  anchor: "، رابط لهاد القسم",
  newTab: " (كيتحل ف تبويب جديد)",
  palOpen: "حلّ قائمة الأوامر",
  dark: "غامق",
  auto: "أوتوماتيك",
  versions: "نسخ هاد الموقع",
  versionButton: "نسخة الموقع 0.5، ديال 2026. وريني كاع النسخ",
  signature: "التوقيع ديال أسامة الصمدي",
};

const fr: UI = {
  skip: "Aller au contenu",
  name: "Oussama Essamadi",
  home: "Accueil",
  whoami: "Qui suis-je",
  intro: " Je suis Oussama, ingénieur logiciel. Je crée des applications web, de bureau et mobiles, des programmes système, des outils d’IA, des services cloud et des outils open source.",
  hiAria: "Salutation. Sélectionnez-la pour une autre langue",
  anchor: ", lien vers cette section",
  newTab: " (s’ouvre dans un nouvel onglet)",
  copyright: "© 2026 Oussama Essamadi",
  signature: "Signature d’Oussama Essamadi",
  palOpen: "Ouvrir le menu des commandes",
  palTitle: "Menu des commandes",
  language: "Langue",
  theme: "Thème",
  light: "Clair",
  dark: "Sombre",
  auto: "Auto",
  versions: "Versions de ce site",
  versionButton: "Version 0.5 du site, de 2026. Voir toutes les versions",
};

const es: UI = {
  skip: "Saltar al contenido",
  name: "Oussama Essamadi",
  home: "Inicio",
  whoami: "Quién soy",
  intro: " Soy Oussama, ingeniero de software. Creo aplicaciones web, de escritorio y móviles, programas de sistema, herramientas de IA, servicios en la nube y herramientas de código abierto.",
  hiAria: "Saludo. Selecciónalo para verlo en otro idioma",
  anchor: ", enlace a esta sección",
  newTab: " (se abre en una pestaña nueva)",
  copyright: "© 2026 Oussama Essamadi",
  signature: "Firma de Oussama Essamadi",
  palOpen: "Abrir el menú de comandos",
  palTitle: "Menú de comandos",
  language: "Idioma",
  theme: "Tema",
  light: "Claro",
  dark: "Oscuro",
  auto: "Automático",
  versions: "Versiones de este sitio",
  versionButton: "Versión 0.5 del sitio, de 2026. Ver todas las versiones",
};

const it: UI = {
  skip: "Vai al contenuto",
  name: "Oussama Essamadi",
  home: "Home",
  whoami: "Chi sono",
  intro: " Sono Oussama, ingegnere del software. Realizzo applicazioni web, desktop e mobile, programmi di sistema, strumenti di IA, servizi cloud e strumenti open source.",
  hiAria: "Saluto. Selezionalo per un’altra lingua",
  anchor: ", link a questa sezione",
  newTab: " (si apre in una nuova scheda)",
  copyright: "© 2026 Oussama Essamadi",
  signature: "Firma di Oussama Essamadi",
  palOpen: "Apri il menu dei comandi",
  palTitle: "Menu dei comandi",
  language: "Lingua",
  theme: "Tema",
  light: "Chiaro",
  dark: "Scuro",
  auto: "Automatico",
  versions: "Versioni di questo sito",
  versionButton: "Versione 0.5 del sito, del 2026. Mostra tutte le versioni",
};

const ja: UI = {
  skip: "本文へ移動",
  name: "Oussama Essamadi",
  home: "ホーム",
  whoami: "自己紹介",
  intro: "ウサマです。ソフトウェアエンジニアとして、Web・デスクトップ・モバイルのアプリ、システムプログラム、AIツール、クラウドサービス、オープンソースのツールを作っています。",
  hiAria: "あいさつ。選ぶと別の言語になります",
  anchor: "、このセクションへのリンク",
  newTab: "（新しいタブで開きます）",
  copyright: "© 2026 Oussama Essamadi",
  signature: "Oussama Essamadiの署名",
  palOpen: "コマンドメニューを開く",
  palTitle: "コマンドメニュー",
  language: "言語",
  theme: "テーマ",
  light: "ライト",
  dark: "ダーク",
  auto: "自動",
  versions: "このサイトの過去の版",
  versionButton: "サイトのバージョン0.5（2026年）。すべてのバージョンを表示",
};

const UI_STRINGS: Record<Lang, UI> = { ar, ary, en, fr, es, it, ja };

/**
 * The interface strings for a language.
 *
 * @param lang - The page's language
 * @returns Every interface string, in that language
 */
export function ui(lang: Lang): UI {
  return UI_STRINGS[lang];
}
