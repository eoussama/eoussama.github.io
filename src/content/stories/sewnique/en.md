A tailor working alone keeps a business in their head and in notebooks: who ordered what, the measurements, the fittings, who has paid. Sewnique keeps it on their phone. It began in 2021 as an Angular prototype; the rebuild starts from the workshop rather than the database.

### Offline first, sync optional

Workshops are not always online, so every feature works with no connection and no account. The device is the source of truth; an account only adds a backup and a second device. Like Actual Budget, a phone can hold several workshops, each a profile with its own database, and each profile can link to one account. Unlinking keeps the local copy.

### Making two devices agree

Sync is my own, not a library's. Every change is stamped with a hybrid logical clock (the time, a counter, and the device), and rows merge field by field, last write winning. The same changes give the same result on every device and on the server, in any order. A change and its entry in the outbox are written in one local transaction, so nothing waits on the network, and every push and pull can be retried at any point without losing or doubling a change.

Some values cannot merge that way. Two devices each recording a payment would overwrite each other's balance. So balances and stock are never stored as counters: they are computed from payments and stock movements, and both increments survive.

### Media, kept light

Media is compressed on the device before it is stored or synced, images to WebP and audio to Opus, with the phone's own encoders, and a meter shows how much space each kind takes. Each kind can stay on the device instead.

### The rest of the workshop

Clients and their history, versioned measurements from the tailor's own templates, with a copy kept on each order, orders from request to delivery, fabrics and stock, deposits and balances, invoices and receipts as PDFs, and messages by WhatsApp or SMS. It speaks English, Arabic (right to left), French, Spanish and Italian, all bundled offline, and every release passes accessibility checks in light and dark, English and Arabic.

### Where it stands

The rebuild is complete on Android and the web; the Play Store release is next.
