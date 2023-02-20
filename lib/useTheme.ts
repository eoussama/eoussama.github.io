'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY, type Theme } from './theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readSavedTheme(): Theme | null {
	try {
		const saved = localStorage.getItem(THEME_STORAGE_KEY);
		return saved === 'light' || saved === 'dark' ? saved : null;
	} catch {
		return null;
	}
}

function subscribe(onChange: () => void) {
	const root = document.documentElement;
	const observer = new MutationObserver(onChange);
	observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

	// Follow the system setting until the visitor picks a theme themselves.
	const media = matchMedia(DARK_QUERY);
	const onSystemChange = () => {
		if (!readSavedTheme()) root.dataset.theme = media.matches ? 'dark' : 'light';
	};
	media.addEventListener('change', onSystemChange);

	return () => {
		observer.disconnect();
		media.removeEventListener('change', onSystemChange);
	};
}

const getSnapshot = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
const getServerSnapshot = (): Theme => 'light';

export function useTheme() {
	const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const setTheme = useCallback((next: Theme) => {
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// Private mode or blocked storage: the choice just won't persist.
		}
	}, []);

	return { theme, setTheme };
}
