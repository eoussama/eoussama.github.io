import { MAIN_PATH } from './shapes';
import styles from './MainPath.module.css';

/** The dashed path that weaves behind Skills and Projects on desktop. */
export function MainPath() {
	return (
		<svg className={styles.path} viewBox={MAIN_PATH.viewBox} aria-hidden="true">
			<path d={MAIN_PATH.path} />
		</svg>
	);
}
