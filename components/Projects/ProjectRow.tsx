'use client';

import { useRef, type CSSProperties } from 'react';
import { Button } from '@base-ui/react/button';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Icon } from '@/components/Icon/Icon';
import type { Project } from '@/data/projects';
import { ProjectCard } from './ProjectCard';
import styles from './ProjectRow.module.css';

type ProjectRowProps = {
	id: string;
	title: string;
	projects: Project[];
	/** Rows of the compact grid used on tablet and phone. */
	rows: number;
	query: string;
};

export function ProjectRow({ id, title, projects, rows, query }: ProjectRowProps) {
	const viewport = useRef<HTMLDivElement>(null);
	const rowCount = Math.min(rows, projects.length);

	const scrollByCard = (direction: 1 | -1) => {
		const el = viewport.current;
		const card = el?.querySelector('li');
		if (!el || !card) return;
		const gap = parseFloat(getComputedStyle(card.parentElement!).columnGap) || 0;
		el.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
	};

	return (
		<section className={styles.row} aria-labelledby={id}>
			<h3 id={id} className={`container ${styles.title}`}>
				{title}
			</h3>

			{projects.length === 0 ? (
				<p className={`container ${styles.empty}`}>No projects match “{query}”.</p>
			) : (
				<ScrollArea.Root className={styles.root}>
					<ScrollArea.Viewport ref={viewport} className={styles.viewport}>
						<ScrollArea.Content>
							<ul className={styles.track} style={{ '--rows': rowCount } as CSSProperties}>
								{projects.map((project, index) => (
									<li key={project.url} data-last-row={index % rowCount === rowCount - 1 || undefined}>
										<ProjectCard project={project} />
									</li>
								))}
							</ul>
						</ScrollArea.Content>
					</ScrollArea.Viewport>
					<ScrollArea.Scrollbar orientation="horizontal" className={styles.scrollbar}>
						<ScrollArea.Thumb className={styles.thumb} />
					</ScrollArea.Scrollbar>

					<Button className={`${styles.scroll} ${styles.previous}`} onClick={() => scrollByCard(-1)} aria-label={`Previous ${title} projects`}>
						<Icon name="arrowLeft" size={22} />
					</Button>
					<Button className={`${styles.scroll} ${styles.next}`} onClick={() => scrollByCard(1)} aria-label={`More ${title} projects`}>
						<Icon name="arrowRight" size={22} />
					</Button>
				</ScrollArea.Root>
			)}
		</section>
	);
}
