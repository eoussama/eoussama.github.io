Swift TODO began in 2018 as a small Chrome extension: a list in the toolbar, kept in the popup's local storage. The current version is a rewrite on Manifest V3 for Chrome, Edge and Firefox, and its hardest part is the one that sounds simplest: keeping the list in sync across devices without a server.

### Syncing with no server

Everything is stored in the browser's own sync storage, the one tied to your browser account, so there is nothing to sign up for and nothing of mine to run. That storage is small and strict: about 100 KB in all, 8 KB a key, 512 keys, and a limited number of writes a minute and an hour. Each to-do gets a key of its own, measured the way the browser counts it, and the app keeps itself under 95% of the space and 90% of the write rate.

Every change goes first into an outbox on the device, so closing the popup mid-save loses nothing, and is then written to sync in batches. A write log shared by the popup and the background keeps every part of the extension within the same budget, and a lock keeps them from writing the same keys at once. When the budget runs out, the outbox waits and an alarm retries from the background.

### When it doesn't fit

There is no cap on the number of to-dos. Sync holds a few hundred; past that, new ones stay on the device and move to sync once space frees up, and you can choose which ones stay synced. A to-do only moves back while usage is under 85%, so it doesn't bounce between the two.

### Two devices at once

Edits made on two devices are merged rather than overwritten. A to-do keeps its newest version, stamped so that a device whose clock runs behind can't make a fresh edit look older than the one it replaces. A delete notes the version it removes, so it can't wipe out an edit made elsewhere since. Lists and settings are merged entry by entry against the copy the edit started from. Order is kept with fractional positions, so moving a to-do is usually a single write instead of renumbering the list.

### Typing dates

"call Sam tomorrow 3pm" or "water plants every 3 days" becomes a due date or a repeat rule, and the date words come out of the text. The parser is just as careful about what isn't a date: "water plants daily" repeats, "cancel monthly subscription" doesn't. A to-do due on the 31st lands on a short month's last day and goes back to the 31st the month after, and a repeat keeps its time of day across daylight-saving changes.

### Six skins

Notepad, Sticky board, Chalkboard, Scroll, Minimal and Aurora, each in light and dark with eight accent colors, and to-dos written in each skin's own hand. All of it works from the keyboard and with screen readers.

It is built with WXT and Svelte 5. The logic has full unit test coverage and is mutation-tested with Stryker, and end-to-end tests, accessibility checks included, run on the built extension in a real browser.
