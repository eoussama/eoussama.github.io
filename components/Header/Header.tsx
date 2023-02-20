'use client';

import { Logo } from '@/components/Logo/Logo';
import { MobileMenu } from '@/components/MobileMenu/MobileMenu';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { PROFILE } from '@/data/profile';
import { SECTIONS, SECTION_IDS } from '@/data/sections';
import { useScrollSpy } from '@/lib/useScrollSpy';
import styles from './Header.module.css';

export function Header() {
	const active = useScrollSpy(SECTION_IDS);

	return (
		<header className={styles.header}>
			<div className={`container ${styles.inner}`}>
				<MobileMenu active={active} />

				<a className={styles.brand} href="#home">
					<Logo />
					<span>{PROFILE.handle}</span>
				</a>

				<nav className={styles.nav} aria-label="Sections">
					<ul>
						{SECTIONS.map((section) => (
							<li key={section.id}>
								<a
									href={`#${section.id}`}
									className={styles.link}
									aria-current={active === section.id ? 'true' : undefined}
								>
									{section.label}
								</a>
							</li>
						))}
					</ul>
					<ThemeToggle />
				</nav>
			</div>
		</header>
	);
}
