'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether an auto-advancing carousel should hold still: while it is hovered, while
 * keyboard focus is inside it, or while it is off screen.
 */
export function useCarouselPause(ref: RefObject<HTMLElement | null>) {
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 });
		observer.observe(el);

		const enter = () => setHovered(true);
		const leave = () => setHovered(false);
		// Only keyboard focus counts: a click also focuses a card, but should not pause.
		const focusIn = () => setFocused(el.matches(':has(:focus-visible)'));
		const focusOut = (event: FocusEvent) => {
			if (!el.contains(event.relatedTarget as Node)) setFocused(false);
		};

		el.addEventListener('pointerenter', enter);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('focusin', focusIn);
		el.addEventListener('focusout', focusOut);
		return () => {
			observer.disconnect();
			el.removeEventListener('pointerenter', enter);
			el.removeEventListener('pointerleave', leave);
			el.removeEventListener('focusin', focusIn);
			el.removeEventListener('focusout', focusOut);
		};
	}, [ref]);

	return hovered || focused || !visible;
}
