'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
	const media = matchMedia(QUERY);
	media.addEventListener('change', onChange);
	return () => media.removeEventListener('change', onChange);
}

/** Whether the visitor asked for reduced motion. Assumed true until known (no motion on the server). */
export function useReducedMotion() {
	return useSyncExternalStore(
		subscribe,
		() => matchMedia(QUERY).matches,
		() => true,
	);
}
