import { HERO_WAVES_PHONE_FOOT, HERO_WAVES_PHONE_TOP, HERO_WAVES_TABLET_FOOT, HERO_WAVES_TABLET_TOP } from './shapes';
import { Particles } from './Particles';
import styles from './HeroWaves.module.css';

/** Tablet and phone: layered waves under the hero, a band, and a closing wave. */
export function HeroWaves() {
	return (
		<div className={styles.waves} aria-hidden="true">
			<div className={styles.tablet}>
				<svg viewBox={HERO_WAVES_TABLET_TOP.viewBox} preserveAspectRatio="none" className={styles.top}>
					<path d={HERO_WAVES_TABLET_TOP.back} className={styles.back} />
					<path d={HERO_WAVES_TABLET_TOP.front} className={styles.front} />
				</svg>
				<div className={styles.band}>
					<svg className={styles.particles} viewBox="0 0 1024 517" preserveAspectRatio="xMidYMid slice">
						<Particles x={0} y={40} width={1024} height={500} count={40} seed={11} />
					</svg>
				</div>
				<svg viewBox={HERO_WAVES_TABLET_FOOT.viewBox} preserveAspectRatio="none" className={styles.foot}>
					<path d={HERO_WAVES_TABLET_FOOT.foot} className={styles.footFill} />
				</svg>
			</div>
			<div className={styles.phone}>
				<svg viewBox={HERO_WAVES_PHONE_TOP.viewBox} preserveAspectRatio="none" className={styles.top}>
					<path d={HERO_WAVES_PHONE_TOP.back} className={styles.back} />
					<path d={HERO_WAVES_PHONE_TOP.front} className={styles.front} />
				</svg>
				<div className={styles.band}>
					<svg className={styles.particles} viewBox="0 0 414 200" preserveAspectRatio="xMidYMid slice">
						<Particles x={0} y={20} width={414} height={200} count={18} seed={5} />
					</svg>
				</div>
				<svg viewBox={HERO_WAVES_PHONE_FOOT.viewBox} preserveAspectRatio="none" className={styles.foot}>
					<path d={HERO_WAVES_PHONE_FOOT.foot} className={styles.footFill} />
				</svg>
			</div>
		</div>
	);
}
