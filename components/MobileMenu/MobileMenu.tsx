'use client';

import { useState, type CSSProperties } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { MENU_WAVES } from '@/components/Decor/shapes';
import { BurgerIcon } from '@/components/BurgerIcon/BurgerIcon';
import { Logo } from '@/components/Logo/Logo';
import { SocialLinks } from '@/components/SocialLinks/SocialLinks';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { PROFILE } from '@/data/profile';
import { SECTIONS } from '@/data/sections';
import styles from './MobileMenu.module.css';

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

						<svg className={styles.waves} viewBox={MENU_WAVES.viewBox} preserveAspectRatio="none" aria-hidden="true">
							<path className={styles.waveBack} d={MENU_WAVES.back} />
							<path className={styles.waveMiddle} d={MENU_WAVES.middle} />
							<path className={styles.waveFront} d={MENU_WAVES.front} />
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
