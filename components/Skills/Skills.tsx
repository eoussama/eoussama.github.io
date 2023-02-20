'use client';

import { useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Tabs } from '@base-ui/react/tabs';
import { Chip } from '@/components/Chip/Chip';
import { SectionTitle } from '@/components/SectionTitle/SectionTitle';
import { TextPattern } from '@/components/TextPattern/TextPattern';
import { SKILLS } from '@/data/skills';
import { useAutoAdvance } from '@/lib/useAutoAdvance';
import { tiltHandlers } from '@/lib/useTilt';
import styles from './Skills.module.css';

export function Skills() {
	const [active, setActive] = useState(SKILLS[0].id);
	const activeIndex = SKILLS.findIndex((skill) => skill.id === active);

	// "Auto carousel": rotate through the skills until the visitor picks one.
	const tabsRef = useRef<HTMLDivElement>(null);
	const auto = useAutoAdvance(tabsRef, () => setActive(SKILLS[(activeIndex + 1) % SKILLS.length].id));
	const tilt = tiltHandlers();

	return (
		<section id="skills" className={styles.skills} aria-labelledby="skills-title">
			<div className={styles.backdrop} aria-hidden="true">
				<Image src={SKILLS[activeIndex].image} alt="" fill sizes="100vw" />
			</div>

			<div className={`container ${styles.inner}`}>
				<SectionTitle id="skills-title">Skills</SectionTitle>

				{/* Desktop and tablet: the cards are tabs, the text below is the panel. */}
				<Tabs.Root
					ref={tabsRef}
					className={styles.tabs}
					value={active}
					onValueChange={(value) => {
						auto.stop();
						setActive(value as string);
					}}
				>
					<Tabs.List className={styles.cards} aria-label="Skills">
						{SKILLS.map((skill, index) => {
							// Position relative to the active card, for the tablet carousel: -1, 0 or 1.
							const slot = ((index - activeIndex + SKILLS.length + 1) % SKILLS.length) - 1;
							return (
								<Tabs.Tab
									key={skill.id}
									value={skill.id}
									className={styles.card}
									style={{ '--slot': slot } as CSSProperties}
								>
									<span className={styles.layerBack} aria-hidden="true" />
									<span className={styles.layerFront} aria-hidden="true" />
									<span className={styles.photo}>
										<Image src={skill.image} alt="" fill sizes="(min-width: 1200px) 360px, 70vw" />
										<TextPattern className={styles.pattern} text={skill.label} tileWidth={46} tileHeight={30.42} fontSize={21} fontWeight={700} />
									</span>
									<span className={styles.label}>{skill.label}</span>
								</Tabs.Tab>
							);
						})}
					</Tabs.List>

					{SKILLS.map((skill) => (
						<Tabs.Panel key={skill.id} value={skill.id} className={styles.panel}>
							<h3 className={styles.panelTitle}>{skill.title}</h3>
							<div className={styles.panelText}>
								{skill.description.map((paragraph) => (
									<p key={paragraph}>{paragraph}</p>
								))}
							</div>
							{skill.tags.length > 0 && (
								<ul className={styles.tags} aria-label="Related projects">
									{skill.tags.map((tag) => (
										<li key={tag.label}>
											<Chip href={tag.url}>{tag.label}</Chip>
										</li>
									))}
								</ul>
							)}
						</Tabs.Panel>
					))}

					<div className={styles.dots} aria-hidden="true">
						{SKILLS.map((skill) => (
							<span key={skill.id} className={styles.dot} data-active={skill.id === active || undefined} />
						))}
					</div>
				</Tabs.Root>

				{/* Phone: every skill is a card with its text. */}
				<ul className={styles.stack}>
					{[...SKILLS].reverse().map((skill) => (
						<li key={skill.id} className={styles.stackCard} {...tilt}>
							<span className={styles.stackLayer} aria-hidden="true" />
							<span className={styles.stackLayer} aria-hidden="true" />
							<div className={styles.stackBody}>
								<Image className={styles.stackPhoto} src={skill.image} alt="" fill sizes="100vw" />
								<h3 className={styles.stackLabel}>{skill.label}</h3>
								<div className={styles.stackText}>
									{skill.description.map((paragraph) => (
										<p key={paragraph}>{paragraph}</p>
									))}
								</div>
								{skill.tags.length > 0 && (
									<ul className={styles.stackTags} aria-label="Related projects">
										{skill.tags.map((tag) => (
											<li key={tag.label}>
												<Chip size="small" href={tag.url}>
													{tag.label}
												</Chip>
											</li>
										))}
									</ul>
								)}
							</div>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
