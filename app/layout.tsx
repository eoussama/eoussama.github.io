import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

const roboto = Roboto({
	subsets: ['latin'],
	weight: ['300', '400', '500', '700', '900'],
	variable: '--font-roboto',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'EOussama',
	description: 'Oussama Essamadi, web and mobile developer with a keen eye for good design and seamless user experience.',
};

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#ffffff' },
		{ media: '(prefers-color-scheme: dark)', color: '#111928' },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={roboto.variable} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
			</head>
			<body>
				<div className="root">{children}</div>
			</body>
		</html>
	);
}
