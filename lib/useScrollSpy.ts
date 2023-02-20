'use client';

import { useEffect, useState } from 'react';

/** Returns the id of the section currently crossing the middle of the viewport. */
export function useScrollSpy(ids: readonly string[]): string {
	const [active, setActive] = useState(ids[0]);

	useEffect(() => {
		const sections = ids
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) setActive(entry.target.id);
				}
			},
			{ rootMargin: '-50% 0px -50% 0px' },
		);

		sections.forEach((section) => observer.observe(section));
		return () => observer.disconnect();
	}, [ids]);

	return active;
}
