'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Calls `advance` every `delay` ms while the element is on screen, not hovered and
 * not focused. Stops for good once the visitor picks something themselves, and
 * never runs for people who prefer reduced motion.
 */
export function useAutoAdvance(ref: RefObject<HTMLElement | null>, advance: () => void, delay = 6000) {
	const [stopped, setStopped] = useState(false);
	const advanceRef = useRef(advance);

	useEffect(() => {
		advanceRef.current = advance;
	});

	useEffect(() => {
		const el = ref.current;
		if (!el || stopped || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let visible = false;
		let hovered = false;
		let focused = false;
		let timer = 0;

		const schedule = () => {
			clearInterval(timer);
			timer = 0;
			if (visible && !hovered && !focused) timer = window.setInterval(() => advanceRef.current(), delay);
		};

		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			schedule();
		}, { threshold: 0.4 });
		observer.observe(el);

		const enter = () => ((hovered = true), schedule());
		const leave = () => ((hovered = false), schedule());
		const focusIn = () => ((focused = true), schedule());
		const focusOut = (event: FocusEvent) => {
			if (!el.contains(event.relatedTarget as Node)) {
				focused = false;
				schedule();
			}
		};

		el.addEventListener('pointerenter', enter);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('focusin', focusIn);
		el.addEventListener('focusout', focusOut);
		return () => {
			observer.disconnect();
			clearInterval(timer);
			el.removeEventListener('pointerenter', enter);
			el.removeEventListener('pointerleave', leave);
			el.removeEventListener('focusin', focusIn);
			el.removeEventListener('focusout', focusOut);
		};
	}, [ref, stopped, delay]);

	return { stop: () => setStopped(true) };
}
