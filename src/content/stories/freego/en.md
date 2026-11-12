Version 0.1 is a rewrite for FreeStuff’s API v2. Every webhook is checked against its Ed25519 signature and timestamp, and replays are recognised, so a retried delivery never runs a callback twice.
