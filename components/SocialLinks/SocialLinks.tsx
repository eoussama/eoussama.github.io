import { Icon } from '@/components/Icon/Icon';
import { SOCIALS } from '@/data/profile';
import styles from './SocialLinks.module.css';

/** Round icon links (footer) or icon + handle rows (mobile menu). */
export function SocialLinks({ variant }: { variant: 'row' | 'list' }) {
	return (
		<ul className={styles[variant]}>
			{SOCIALS.map((social) => (
				<li key={social.name}>
					<a
						className={styles.link}
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={variant === 'row' ? social.name : undefined}
					>
						<span className={styles.circle}>
							<Icon name={social.icon} size={variant === 'row' ? 21 : 13} />
						</span>
						{variant === 'list' && (
							<span className={styles.handle}>
								<span className="visually-hidden">{social.name}: </span>
								{social.handle}
							</span>
						)}
					</a>
				</li>
			))}
		</ul>
	);
}
