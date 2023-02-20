import styles from './BurgerIcon.module.css';

/**
 * Three lines that morph into a cross. `open` shows the cross; `animate` plays
 * the burger → cross transition when the icon mounts (used inside the menu).
 */
export function BurgerIcon({ open = false, animate = false }: { open?: boolean; animate?: boolean }) {
	return (
		<span className={styles.icon} data-open={open || undefined} data-animate={animate || undefined} aria-hidden="true">
			<span />
			<span />
			<span />
		</span>
	);
}
