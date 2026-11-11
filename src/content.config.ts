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
    kind: z.enum(["open-source", "private", "side-project", "contribution"]),
    type: z.enum(["tool", "library", "app", "game", "site"]),
    language: z.string().nullable().default(null),
    year: z.number().nullable().default(null),
    repo: z.url().nullable().default(null),
    live: z.url().nullable().default(null),
    stack: z.array(z.string()).default([]),
    role: localized.nullable().default(null),
    /** Follows the name on the home page: "dx, one ESLint config and…". */
    desc: localized,
    /** One sentence, in lists. */
    blurb: localized,
    /** The side note shown in the margin on hover, on wide screens. */
    note: localized.nullable().default(null),
    /** The lead on the project's own page. */
    long: localized,
  }),
});

export const collections = { projects };
