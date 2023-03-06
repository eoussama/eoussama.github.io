import type { CSSProperties } from 'react';
import { Icon } from '@/components/Icon/Icon';
import { TextPattern } from '@/components/TextPattern/TextPattern';
import { LANGUAGES } from '@/data/languages';
import type { Project } from '@/data/projects';
import styles from './ProjectCard.module.css';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function ProjectCard({ project }: { project: Project }) {
	const language = LANGUAGES[project.language];
	const slash = project.name.indexOf('/');
	const owner = slash === -1 ? null : project.name.slice(0, slash + 1);
	const repo = slash === -1 ? project.name : project.name.slice(slash + 1);

	return (
		<article className={styles.card} style={{ '--language': language.color } as CSSProperties}>
			<div className={styles.thumbnail} aria-hidden="true">
				<TextPattern
					className={styles.pattern}
					text={project.language}
					tileWidth={project.language.length * 6.5 + 10}
					tileHeight={24}
					fontSize={11}
				/>
			</div>

			<header className={styles.header}>
				<h4 className={styles.title}>
					<a className={styles.link} href={project.url} target="_blank" rel="noopener noreferrer">
						{owner && <span className={styles.owner}>{owner}</span>}
						{repo}
					</a>
				</h4>
				<p className={styles.stats}>
					<span title={`${project.stars} stars`}>
						<Icon name="star" size={14} />
						<span className="visually-hidden">Stars: </span>
						{compact.format(project.stars)}
					</span>
					<span title={`${project.forks} forks`}>
						<Icon name="fork" size={12} />
						<span className="visually-hidden">Forks: </span>
						{compact.format(project.forks)}
					</span>
				</p>
			</header>

			<p className={styles.description}>{project.description}</p>

			<ul className={styles.tags} aria-label="Topics">
				{project.tags.map((tag) => (
					<li key={tag} className={styles.tag}>
						{tag}
					</li>
				))}
			</ul>

			<span className={styles.language} title={project.language}>
				{language.short}
			</span>
		</article>
	);
}
