/** GitHub's language colours (linguist, 2022) and the short labels used on compact cards. */
export const LANGUAGES = {
	Batchfile: { color: '#c1f12e', short: 'BAT' },
	C: { color: '#555555', short: 'C' },
	"C#": { color: '#178600', short: 'C#' },
	"C++": { color: '#f34b7d', short: 'C++' },
	CSS: { color: '#563d7c', short: 'CSS' },
	Go: { color: '#00add8', short: 'GO' },
	HTML: { color: '#e34c26', short: 'HTML' },
	Java: { color: '#b07219', short: 'JAVA' },
	JavaScript: { color: '#f1e05a', short: 'JS' },
	Lua: { color: '#000080', short: 'LUA' },
	Other: { color: '#8b8b8b', short: '—' },
	PHP: { color: '#4f5d95', short: 'PHP' },
	Pawn: { color: '#dbb284', short: 'PWN' },
	Python: { color: '#3572a5', short: 'PY' },
	Rust: { color: '#dea584', short: 'RS' },
	Shell: { color: '#89e051', short: 'SH' },
	Svelte: { color: '#ff3e00', short: 'SV' },
	TypeScript: { color: '#2b7489', short: 'TS' },
	"Visual Basic": { color: '#945db7', short: 'VB' },
	Vue: { color: '#41b883', short: 'VUE' },
} as const;

export type Language = keyof typeof LANGUAGES;
