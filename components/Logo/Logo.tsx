import Image from 'next/image';
import logoLight from '@/assets/brand/logo-light.png';
import logoDark from '@/assets/brand/logo-dark.png';
import styles from './Logo.module.css';

export function Logo({ size = 40 }: { size?: number }) {
	return (
		<span className={styles.logo} style={{ width: size, height: size }}>
			<Image className={styles.light} src={logoLight} alt="" width={size} height={size} />
			<Image className={styles.dark} src={logoDark} alt="" width={size} height={size} />
		</span>
	);
}
