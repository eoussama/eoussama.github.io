/** Colors follow GitHub's language colors of the time (linguist, 2022). */
export const LANGUAGES = {
	TypeScript: { color: '#2b7489', short: 'TS' },
	JavaScript: { color: '#f1e05a', short: 'JS' },
	PHP: { color: '#4f5d95', short: 'PHP' },
	Go: { color: '#00add8', short: 'GO' },
	Pawn: { color: '#dbb284', short: 'PWN' },
} as const;

export type Language = keyof typeof LANGUAGES;
