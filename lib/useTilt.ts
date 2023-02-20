'use client';

import type { PointerEvent } from 'react';

const MAX = 8; // degrees

/** Pointer handlers that tilt an element towards the pointer (sets --tilt-x / --tilt-y). */
export function tiltHandlers() {
	const reset = (event: PointerEvent<HTMLElement>) => {
		const el = event.currentTarget;
		el.style.removeProperty('--tilt-x');
		el.style.removeProperty('--tilt-y');
		delete el.dataset.tilting;
	};

	return {
		onPointerMove(event: PointerEvent<HTMLElement>) {
			if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
			const el = event.currentTarget;
			const box = el.getBoundingClientRect();
			const px = (event.clientX - box.left) / box.width - 0.5;
			const py = (event.clientY - box.top) / box.height - 0.5;
			el.style.setProperty('--tilt-x', `${(-py * MAX * 2).toFixed(2)}deg`);
			el.style.setProperty('--tilt-y', `${(px * MAX * 2).toFixed(2)}deg`);
			el.dataset.tilting = '';
		},
		onPointerLeave: reset,
		onPointerCancel: reset,
		onPointerUp: reset,
	};
}
