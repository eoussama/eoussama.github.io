'use client';

import { useState, type CSSProperties } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { BurgerIcon } from '@/components/BurgerIcon/BurgerIcon';
import { Logo } from '@/components/Logo/Logo';
import { SocialLinks } from '@/components/SocialLinks/SocialLinks';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { PROFILE } from '@/data/profile';
import { SECTIONS } from '@/data/sections';
import styles from './MobileMenu.module.css';

/*
 * The menu's three waves: plain sine waves with one peak across the menu, at the
 * mockup's heights. Each is two widths long and slides by one width, so it flows
 * continuously without a seam. Values in px of a 309 × 135 box.
 */
const MENU_WIDTH = 309;
const MENU_WAVE_HEIGHT = 135;
const MENU_WAVES = [
	{ className: styles.waveBack, mean: 46, amplitude: 28, phase: 0 },
	{ className: styles.waveMiddle, mean: 74, amplitude: 22, phase: 0.6 },
	{ className: styles.waveFront, mean: 96, amplitude: 22, phase: 1.2 },
];

function menuWavePath(mean: number, amplitude: number, phase: number) {
	const steps = 80;
	const points = Array.from({ length: steps * 2 + 1 }, (_, i) => {
		const x = (MENU_WIDTH * i) / steps;
		const y = mean + amplitude * Math.sin((2 * Math.PI * x) / MENU_WIDTH + phase * Math.PI);
		return `${x.toFixed(1)} ${y.toFixed(1)}`;
	});
	return `M${points.join(' L')} V${MENU_WAVE_HEIGHT} H0 Z`;
}

export function MobileMenu({ active }: { active: string }) {
	const [open, setOpen] = useState(false);

	return (
		<Drawer.Root open={open} onOpenChange={setOpen} swipeDirection="left">
			<Drawer.Trigger className={styles.trigger} aria-label="Open menu">
				<BurgerIcon open={open} />
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Backdrop className={styles.backdrop} />
				<Drawer.Viewport className={styles.viewport}>
					<Drawer.Popup className={styles.popup}>
						<Drawer.Title className="visually-hidden">Menu</Drawer.Title>

						<div className={styles.top}>
							<a className={styles.brand} href="#home" onClick={() => setOpen(false)}>
								<Logo size={30} />
								<span>{PROFILE.handle}</span>
							</a>
							<Drawer.Close className={styles.close} aria-label="Close menu">
								<BurgerIcon open animate />
							</Drawer.Close>
						</div>

						<nav aria-label="Sections">
							<ul className={styles.nav}>
								{SECTIONS.map((section, index) => (
									<li key={section.id} className={styles.item} style={{ '--index': index } as CSSProperties}>
										<a
											href={`#${section.id}`}
											className={styles.link}
											aria-current={active === section.id ? 'true' : undefined}
											onClick={() => setOpen(false)}
										>
											{section.label}
										</a>
									</li>
								))}
							</ul>
						</nav>

						<svg
							className={styles.waves}
							viewBox={`0 0 ${MENU_WIDTH} ${MENU_WAVE_HEIGHT}`}
							preserveAspectRatio="none"
							aria-hidden="true"
							style={{ '--period': `${-MENU_WIDTH}px` } as CSSProperties}
						>
							{MENU_WAVES.map(({ className, mean, amplitude, phase }) => (
								<path key={className} className={className} d={menuWavePath(mean, amplitude, phase)} />
							))}
						</svg>

						<div className={styles.panel}>
							<a className={styles.email} href={`mailto:${PROFILE.email}`}>
								Email me at {PROFILE.email}
							</a>
							<SocialLinks variant="list" />
						</div>

						<div className={styles.foot}>
							<span>
								{PROFILE.handle} © {PROFILE.year}
							</span>
							<ThemeToggle className={styles.theme} />
						</div>
					</Drawer.Popup>
				</Drawer.Viewport>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
