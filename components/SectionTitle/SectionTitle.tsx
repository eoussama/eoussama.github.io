import { OutlinedText } from '@/components/OutlinedText/OutlinedText';
import styles from './SectionTitle.module.css';

export function SectionTitle({ id, children }: { id: string; children: string }) {
	return (
		<h2 className={styles.title}>
			<OutlinedText id={id}>{children}</OutlinedText>
		</h2>
	);
}
