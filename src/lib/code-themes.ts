import latte from "@shikijs/themes/catppuccin-latte";
import mocha from "@shikijs/themes/catppuccin-mocha";



/*
 * The code colours: Catppuccin, whose lavender suits the site, made readable on the
 * site's own code backgrounds. Any colour short of AA contrast (4.5:1, with a little
 * margin) is nudged darker on light, lighter on dark, until it passes.
 */

type Theme = typeof latte;

const LIGHT_BG = "#f1edf4";
const DARK_BG = "#1d1f2b";
const TARGET = 4.6;

/**
 * A colour's relative luminance.
 *
 * @param hex - The colour, as #rrggbb
 * @returns Its luminance, from 0 to 1
 */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/**
 * How well two colours stand apart.
 *
 * @param a - One colour
 * @param b - The other
 * @returns Their contrast ratio, from 1 to 21
 */
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);

  return (x! + 0.05) / (y! + 0.05);
}

/**
 * A colour moved toward black or white until it reads on a background.
 *
 * @param color - The colour, as #rrggbb (any alpha is kept)
 * @param bg - The background
 * @param toward - Black for a light background, white for a dark one
 * @returns The colour, readable
 */
function readable(color: string, bg: string, toward: 0 | 255): string {
  if (!/^#[0-9a-f]{6}/i.test(color)) {
    return color;
  }

  const alpha = color.slice(7);
  let rgb = [1, 3, 5].map(i => Number.parseInt(color.slice(i, i + 2), 16));
  let hex = color.slice(0, 7);

  for (let step = 0; step < 40 && contrast(hex, bg) < TARGET; step++) {
    rgb = rgb.map(v => Math.round(v + (toward - v) * 0.06));
    hex = `#${rgb.map(v => v.toString(16).padStart(2, "0")).join("")}`;
  }

  return hex + alpha;
}

/**
 * A theme with every token colour readable on a background.
 *
 * @param theme - The theme
 * @param bg - The code background it is shown on
 * @param toward - Black for a light background, white for a dark one
 * @returns The adjusted theme
 */
function accessible(theme: Theme, bg: string, toward: 0 | 255): Theme {
  return {
    ...theme,
    name: `${theme.name}-readable`,
    tokenColors: theme.tokenColors?.map(token => ({
      ...token,
      settings: { ...token.settings, foreground: token.settings.foreground ? readable(token.settings.foreground, bg, toward) : undefined },
    })),
  };
}

export const CODE_THEMES = {
  light: accessible(latte, LIGHT_BG, 0),
  dark: accessible(mocha, DARK_BG, 255),
};
