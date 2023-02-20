import styles from './Chip.module.css';

type ChipProps = {
	children: string;
	href?: string;
	size?: 'small' | 'medium';
};

export function Chip({ children, href, size = 'medium' }: ChipProps) {
	const className = `${styles.chip} ${styles[size]}`;
	return href ? (
		<a className={`${className} ${styles.link}`} href={href} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	) : (
		<span className={className}>{children}</span>
	);
}
