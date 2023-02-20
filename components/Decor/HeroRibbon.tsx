'use client';

import { useEffect, useRef } from 'react';
import particlesDark from '@/assets/hero/particles-dark.jpg';
import particlesLight from '@/assets/hero/particles-light.jpg';
import { Particles } from './Particles';
import { HERO_RIBBON } from './shapes';
import styles from './HeroRibbon.module.css';

/** How far (px, in design units) the ribbon may slide either way. */
const RANGE = 56;

/**
 * Desktop hero background: two waves and the particle-filled blob.
 * The ribbon slides with the mouse and covers whatever it passes over.
 */
export function HeroRibbon({ className }: { className?: string }) {
	const ref = useRef<SVGSVGElement>(null);
	const [x, y, width, height] = HERO_RIBBON.viewBox.split(' ').map(Number);

	useEffect(() => {
		const svg = ref.current;
		const section = svg?.closest('section');
		if (!svg || !section) return;
		if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let target = 0;
		let current = 0;
		let frame = 0;

		const tick = () => {
			current += (target - current) * 0.08;
			svg.style.setProperty('--ribbon-shift', `${current.toFixed(2)}px`);
			frame = Math.abs(target - current) > 0.1 ? requestAnimationFrame(tick) : 0;
		};
		const start = () => {
			if (!frame) frame = requestAnimationFrame(tick);
		};
		const onMove = (event: PointerEvent) => {
			const box = section.getBoundingClientRect();
			target = ((event.clientX - box.left) / box.width - 0.5) * 2 * RANGE;
			start();
		};
		const onLeave = () => {
			target = 0;
			start();
		};

		section.addEventListener('pointermove', onMove);
		section.addEventListener('pointerleave', onLeave);
		return () => {
			section.removeEventListener('pointermove', onMove);
			section.removeEventListener('pointerleave', onLeave);
			cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<svg ref={ref} className={className} viewBox={HERO_RIBBON.viewBox} preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
			<defs>
				<clipPath id="hero-blob">
					<path d={HERO_RIBBON.blob} clipRule="evenodd" />
				</clipPath>
			</defs>
			<g style={{ transform: 'translateX(var(--ribbon-shift, 0px))' }}>
				<path d={HERO_RIBBON.edge} fill="#4a5979" />
				<path d={HERO_RIBBON.body} fill="#2b3855" />
				<g clipPath="url(#hero-blob)">
					<image className={styles.light} href={particlesLight.src} x={x} y={y} width={width} height={height} preserveAspectRatio="none" />
					<image className={styles.dark} href={particlesDark.src} x={x} y={y} width={width} height={height} preserveAspectRatio="none" />
					<Particles x={x + 600} y={y} width={width - 600} height={height} count={46} seed={7} />
				</g>
			</g>
		</svg>
	);
}
