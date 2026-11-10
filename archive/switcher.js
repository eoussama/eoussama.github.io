/*
 * <version-switcher>: a small, self-contained version picker that is injected
 * into every hosted version of the portfolio at build time.
 *
 * - Lives in a Shadow DOM so the host page's CSS can't affect it (and vice versa).
 * - Reads the list of versions from /archive/versions.json.
 * - Renders nothing if that list can't be loaded.
 */
(() => {
	'use strict';

	const TAG = 'version-switcher';
	const MANIFEST_URL = '/archive/versions.json';

	if (customElements.get(TAG)) return;

	const STYLES = `
		:host {
			all: initial !important;
			position: fixed !important;
			left: 16px !important;
			bottom: 16px !important;
			z-index: 2147483647 !important;
			display: block !important;
		}

		.root {
			--bg: rgba(255, 255, 255, 0.82);
			--fg: #1b1b1f;
			--muted: #6b6b76;
			--line: rgba(0, 0, 0, 0.12);
			--accent: #3b5bdb;
			--accent-fg: #ffffff;
			--hover: rgba(0, 0, 0, 0.05);
			--shadow: 0 6px 24px rgba(0, 0, 0, 0.18);

			position: relative;
			font: 500 12px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
			color: var(--fg);
			-webkit-font-smoothing: antialiased;
		}

		@media (prefers-color-scheme: dark) {
			.root {
				--bg: rgba(28, 28, 32, 0.82);
				--fg: #ececf1;
				--muted: #9a9aa6;
				--line: rgba(255, 255, 255, 0.14);
				--accent: #7c97ff;
				--accent-fg: #0d0d10;
				--hover: rgba(255, 255, 255, 0.07);
				--shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
			}
		}

		*, *::before, *::after { box-sizing: border-box; }

		.pill {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			margin: 0;
			padding: 6px 10px;
			border: 1px solid var(--line);
			border-radius: 999px;
			background: var(--bg);
			color: inherit;
			font: inherit;
			cursor: pointer;
			box-shadow: var(--shadow);
			-webkit-backdrop-filter: blur(10px);
			backdrop-filter: blur(10px);
			opacity: 0.7;
			transition: opacity 0.15s ease;
		}

		.pill:hover,
		.pill:focus-visible,
		.pill[aria-expanded="true"] { opacity: 1; }

		.pill:focus-visible,
		.item:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}

		.pill .sep { color: var(--muted); }

		.chevron {
			width: 10px;
			height: 10px;
			transition: transform 0.15s ease;
		}

		.pill[aria-expanded="true"] .chevron { transform: rotate(180deg); }

		.panel {
			position: absolute;
			left: 0;
			bottom: calc(100% + 8px);
			width: max-content;
			min-width: 230px;
			max-width: calc(100vw - 32px);
			max-height: min(70vh, 420px);
			overflow-y: auto;
			margin: 0;
			padding: 10px 8px;
			border: 1px solid var(--line);
			border-radius: 12px;
			background: var(--bg);
			box-shadow: var(--shadow);
			-webkit-backdrop-filter: blur(14px);
			backdrop-filter: blur(14px);
			transform-origin: bottom left;
			animation: pop 0.14s ease-out;
		}

		.panel[hidden] { display: none; }

		@keyframes pop {
			from { opacity: 0; transform: translateY(4px) scale(0.98); }
			to   { opacity: 1; transform: none; }
		}

		.heading {
			margin: 0 8px 6px;
			color: var(--muted);
			font-size: 11px;
			font-weight: 600;
			letter-spacing: 0.04em;
			text-transform: uppercase;
		}

		ol {
			position: relative;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		/* Timeline line connecting the dots. */
		ol::before {
			content: "";
			position: absolute;
			left: 15px;
			top: 14px;
			bottom: 14px;
			width: 1px;
			background: var(--line);
		}

		.item {
			position: relative;
			display: grid;
			grid-template-columns: 16px 1fr auto;
			align-items: center;
			column-gap: 10px;
			padding: 6px 8px;
			border-radius: 8px;
			color: inherit;
			text-decoration: none;
		}

		.item:hover { background: var(--hover); }

		.dot {
			justify-self: center;
			width: 9px;
			height: 9px;
			border: 2px solid var(--muted);
			border-radius: 50%;
			background: var(--bg);
		}

		.item[aria-current="page"] .dot {
			border-color: var(--accent);
			background: var(--accent);
		}

		.label { display: flex; flex-direction: column; }
		.label strong { font-weight: 650; }
		.label span { color: var(--muted); font-weight: 400; }

		.badge {
			padding: 1px 6px;
			border-radius: 999px;
			background: var(--accent);
			color: var(--accent-fg);
			font-size: 10px;
			font-weight: 600;
		}

		@media (prefers-reduced-motion: reduce) {
			.pill, .chevron { transition: none; }
			.panel { animation: none; }
		}

		@media print {
			.root { display: none; }
		}
	`;

	const CHEVRON = `<svg class="chevron" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 6.5 5 3.5l3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

	const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
	}[c]));

	const hrefFor = (entry) => (entry.current ? '/' : `/v/${entry.version}/`);

	class VersionSwitcher extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' });
			this.onDocumentClick = this.onDocumentClick.bind(this);
			this.onKeyDown = this.onKeyDown.bind(this);
		}

		async connectedCallback() {
			let versions;

			try {
				const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				versions = await response.json();
				if (!Array.isArray(versions) || versions.length === 0) throw new Error('Empty manifest');
			} catch {
				this.remove();
				return;
			}

			const match = location.pathname.match(/^\/v\/(\d+\.\d+)(?:\/|$)/);
			const latest = versions.find((v) => v.current) ?? versions[versions.length - 1];
			const active = (match && versions.find((v) => v.version === match[1])) ?? latest;

			this.render(versions, active, latest);
		}

		disconnectedCallback() {
			document.removeEventListener('click', this.onDocumentClick, true);
			document.removeEventListener('keydown', this.onKeyDown);
		}

		render(versions, active, latest) {
			const items = [...versions].reverse().map((entry) => `
				<li>
					<a class="item" href="${hrefFor(entry)}"${entry === active ? ' aria-current="page"' : ''}>
						<span class="dot" aria-hidden="true"></span>
						<span class="label">
							<strong>v${escapeHtml(entry.version)} · ${escapeHtml(entry.year)}</strong>
							<span>${escapeHtml(entry.title)}</span>
						</span>
						${entry === latest ? '<span class="badge">Latest</span>' : '<span></span>'}
					</a>
				</li>`).join('');

			this.shadowRoot.innerHTML = `
				<style>${STYLES}</style>
				<div class="root">
					<div class="panel" id="panel" role="dialog" aria-label="Portfolio versions" hidden>
						<p class="heading">Portfolio versions</p>
						<ol>${items}</ol>
					</div>
					<button class="pill" type="button" aria-expanded="false" aria-controls="panel"
						aria-label="Portfolio version v${escapeHtml(active.version)} from ${escapeHtml(active.year)}. Show all versions">
						<span>v${escapeHtml(active.version)}</span>
						<span class="sep" aria-hidden="true">·</span>
						<span>${escapeHtml(active.year)}</span>
						${CHEVRON}
					</button>
				</div>`;

			this.button = this.shadowRoot.querySelector('.pill');
			this.panel = this.shadowRoot.querySelector('.panel');
			this.button.addEventListener('click', () => this.toggle());
		}

		get isOpen() {
			return this.button?.getAttribute('aria-expanded') === 'true';
		}

		toggle(force) {
			const open = force ?? !this.isOpen;
			this.button.setAttribute('aria-expanded', String(open));
			this.panel.hidden = !open;

			if (open) {
				document.addEventListener('click', this.onDocumentClick, true);
				document.addEventListener('keydown', this.onKeyDown);
				(this.panel.querySelector('[aria-current="page"]') ?? this.panel.querySelector('a'))?.focus();
			} else {
				document.removeEventListener('click', this.onDocumentClick, true);
				document.removeEventListener('keydown', this.onKeyDown);
			}
		}

		onDocumentClick(event) {
			if (!event.composedPath().includes(this)) this.toggle(false);
		}

		onKeyDown(event) {
			if (event.key === 'Escape') {
				this.toggle(false);
				this.button.focus();
			}
		}
	}

	customElements.define(TAG, VersionSwitcher);

	const mount = () => document.body.appendChild(document.createElement(TAG));

	if (document.body) mount();
	else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
