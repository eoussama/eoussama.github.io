'use client';

import { Toggle } from '@base-ui/react/toggle';
import { Icon } from '@/components/Icon/Icon';
import { useTheme } from '@/lib/useTheme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	const dark = theme === 'dark';

	return (
		<Toggle
			className={`${styles.toggle} ${className ?? ''}`}
			pressed={dark}
			onPressedChange={(pressed) => setTheme(pressed ? 'dark' : 'light')}
			aria-label="Dark theme"
		>
			<Icon name={dark ? 'sun' : 'moon'} size={24} />
		</Toggle>
	);
}
