IRES advises on Morocco's strategic questions, and its analysts work from two kinds of material: the institute's own studies, and a steady flow of outside sources. They needed one place to keep both, search them in Arabic, French and English, and write from them, where every sentence in a brief can be followed back to the page it came from, and where no document ever leaves the institute.

### What it does

Material comes in as files, scans, audio or video. Each one is checked, versioned, and extracted: text from documents, OCR from scans, transcripts from recordings. A reviewer approves it before analysts can use it. From there, search runs across all three languages in every direction, an Arabic question finding a French passage and the reverse, mixing keyword and semantic retrieval. Analysts gather what they find into evidence sets, ask questions and get answers that cite the exact version and place they rest on, and draft strategic notes in the institute's own formats, which a reviewer signs off.

### The decisions that shaped it

- **Nothing leaves.** The models run on the institute's own machines through llama.cpp: one to embed text, one to rerank results, one to write. Each is pinned to a version, and an administrator can switch between approved ones. Speech is transcribed locally with Whisper.
- **A citation never moves.** Processing a source again makes a new version instead of rewriting the old one, so a citation in last month's brief still opens what the analyst read then.
- **Permission comes before retrieval.** The model only ever sees what the person asking may see. Running the platform grants no access to its content.
- **Generated text is never a source.** Answers and drafts point to evidence but never become evidence themselves, and nothing is published without a person's review.
- **Untrusted files stay at arm's length.** Uploads are parsed by Python workers in bounded subprocesses, and ingestion runs through a durable queue (NATS JetStream), so a malformed file fails alone and a restart loses nothing.

The product itself is a Next.js interface over a NestJS API, with PostgreSQL holding both the records and the vectors (pgvector), Redis for rate limits, and private S3-compatible storage for the files.

### Where it stands

Ingestion, search, evidence sets, cited answers and chat are built, and strategic notes follow the institute's terms of reference in code, down to sections that must be present and a maturity score the server computes. Retrieval is measured against a set of judged queries, reported per language and per direction. The test suite runs to more than eight thousand tests. Reports, source monitoring and a knowledge graph come next.
