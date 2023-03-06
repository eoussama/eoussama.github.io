import type { StaticImageData } from 'next/image';
import web from '@/assets/skills/web.jpg';
import ux from '@/assets/skills/ux.jpg';
import mobile from '@/assets/skills/mobile.jpg';

export type Skill = {
	id: string;
	label: string;
	title: string;
	description: string[];
	/** Projects the skill was used in, linking to each one. */
	tags: { label: string; url: string }[];
	image: StaticImageData;
};

const TAG = {
	publiProMax: { label: '#publi-pro-max', url: 'https://ouss.es/publi-pro-max/' },
	samadisa: { label: '#samadisa', url: 'https://samadisa.netlify.app' },
	cryptoKatana: { label: '#crypto-katana-marketplace', url: 'https://crypto-katana.netlify.app' },
	portfolio: { label: '#portfolio', url: 'https://ouss.es' },
	phoshare: { label: '#phoshare', url: 'https://phoshare.ouss.es/' },
	pockinv: { label: '#pockinv', url: 'https://pockinv.ouss.es/' },
	steamMcl: { label: '#steam-mcl', url: 'https://steam-mcl.ouss.es/' },
	typewriter: { label: '#typewriter', url: 'https://eo-typewriterjs.ouss.es/' },
};

export const SKILLS: Skill[] = [
	{
		id: 'web',
		label: 'WEB',
		title: 'Web',
		description: [
			'I dabble in all areas of web development, no matter the complexity or challenge. MEAN is my main stack, and I promise not just because it rhymes. I’m also comfortable with MERN and LAMP stacks to varying degrees. I make publicity landing pages, e-commerce platforms, Web 3.0 oriented projects, and whatever your next million dollars idea is.',
		],
		tags: [TAG.publiProMax, TAG.samadisa, TAG.cryptoKatana],
		image: web,
	},
	{
		id: 'ux',
		label: 'UX',
		title: 'UX',
		description: [
			'People say I’m way too experimental, but I always took that as a compliment.',
			'I create personalized user experiences across many platforms, breaking out of the universal comfort zone without sacrificing SEO guidelines and industry practices.',
		],
		tags: [TAG.steamMcl, TAG.typewriter],
		image: ux,
	},
	{
		id: 'mobile',
		label: 'MOBILE',
		title: 'Mobile',
		description: [
			'Mobile-first is always on the back of my subconsciousness.',
			'I always default to building PWAs to ensure Android and IOS compatibility on the go, however, when duty calls, I’m your Ionic/React Native guy.',
		],
		tags: [TAG.portfolio, TAG.phoshare, TAG.pockinv],
		image: mobile,
	},
];
