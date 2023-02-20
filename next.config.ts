import type { NextConfig } from 'next';

/**
 * The site is exported as plain static files so it can be hosted on GitHub Pages.
 *
 * BASE_PATH lets the same build be served from a sub-folder, e.g. `/v/0.3` in the
 * ouss.es version archive. It is empty when the site is served from the root.
 */
const basePath = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');

const nextConfig: NextConfig = {
	output: 'export',
	trailingSlash: true,
	basePath,
	images: { unoptimized: true },
	env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
