Discord keeps your own emojis, stickers and animated media behind Nitro. Nitfree keeps them in a library in your browser instead, and sends them the way Discord already lets anyone send a picture: as an upload, sized to look the part.

### How it sends

An emoji is resized to 48 pixels, Discord's large emoji size, and a sticker to 160. Animated GIF, APNG and WebP keep their animation: the frames are decoded, resized and encoded again as a GIF. Originals are kept and the sized copies cached, and a file over Discord's free upload limit is compressed or turned away with a clear message. One click sends; Shift and click drops it into the message instead.

### Living inside someone else's page

Nitfree adds a button to Discord's chat bar and a tab to its expression picker, next to GIFs, Stickers and Emoji. Discord redraws its interface all the time, on every channel switch, thread or edit, so the button is put back whenever the chat bar is rebuilt, and never twice. If the picker's markup changes, the library falls back to a panel of its own beside the button.

Discord also changes its page often, so every selector Nitfree relies on lives in one file, and a built-in diagnostic says which parts still work. A Discord update is usually a one-file fix.

### Looking native

Nothing about its look is hard-coded. Nitfree reads Discord's own design tokens from the live page and maps them onto its own, so it matches every Discord theme, from light to midnight, and follows the switch the moment Discord changes. The extension's popup cannot see Discord's page, so the last palette seen is saved for it. Its motion follows Discord's own, and stops when the system or Discord asks for reduced motion.

### Yours, and only yours

Everything stays in the browser, in IndexedDB. There is no account, no server and no tracking. A library exports to a single `.nitfree` file, a zip with a manifest, the library and the original files, and importing one skips duplicates by their content hash.

It is built with WXT and Svelte as a Manifest V3 extension for Chrome, Edge and Firefox from one codebase. It began in Vue; the current version is a rewrite.
