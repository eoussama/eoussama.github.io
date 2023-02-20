import type { CSSProperties, ElementType } from 'react';
import styles from './OutlinedText.module.css';

type OutlinedTextProps = {
	as?: ElementType;
	id?: string;
	children: string;
	className?: string;
	/** Offsets of the two outlines behind the text, in px (design values). */
	middle?: [number, number];
	back?: [number, number];
};

/**
 * The design's layered title: a solid top layer, with two 1px outlines of the
 * same text offset up and to the left behind it.
 */
export function OutlinedText({ as: Tag = 'span', id, children, className, middle = [-3, -3], back = [-6, -6] }: OutlinedTextProps) {
	const style = {
		'--middle-x': `${middle[0]}px`,
		'--middle-y': `${middle[1]}px`,
		'--back-x': `${back[0]}px`,
		'--back-y': `${back[1]}px`,
	} as CSSProperties;

	return (
		<Tag id={id} className={`${styles.text} ${className ?? ''}`} style={style}>
			<span className={styles.back} aria-hidden="true">{children}</span>
			<span className={styles.middle} aria-hidden="true">{children}</span>
			<span className={styles.front}>{children}</span>
		</Tag>
	);
}
