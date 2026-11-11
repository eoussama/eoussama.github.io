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
    type: z.enum(["tool", "library", "app", "game", "site"]),
    /** Filled in from GitHub when left out. */
    language: z.string().nullable().default(null),
    /** Filled in from GitHub (the year the repository was created) when left out. */
    year: z.number().nullable().default(null),
    repo: z.url().nullable().default(null),
    live: z.url().nullable().default(null),
    stack: z.array(z.string()).default([]),
    role: localized.nullable().default(null),
    /** One sentence, in lists. */
    blurb: localized,
    /** Follows the name on the home page ("dx, one ESLint config and…"); defaults to the blurb. */
    desc: localized.optional(),
    /** The side note shown in the margin on hover, on wide screens. */
    note: localized.nullable().default(null),
    /** The lead on the project's own page; defaults to the blurb. */
    long: localized.optional(),
  }),
});

export const collections = { projects };
