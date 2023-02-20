'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { Icon } from '@/components/Icon/Icon';
import { SectionTitle } from '@/components/SectionTitle/SectionTitle';
import { CONTRIBUTIONS, OPEN_SOURCE, type Project } from '@/data/projects';
import { ProjectRow } from './ProjectRow';
import styles from './Projects.module.css';

function matches(project: Project, query: string) {
	if (!query) return true;
	const haystack = [project.name, project.description, project.language, ...project.tags].join(' ').toLowerCase();
	return query
		.toLowerCase()
		.split(/\s+/)
		.every((word) => haystack.includes(word));
}

export function Projects() {
	const [query, setQuery] = useState('');
	const deferred = useDeferredValue(query.trim());

	const openSource = useMemo(() => OPEN_SOURCE.filter((p) => matches(p, deferred)), [deferred]);
	const contributions = useMemo(() => CONTRIBUTIONS.filter((p) => matches(p, deferred)), [deferred]);

	return (
		<section id="projects" className={styles.projects} aria-labelledby="projects-title">
			<div className={`container ${styles.head}`}>
				<SectionTitle id="projects-title">Projects</SectionTitle>

				<Field.Root className={styles.search}>
					<Field.Label className="visually-hidden">Search projects</Field.Label>
					<Icon name="search" size={20} className={styles.searchIcon} />
					<Input
						className={styles.input}
						type="search"
						placeholder="Search for project..."
						value={query}
						onValueChange={(value) => setQuery(value)}
						autoComplete="off"
						spellCheck={false}
					/>
				</Field.Root>
			</div>

			<div className={styles.rows}>
				<ProjectRow id="open-source" title="Open Source" projects={openSource} rows={3} query={deferred} />
				<ProjectRow id="contributions" title="Contributions" projects={contributions} rows={2} query={deferred} />
			</div>
		</section>
	);
}
