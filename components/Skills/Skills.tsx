'use client';

import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import { Tabs } from '@base-ui/react/tabs';
import { Chip } from '@/components/Chip/Chip';
import { SectionTitle } from '@/components/SectionTitle/SectionTitle';
import { TextPattern } from '@/components/TextPattern/TextPattern';
import { SKILLS } from '@/data/skills';
import { useCarouselPause } from '@/lib/useCarouselPause';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { tiltHandlers } from '@/lib/useTilt';
import styles from './Skills.module.css';

const COUNT = SKILLS.length;

export function Skills() {
	/*
	 * Position on the tablet carousel's track, which holds the cards three times over
	 * (a copy, the real tabs, a copy). The real tabs are 3–5; the track always slides
	 * to the neighbouring position, and when it lands on a copy it jumps, without
	 * animating, to the identical real card. So it scrolls one way forever, seamlessly.
	 */
	const [pos, setPos] = useState(COUNT);
	const [instant, setInstant] = useState(false);
	const activeIndex = pos % COUNT;
	const active = SKILLS[activeIndex].id;

	const tabsRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const tilt = tiltHandlers();

	const move = (delta: number) => {
		// Without a sliding track (desktop, reduced motion) there is no transition to wait
		// for: go straight to the real card.
		const track = trackRef.current;
		const slides = track && parseFloat(getComputedStyle(track).transitionDuration) > 0;
		setInstant(!slides);
		setPos((current) => (slides ? current + delta : COUNT + (((current + delta) % COUNT) + COUNT) % COUNT));
	};

	/*
	 * "Auto carousel": a faint layer grows across the active card; when it fills, the
	 * next skill comes up. The layer's animation is the timer, so pausing it (hover,
	 * keyboard focus, off screen) pauses the carousel, and any move starts it afresh.
	 */
	const paused = useCarouselPause(tabsRef);
	const autoplay = !useReducedMotion();

	/** Go to a skill by the shortest way round (next, or previous). */
	const select = (id: string) => {
		const target = SKILLS.findIndex((skill) => skill.id === id);
		const forward = (target - activeIndex + COUNT) % COUNT;
		if (forward) move(forward <= COUNT / 2 ? forward : forward - COUNT);
	};

	const settle = () => {
		if (pos >= 2 * COUNT || pos < COUNT) {
			setInstant(true);
			setPos(COUNT + activeIndex);
		}
	};

	// Tablet carousel: swipe the cards left or right.
	const swipeStart = useRef<{ x: number; y: number } | null>(null);
	const swiped = useRef(false);
	const swipe = {
		onPointerDown: (event: PointerEvent<HTMLElement>) => {
			swipeStart.current = { x: event.clientX, y: event.clientY };
		},
		onPointerUp: (event: PointerEvent<HTMLElement>) => {
			const start = swipeStart.current;
			swipeStart.current = null;
			if (!start) return;
			const dx = event.clientX - start.x;
			if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
				swiped.current = true;
				move(dx < 0 ? 1 : -1);
			}
		},
		// The click that ends a swipe would select the card it started on: ignore it.
		onClickCapture: (event: MouseEvent<HTMLElement>) => {
			if (swiped.current) {
				swiped.current = false;
				event.preventDefault();
				event.stopPropagation();
			}
		},
		onPointerCancel: () => {
			swipeStart.current = null;
		},
	};

	/** `slot` is the card's place on the track; the one at `pos` shows the progress. */
	const cardContent = (skill: (typeof SKILLS)[number], slot: number) => (
		<>
			<span className={styles.layerBack} aria-hidden="true" />
			<span className={styles.layerFront} aria-hidden="true" />
			<span className={styles.photo}>
				<Image src={skill.image} alt="" fill sizes="(min-width: 1200px) 360px, 70vw" />
				<TextPattern className={styles.pattern} text={skill.label} tileWidth={46} tileHeight={30.42} fontSize={21} fontWeight={700} />
				{autoplay && slot === pos && (
					<span key={pos} className={styles.progress} aria-hidden="true" onAnimationEnd={() => move(1)} />
				)}
			</span>
			<span className={styles.label}>{skill.label}</span>
		</>
	);

	// Decorative copies on either side of the real tabs (tablet only).
	const copies = (offset: number) =>
		SKILLS.map((skill, index) => (
			<div
				key={`${offset}-${skill.id}`}
				className={`${styles.card} ${styles.copy}`}
				data-active={offset + index === pos || undefined}
				aria-hidden="true"
				onClick={() => move(offset + index - pos)}
			>
				{cardContent(skill, offset + index)}
			</div>
		));

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
					data-paused={paused || undefined}
					value={active}
					onValueChange={(value) => select(value as string)}
				>
					<div className={styles.viewport} {...swipe}>
						<Tabs.List
							ref={trackRef}
							className={styles.cards}
							aria-label="Skills"
							data-instant={instant || undefined}
							style={{ '--pos': pos } as CSSProperties}
							onTransitionEnd={(event) => event.target === event.currentTarget && settle()}
						>
							{copies(0)}
							{SKILLS.map((skill, index) => (
								<Tabs.Tab key={skill.id} value={skill.id} className={styles.card}>
									{cardContent(skill, COUNT + index)}
								</Tabs.Tab>
							))}
							{copies(2 * COUNT)}
						</Tabs.List>
					</div>

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

					{/* Tablet pagination. A mouse/touch shortcut: keyboard users have the tabs above. */}
					<div className={styles.dots} aria-hidden="true">
						{SKILLS.map((skill) => (
							<button
								key={skill.id}
								type="button"
								tabIndex={-1}
								className={styles.dot}
								data-active={skill.id === active || undefined}
								onClick={() => select(skill.id)}
							/>
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
