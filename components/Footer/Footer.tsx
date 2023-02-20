import { FOOTER_WAVE_DESKTOP, FOOTER_WAVE_PHONE, FOOTER_WAVE_TABLET } from '@/components/Decor/shapes';
import { SocialLinks } from '@/components/SocialLinks/SocialLinks';
import { PROFILE } from '@/data/profile';
import styles from './Footer.module.css';

const WAVES = [
	{ shape: FOOTER_WAVE_DESKTOP, className: styles.desktop },
	{ shape: FOOTER_WAVE_TABLET, className: styles.tablet },
	{ shape: FOOTER_WAVE_PHONE, className: styles.phone },
];

export function Footer() {
	return (
		<footer className={styles.footer}>
			{WAVES.map(({ shape, className }) => (
				<svg key={className} className={`${styles.wave} ${className}`} viewBox={shape.viewBox} preserveAspectRatio="none" aria-hidden="true">
					<path d={shape.wave} />
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
