import type { IconName } from '@/components/Icon/icons';

export const PROFILE = {
	name: 'Oussama Essamadi',
	handle: 'EOussama',
	greeting: 'Hello, my name is',
	bio: [
		'Web and mobile developer with a keen eye for good design and seamless user experience. I build SaaS apps professionally and contribute to Open Source as a token of passion.',
		'This is where I’m supposed to self-insert a cliché slogan and give myself a shoulder tap, so I’ll leave it at that.',
	],
	email: 'oussama.essamadi@gmail.com',
	resume: '/resume.pdf',
	year: 2023,
} as const;

export type Social = {
	name: string;
	/** Shown next to the icon in the mobile menu. */
	handle: string;
	url: string;
	icon: IconName;
};

export const SOCIALS: Social[] = [
	{ name: 'LinkedIn', handle: 'Oussama Essamadi', url: 'https://www.linkedin.com/in/eoussama', icon: 'linkedin' },
	{ name: 'GitHub', handle: 'EOussama', url: 'https://github.com/EOussama', icon: 'github' },
	{ name: 'Steam', handle: 'EOussama', url: 'https://steamcommunity.com/id/eoussama/', icon: 'steam' },
	{ name: 'YouTube', handle: 'EOussama', url: 'https://www.youtube.com/@eoussama', icon: 'youtube' },
	{ name: 'Twitter', handle: '@OussamaEssamadi', url: 'https://twitter.com/OussamaEssamadi', icon: 'twitter' },
	{ name: 'Figma', handle: 'Oussama Essamadi', url: 'https://www.figma.com/@eoussama', icon: 'figma' },
	{ name: 'Behance', handle: 'Oussama Essamadi', url: 'https://www.behance.net/oussamaessamadi', icon: 'behance' },
	{ name: 'Dribbble', handle: 'Oussama Essamadi', url: 'https://dribbble.com/EOussama', icon: 'dribbble' },
];
