import { ICONS, type IconName } from './icons';

type IconProps = {
	name: IconName;
	size?: number;
	className?: string;
};

/** Decorative icon; label the control that contains it instead. */
export function Icon({ name, size = 24, className }: IconProps) {
	const icon = ICONS[name];
	return (
		<svg
			className={className}
			width={size}
			height={size}
			viewBox={icon.viewBox}
			aria-hidden="true"
			focusable="false"
			dangerouslySetInnerHTML={{ __html: icon.body }}
		/>
	);
}
