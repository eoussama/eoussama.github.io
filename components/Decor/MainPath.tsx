'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MAIN_PATH } from './shapes';
import styles from './MainPath.module.css';

/** Where the path starts, relative to the top of the Skills + Projects area (design value). */
const TOP = -137;
const [VX, VY, VW] = MAIN_PATH.viewBox.split(' ').map(Number);
const SAMPLES = 600;
const FOOTER_OVERLAP = 40;

/** From the mockup's last dash, carry on down to the footer. */
function tail(bottom: number) {
	const { x, y } = MAIN_PATH.end;
	const length = bottom - y;
	if (length <= 0) return '';
	return ` C${x + 34} ${y + length * 0.35} ${x + 150} ${y + length * 0.6} ${x + 170} ${bottom}`;
}

/**
 * The dashed path that weaves behind Skills and Projects on desktop. It runs down
 * to the footer and draws itself in as the page scrolls.
 */
export function MainPath() {
	const id = useId();
	const svgRef = useRef<SVGSVGElement>(null);
	const revealRef = useRef<SVGPathElement>(null);
	const [height, setHeight] = useState(MAIN_PATH.end.y - VY + 40);

	// Size the drawing to the whole Skills + Projects area, so the path reaches the footer.
	useEffect(() => {
		const area = svgRef.current?.parentElement;
		if (!area) return;
		const observer = new ResizeObserver(() => setHeight(area.offsetHeight - TOP));
		observer.observe(area);
		return () => observer.disconnect();
	}, []);

	// Ends a little past the bottom of the area, under the footer's wave.
	const d = MAIN_PATH.route + tail(VY + height + FOOTER_OVERLAP);

	// Reveal the path in step with the scroll; at the very bottom of the page it is
	// drawn all the way into the footer.
	useEffect(() => {
		const svg = svgRef.current;
		const reveal = revealRef.current;
		if (!svg || !reveal) return;

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			reveal.style.strokeDashoffset = '0';
			return;
		}

		const total = reveal.getTotalLength();
		const ys = Array.from({ length: SAMPLES + 1 }, (_, i) => reveal.getPointAtLength((total * i) / SAMPLES).y);

		let frame = 0;
		const update = () => {
			frame = 0;
			// The path follows a line at 60% of the screen, so it visibly draws in as you scroll.
			// Over the last half screen of scrolling the line speeds up, so the path meets the
			// footer exactly when the page reaches the bottom.
			const remaining = document.documentElement.scrollHeight - (scrollY + innerHeight);
			const catchUp = Math.min(Math.max(1 - remaining / (innerHeight * 0.5), 0), 1);
			const box = svg.getBoundingClientRect();
			const lineOnScreen = innerHeight * 0.6 + (box.bottom - innerHeight * 0.6) * catchUp;
			const line = VY + lineOnScreen - box.top;
			let reached = 0;
			while (reached < SAMPLES && ys[reached + 1] <= line) reached++;
			reveal.style.strokeDashoffset = remaining <= 4 ? '0' : String(1 - reached / SAMPLES);
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};

		update();
		addEventListener('scroll', schedule, { passive: true });
		addEventListener('resize', schedule);
		return () => {
			removeEventListener('scroll', schedule);
			removeEventListener('resize', schedule);
			cancelAnimationFrame(frame);
		};
	}, [d]);

	return (
		<svg
			ref={svgRef}
			className={styles.path}
			style={{ top: TOP, height }}
			viewBox={`${VX} ${VY} ${VW} ${height}`}
			preserveAspectRatio="xMinYMin meet"
			aria-hidden="true"
		>
			<defs>
				<mask id={id} maskUnits="userSpaceOnUse" x={VX} y={VY - 20} width={VW + 400} height={height + FOOTER_OVERLAP + 60}>
					<path ref={revealRef} className={styles.reveal} d={d} pathLength={1} />
				</mask>
			</defs>
			<path
				className={styles.dashes}
				d={d}
				mask={`url(#${id})`}
				strokeDasharray={`${MAIN_PATH.dash} ${MAIN_PATH.dash}`}
				strokeDashoffset={MAIN_PATH.dash - MAIN_PATH.firstDash}
			/>
		</svg>
	);
}
