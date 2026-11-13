Two friends run hardware stores, the kind that sell screws by the box, pipe by the length and paint by the can. They needed to know what they have, what sold and what to reorder, from a phone behind the counter. PockInv began as a prototype in 2023 and was restarted from scratch in October 2026, with offline sync designed in from the start.

### What it does

It opens on the month: sales, purchases, gross profit and how many items are running low. Items carry their unit, prices, a low-stock threshold and a photo. A purchase brings stock in and a sale takes it out, each in a few taps; a walk-in sale needs no client. It works in English, Arabic (right to left) and French, in dirhams by default or any currency, with an optional PIN and a backup to export.

### Stock is a ledger, not a number

The one idea everything rests on: stock is never stored. It is always purchases minus sales. If two phones each sell the same item while offline, a stored count would keep only one of the sales once they sync; a ledger keeps both, and the count comes out right. The same sync design as Sewnique carries the rest: every change stamped with a hybrid logical clock, written with its outbox entry in one transaction, and merged the same way on every device.

### Kept small on purpose

The first version leaves out what the shops do not need yet: several people editing at once with roles, baskets of several items in one sale, invoices and taxes. Signing in is optional and only adds sync between devices; everything works without it.

### No server of my own

The app is a Vue 3 web app, packaged for Android with Capacitor and served from Cloudflare Pages. Data lives on the device in IndexedDB and syncs through Supabase. Continuous integration runs on a self-hosted runner inside Podman, Android builds included.
