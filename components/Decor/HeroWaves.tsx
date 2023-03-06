import type { CSSProperties } from 'react';
import { Particles } from './Particles';
import styles from './HeroWaves.module.css';

/**
 * The waves under the hero and the one closing the band: each a plain sine wave with
 * one steady frequency (a whole number of crests per screen width), placed at the
 * same height and depth as the mockup's shapes. Being periodic, each slides sideways
 * forever without a seam. Values are in px of the wave's box.
 */
type Sine = { mean: number; amplitude: number; crests: number; phase: number };

const WAVES: Record<'tablet' | 'phone', { width: number; height: number; back: Sine; front: Sine; foot: Sine & { height: number } }> = {
	tablet: {
		width: 1024,
		height: 333,
		back: { mean: 112, amplitude: 52, crests: 2, phase: 0 },
		front: { mean: 150, amplitude: 38, crests: 1, phase: 0.6 },
		foot: { height: 152, mean: 102, amplitude: 44, crests: 1, phase: 0 },
	},
	phone: {
		width: 414,
		height: 113,
		// One peak per screen width on phones; the two layers stay out of step.
		back: { mean: 30, amplitude: 22, crests: 1, phase: 0 },
		front: { mean: 44, amplitude: 22, crests: 1, phase: 0.9 },
		foot: { height: 78, mean: 45, amplitude: 28, crests: 1, phase: 0 },
	},
};

const STEPS = 160; // points per screen width

/** Two screen widths of the sine wave, as "x y" points. */
function curve({ mean, amplitude, crests, phase }: Sine, width: number) {
	return Array.from({ length: STEPS * 2 + 1 }, (_, i) => {
		const x = (width * i) / STEPS;
		const y = mean + amplitude * Math.sin((2 * Math.PI * crests * x) / width + phase * Math.PI);
		return `${x.toFixed(1)} ${Math.max(y, 0).toFixed(1)}`;
	});
}

/** A wave filled down to the bottom of its box. */
function wavePath(sine: Sine, width: number, height: number) {
	return `M${curve(sine, width).join(' L')} V${height} H0 Z`;
}

/** A wave filled from the top of its box down to the curve. */
function footPath(sine: Sine, width: number) {
	return `M${curve(sine, width).join(' L')} V0 H0 Z`;
}

function Foot({ size }: { size: keyof typeof WAVES }) {
	const { width, foot } = WAVES[size];
	return (
		<svg viewBox={`0 0 ${width} ${foot.height}`} preserveAspectRatio="none" className={styles.foot}>
			<path
				d={footPath(foot, width)}
				className={styles.footFill}
				style={{ '--period': `${-width}px` } as CSSProperties}
			/>
		</svg>
	);
}

function Waves({ size }: { size: keyof typeof WAVES }) {
	const { width, height, back, front } = WAVES[size];
	const period = { '--period': `${-width}px` } as CSSProperties;

	return (
		<svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={styles.top}>
			<path d={wavePath(back, width, height)} className={styles.back} style={period} />
			<path d={wavePath(front, width, height)} className={styles.front} style={period} />
		</svg>
	);
}

/** Tablet and phone: layered waves under the hero, a band with particles, and a closing wave. */
export function HeroWaves() {
	return (
		<div className={styles.waves} aria-hidden="true">
			<div className={styles.tablet}>
				<Waves size="tablet" />
				<div className={styles.band}>
					<svg className={styles.particles} viewBox="0 0 1024 517" preserveAspectRatio="xMidYMid slice">
						<Particles x={0} y={40} width={1024} height={500} count={40} seed={11} />
					</svg>
				</div>
				<Foot size="tablet" />
			</div>
			<div className={styles.phone}>
				<Waves size="phone" />
				<div className={styles.band}>
					<svg className={styles.particles} viewBox="0 0 414 200" preserveAspectRatio="xMidYMid slice">
						<Particles x={0} y={20} width={414} height={200} count={18} seed={5} />
					</svg>
				</div>
				<Foot size="phone" />
			</div>
		</div>
	);
}
