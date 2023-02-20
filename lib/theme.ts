export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'eoussama:theme';

/**
 * Runs before the first paint (inlined in <head>) so the page never flashes the
 * wrong theme: a saved choice wins, otherwise the system preference is used.
 */
export const THEME_INIT_SCRIPT = `(() => {
	let theme = 'light';
	try {
		const saved = localStorage.getItem('${THEME_STORAGE_KEY}');
		theme = saved === 'light' || saved === 'dark'
			? saved
			: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	} catch {}
	document.documentElement.dataset.theme = theme;
})();`;
