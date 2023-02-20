import { Button } from '@base-ui/react/button';
import { HeroRibbon } from '@/components/Decor/HeroRibbon';
import { HeroWaves } from '@/components/Decor/HeroWaves';
import { OutlinedText } from '@/components/OutlinedText/OutlinedText';
import { PROFILE } from '@/data/profile';
import { withBasePath } from '@/lib/basePath';
import styles from './Hero.module.css';

export function Hero() {
	return (
		<section id="home" className={styles.hero} aria-labelledby="hero-name">
			<HeroRibbon className={styles.ribbon} />

			<div className={`container ${styles.content}`}>
				<p className={styles.intro}>{PROFILE.greeting}</p>
				<h1 className={styles.name}>
					<OutlinedText id="hero-name" middle={[-4, -4]} back={[-6, -8]}>
						{PROFILE.name}
					</OutlinedText>
				</h1>
				<div className={styles.bio}>
					{PROFILE.bio.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</div>
				<div className={styles.actions}>
					<Button
						nativeButton={false}
						render={<a href={withBasePath(PROFILE.resume)} target="_blank" rel="noopener" />}
						className={`${styles.button} ${styles.solid}`}
					>
						Resume
					</Button>
					<Button
						nativeButton={false}
						render={<a href={`mailto:${PROFILE.email}`} />}
						className={`${styles.button} ${styles.outline}`}
					>
						Contact Me
					</Button>
				</div>
			</div>

			<HeroWaves />
		</section>
	);
}
