import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";



/** Text in every language the site speaks; English is required, the rest fall back to it. */
const localized = z.object({
  en: z.string(),
  ar: z.string().optional(),
  ary: z.string().optional(),
  fr: z.string().optional(),
  es: z.string().optional(),
  it: z.string().optional(),
  ja: z.string().optional(),
});

/**
 * Projects, public and private, in one model. Public ones also carry their repository;
 * private ones never do, and show as case studies.
 */
const projects = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/projects" }),
  schema: z.object({
    name: z.string(),
    /** Order on the home page and in lists; lower comes first. */
    order: z.number(),
    featured: z.boolean().default(false),
    /** How it is labelled in lists. */
    kind: z.enum(["open-source", "private", "side-project", "contribution"]),
    /** Whether its code is public; defaults to whether it has a repository. */
    access: z.enum(["open", "private"]).optional(),
    type: z.enum(["tool", "library", "app", "extension", "game", "site"]),
    /**
     * The organization it lives in, or the owner of the repository a contribution went
     * to. Names show it before a slash, muted ("nakamaorg/circus").
     */
    org: z.string().nullable().default(null),
    /** The main language. Filled in from the first of `languages`, else from GitHub. */
    language: z.string().nullable().default(null),
    /** Every language its code is written in, the main one first, for the Language filter. */
    languages: z.array(z.string()).default([]),
    /** The key frameworks and libraries it is built on, for the "Built with" filter. */
    tools: z.array(z.string()).default([]),
    /** Filled in from GitHub (the year the repository was created) when left out. */
    year: z.number().nullable().default(null),
    /** Its repository, or a list of them when the code lives in several (the main one first). */
    repo: z.union([z.url(), z.array(z.url()).min(1)]).nullable().default(null),
    live: z.url().nullable().default(null),
    /** Other places it lives, besides its repositories: its packages, a container image. */
    links: z.array(z.url()).default([]),
    /**
     * Topics, to filter the list by; proper names stay as they are, a few common words
     * are translated. Languages, tools, kinds and organizations have their own filters.
     */
    tags: z.array(z.string()).default([]),
    role: localized.nullable().default(null),
    /** One sentence, in lists. */
    blurb: localized,
    /** Follows the name on the home page ("dx, one ESLint config and…"); defaults to the blurb. */
    desc: localized.optional(),
    /** The side note shown in the margin on hover, on wide screens. */
    note: localized.nullable().default(null),
    /** The lead on the project's own page; defaults to the blurb. */
    long: localized.optional(),
    /** Waiting for review: shows while writing (pnpm dev) but is left out of the built site. */
    draft: z.boolean().default(false),
  }),
});

/**
 * A project's story, the case study on its page: one Markdown file per language, at
 * stories/<project>/<language>.md. Pages fall back to the English one.
 */
const stories = defineCollection({
  loader: glob({ pattern: "*/*.md", base: "./src/content/stories" }),
});

/**
 * Blog posts: one Markdown file per language, at posts/<post>/<language>.md. A post
 * missing in a language shows in English there.
 */
const posts = defineCollection({
  loader: glob({ pattern: "*/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** One sentence, in lists and under the title. */
    summary: z.string(),
    /** The side note on the home page, on wide screens. */
    note: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /** Drafts show while writing (pnpm dev) but are left out of the built site. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, stories, posts };
