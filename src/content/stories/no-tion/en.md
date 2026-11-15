I made no-tion for myself. I keep some complex Notion databases, with relations running between them, and updating one record by hand in Notion means opening the right page, finding the right relation and filling in property after property. I needed a tool that made updating them quick, so I built one that reads my databases and gives each a form that looks and feels like Notion.

### What it does

It lists every database shared with its Notion integration and shows each as a gallery or a table, with each row opening as a Notion-style page I can edit. New rows go in through a form. A database with a hand-written definition gets a tailored form: Cinema & TV can fill itself in from a title search. Any other database gets a form generated from its Notion properties, with no setup. It has a light and a dark mode, and one user behind one password.

### A copy on the device

Pages open instantly because the data is already on the device. Queries are cached in IndexedDB, so pages stay readable offline, and a change shows up at once and syncs to Notion in the background. The app is client-rendered; a small Nitro server holds the Notion token and the password, so neither reaches the browser.

### The form follows Notion

Select, multi-select and status options always come from the live Notion schema, so a form never drifts from the database it edits. Adding a database that needs more than a generated form means writing a definition: custom labels, hidden or conditional fields, defaults, validation, or a lookup that prefills the form.

### Built for one person

Sessions are signed cookies that expire after two hours, and failed logins are throttled. It is a tool for my own databases rather than a product, so it leaves out accounts, sharing and anything else a second user would need.

### The stack

Nuxt 4 and Nuxt UI on Tailwind CSS, themed after Notion. TanStack Query, persisted to IndexedDB, holds the data; TanStack Form and zod handle the forms; the official Notion client reads and writes. Tests run on Vitest.
