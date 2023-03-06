import type { CSSProperties } from 'react';
import { SocialLinks } from '@/components/SocialLinks/SocialLinks';
import { PROFILE } from '@/data/profile';
import styles from './Footer.module.css';

/*
 * The mockup's footer wave is one smooth swell across the width: lowest a quarter of
 * the way in, highest at three quarters, about 18% of its height either way of its
 * middle line. That is one period of a sine, so it is drawn as one, two periods long,
 * and slid by one period: the loop has no seam.
 */
const WAVES = [
	{ width: 1440, height: 57, className: styles.desktop },
	{ width: 1024, height: 57, className: styles.tablet },
	{ width: 414, height: 45, className: styles.phone },
];

const STEPS = 180; // points per period

function wavePath(width: number, height: number) {
	const amplitude = height * 0.1814;
	// The mockup's crest pokes 1px above the box and gets clipped flat; keep it inside.
	const middle = amplitude + 1;
	const points: string[] = [];
	for (let i = 0; i <= STEPS * 2; i++) {
		const x = (width * i) / STEPS;
		const y = middle + amplitude * Math.sin((2 * Math.PI * x) / width);
		points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
	}
	return `M${points.join(' L')} V${height} H0 Z`;
}

export function Footer() {
	return (
		<footer className={styles.footer}>
			{WAVES.map(({ width, height, className }) => (
				<svg
					key={className}
					className={`${styles.wave} ${className}`}
					viewBox={`0 0 ${width} ${height}`}
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					<path className={styles.strip} d={wavePath(width, height)} style={{ '--period': `${-width}px` } as CSSProperties} />
				</svg>
			))}

			<div className={styles.body}>
				<SocialLinks variant="row" />
				<a className={styles.email} href={`mailto:${PROFILE.email}`}>
					Email me at {PROFILE.email}
				</a>
			</div>

			<p className={styles.bar}>
				{PROFILE.handle} © {PROFILE.year}
			</p>
		</footer>
	);
}
