import type { Language } from './languages';

export type Project = {
	name: string;
	url: string;
	description: string;
	language: Language;
	stars: number;
	forks: number;
	tags: string[];
};

/** A snapshot: counts are frozen on purpose, nothing is fetched at runtime. */
export const OPEN_SOURCE: Project[] = [
	{
		name: 'eo-textdraw-editor',
		url: 'https://github.com/EOussama/eo-textdraw-editor',
		description: 'Your on-the-fly, online Textdraw editor.',
		language: 'TypeScript',
		stars: 4,
		forks: 1,
		tags: ['textdraw', 'editor', 'samp'],
	},
	{
		name: 'translator.js',
		url: 'https://github.com/EOussama/eo-translatorjs',
		description: 'A simple javascript library for translating web content.',
		language: 'JavaScript',
		stars: 17,
		forks: 3,
		tags: ['translate', 'dictionary', 'node-package'],
	},
	{
		name: 'samp-front',
		url: 'https://github.com/EOussama/samp-front',
		description: 'A starter landing page template for samp servers.',
		language: 'PHP',
		stars: 5,
		forks: 2,
		tags: ['template', 'samp'],
	},
	{
		name: 'anusic-api',
		url: 'https://github.com/EOussama/anusic-api',
		description: 'Anime themes API.',
		language: 'Go',
		stars: 5,
		forks: 0,
		tags: ['scrapper', 'anime', 'api'],
	},
	{
		name: 'temme.js',
		url: 'https://github.com/EOussama/temmejs',
		description: 'Emmet, but for JavaScript.',
		language: 'TypeScript',
		stars: 11,
		forks: 0,
		tags: ['emmet', 'dom', 'html'],
	},
	{
		name: 'typewriter.js',
		url: 'https://github.com/EOussama/eo-typewriterjs',
		description: 'On the go typewriting utility for JavaScript.',
		language: 'TypeScript',
		stars: 9,
		forks: 2,
		tags: ['typewriter', 'animation'],
	},
];

export const CONTRIBUTIONS: Project[] = [
	{
		name: 'umami',
		url: 'https://github.com/umami-software/umami',
		description: 'A privacy-first, open source web analytics platform.',
		language: 'TypeScript',
		stars: 40045,
		forks: 8519,
		tags: ['analytics', 'privacy'],
	},
	{
		name: 'open.mp web',
		url: 'https://github.com/openmultiplayer/web',
		description: 'The open.mp homepage, documentation and server index.',
		language: 'TypeScript',
		stars: 145,
		forks: 498,
		tags: ['omp', 'docs'],
	},
	{
		name: 'YSI-Includes',
		url: 'https://github.com/pawn-lang/YSI-Includes',
		description: 'Just the YSI include files, none of the extra stuff.',
		language: 'Pawn',
		stars: 226,
		forks: 110,
		tags: ['pawn', 'sa-mp'],
	},
	{
		name: 'vscode-pawn',
		url: 'https://github.com/Southclaws/vscode-pawn',
		description: 'Pawn tools for vscode, powered by sampctl.',
		language: 'TypeScript',
		stars: 50,
		forks: 17,
		tags: ['pawn', 'vscode-extension'],
	},
	{
		name: 'open.mp wiki',
		url: 'https://github.com/openmultiplayer/wiki',
		description: 'The open.mp API documentation.',
		language: 'JavaScript',
		stars: 70,
		forks: 81,
		tags: ['wiki', 'docs'],
	},
	{
		name: 'awesome-morocco',
		url: 'https://github.com/geeksblabla/awesome-morocco',
		description: 'A list of awesome Moroccan things for developers.',
		language: 'TypeScript',
		stars: 753,
		forks: 175,
		tags: ['awesome-list', 'morocco'],
	},
	{
		name: 'mentions',
		url: 'https://github.com/ScavengeSurvive/mentions',
		description: 'Lets players mention each other by ID in chat.',
		language: 'Pawn',
		stars: 6,
		forks: 2,
		tags: ['pawn-package'],
	},
	{
		name: 'formatex',
		url: 'https://github.com/Southclaws/formatex',
		description: 'Slice’s formatex, with a home on GitHub.',
		language: 'Pawn',
		stars: 10,
		forks: 9,
		tags: ['pawn', 'format'],
	},
];
