import ts from "typescript";

import source from "~/scripts/reveal.ts?raw";



/**
 * The first-load entrance (scripts/reveal.ts) as a script the page carries in its head
 * (Base.astro): plain JavaScript, without its comments, indents or blank lines (it has
 * no text running over lines for that to change), in a scope of its own. A script of
 * the page's own runs as soon as it is read; one fetched as a module would wait for all
 * of the page. It reads the same on every page.
 */
export const REVEAL = `(() => {\n${ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true },
}).outputText.replace(/^export \{\};\s*$/m, "").replace(/^\s+/gm, "").trim()}\n})();`;
