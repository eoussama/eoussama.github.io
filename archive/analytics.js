/*
 * Google Analytics for the archived versions of the portfolio (/v/<x.y>/), injected
 * at build time with the site's measurement ID and the version's number.
 *
 * - Never asks: it counts only visitors who allowed analytics on the current site,
 *   whose answer (localStorage "consent") is shared by every version on ouss.es.
 * - Every page view carries site_version, as the current site's do.
 * - Ads signals stay off.
 */
(() => {
	'use strict';

	const script = document.currentScript;
	const id = script && script.dataset.ga;
	const version = script && script.dataset.version;
	let consent = null;

	try {
		consent = localStorage.getItem('consent');
	} catch {
		// Storage blocked: no answer, so nothing is counted.
	}

	if (!id || consent !== 'granted') return;

	window.dataLayer = window.dataLayer || [];
	window.gtag = function gtag() {
		// gtag.js reads the arguments object itself, so it must be pushed as is.
		window.dataLayer.push(arguments);
	};

	window.gtag('consent', 'default', {
		analytics_storage: 'granted',
		ad_storage: 'denied',
		ad_user_data: 'denied',
		ad_personalization: 'denied',
	});
	window.gtag('js', new Date());
	window.gtag('config', id, { site_version: version || '' });

	const loader = document.createElement('script');

	loader.async = true;
	loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
	document.head.append(loader);
})();
