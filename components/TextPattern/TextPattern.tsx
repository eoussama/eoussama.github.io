import { useId } from 'react';

type TextPatternProps = {
	text: string;
	/** Size of one tile (design values). */
	tileWidth: number;
	tileHeight: number;
	fontSize: number;
	fontWeight?: number;
	className?: string;
};

/** A tiled background of repeated words, like the card patterns in the design. */
export function TextPattern({ text, tileWidth, tileHeight, fontSize, fontWeight = 400, className }: TextPatternProps) {
	const id = useId();

	return (
		<svg className={className} width="100%" height="100%" aria-hidden="true" focusable="false">
			<defs>
				<pattern id={id} width={tileWidth} height={tileHeight} patternUnits="userSpaceOnUse">
					<text x="0" y={fontSize} fontSize={fontSize} fontWeight={fontWeight} fill="currentColor" fontFamily="var(--font-sans)">
						{text}
					</text>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} />
		</svg>
	);
}
