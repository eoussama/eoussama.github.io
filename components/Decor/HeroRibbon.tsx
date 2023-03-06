'use client';

import { useEffect, useRef } from 'react';
import particlesDark from '@/assets/hero/particles-dark.jpg';
import particlesLight from '@/assets/hero/particles-light.jpg';
import { Particles } from './Particles';
import { HERO_RIBBON } from './shapes';
import styles from './HeroRibbon.module.css';

/** How far (px, in design units) the particles may slide either way. */
const RANGE = 56;

/**
 * Desktop hero background: two waves and the particle-filled blob.
 * The ribbon stays put; the particles inside the blob slide with the mouse.
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
			// Small easing factor: the particles trail well behind the mouse and drift slowly.
			current += (target - current) * 0.012;
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
			<path d={HERO_RIBBON.edge} fill="#4a5979" />
			<path d={HERO_RIBBON.body} fill="#2b3855" />
			<g clipPath="url(#hero-blob)">
				<rect x={x} y={y} width={width} height={height} fill="#111928" />
				{/* Wider than the blob by RANGE on each side, so sliding never shows an edge. */}
				<g style={{ transform: 'translateX(var(--ribbon-shift, 0px))' }}>
					{[particlesLight, particlesDark].map((texture, i) => (
						<image
							key={texture.src}
							className={i === 0 ? styles.light : styles.dark}
							href={texture.src}
							x={x - RANGE}
							y={y}
							width={width + 2 * RANGE}
							height={height}
							preserveAspectRatio="xMidYMid slice"
						/>
					))}
					<Particles x={x + 600 - RANGE} y={y} width={width - 600 + 2 * RANGE} height={height} count={60} seed={7} />
				</g>
			</g>
		</svg>
	);
}
