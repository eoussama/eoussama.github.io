/**
 * The folder the site is served from (e.g. `/v/0.3` in the ouss.es archive, or empty
 * at the root). next/link, next/image static imports and CSS assets get it
 * automatically; plain URLs such as files in /public need this helper.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBasePath(path: string): string {
	return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
