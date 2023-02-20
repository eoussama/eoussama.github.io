export const SECTIONS = [
	{ id: 'home', label: 'Home' },
	{ id: 'skills', label: 'Skills' },
	{ id: 'projects', label: 'Projects' },
] as const;

export const SECTION_IDS = SECTIONS.map((section) => section.id);
