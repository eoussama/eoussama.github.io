import type { CSSProperties } from 'react';
import styles from './Particles.module.css';

type ParticlesProps = {
	/** Area to scatter the particles over, in the parent SVG's user units. */
	x: number;
	y: number;
	width: number;
	height: number;
	count: number;
	seed: number;
};

/** Deterministic pseudo-random numbers, so server and client render the same particles. */
function random(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state / 4294967296;
	};
}

const TINTS = ['#9fb3ff', '#7d93e8', '#c9d4ff', '#f6ef78'];

/** Slowly drifting bokeh dots (an SVG fragment: render inside an <svg>). */
export function Particles({ x, y, width, height, count, seed }: ParticlesProps) {
	const next = random(seed);
	const gradient = `particle-${seed}`;

	return (
		<g className={styles.particles}>
			<defs>
				{TINTS.map((tint, i) => (
					<radialGradient key={tint} id={`${gradient}-${i}`}>
						<stop offset="0%" stopColor={tint} stopOpacity="0.9" />
						<stop offset="55%" stopColor={tint} stopOpacity="0.45" />
						<stop offset="100%" stopColor={tint} stopOpacity="0" />
					</radialGradient>
				))}
			</defs>
			{Array.from({ length: count }, (_, i) => {
				const r = 3 + next() * 12;
				const tint = next() < 0.12 ? 3 : Math.floor(next() * 3);
				const style = {
					'--dx': `${(next() - 0.5) * 120}px`,
					'--dy': `${-40 - next() * 140}px`,
					'--duration': `${14 + next() * 22}s`,
					'--delay': `${-next() * 30}s`,
					'--opacity': (0.12 + next() * 0.4).toFixed(2),
				} as CSSProperties;
				return (
					<circle
						key={i}
						className={styles.particle}
						cx={(x + next() * width).toFixed(1)}
						cy={(y + next() * height).toFixed(1)}
						r={r.toFixed(1)}
						fill={`url(#${gradient}-${tint})`}
						style={style}
					/>
				);
			})}
		</g>
	);
}
