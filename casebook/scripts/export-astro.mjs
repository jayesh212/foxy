#!/usr/bin/env node
// Exports the authored cases into the Foxy website's Astro content format.
//
//   node scripts/export-astro.mjs [outDir]
//
// Writes <outDir>/NN-slug.json (default: site-export/src/content/cases), one file per
// case, matching the `cases` collection in the site's src/content.config.ts. Fields the
// current site schema already has are filled in the same shape it expects (briefing and
// evidence bodies as strings, puzzles with a one-line hint), so the existing pages keep
// working. The richer workbook data rides along in new optional fields: rules, suspect
// statements, evidence tables, questions with options and explanations, the three-level
// Mr. Foxy hints, and the full deduction chain. See schema/astro-content.config.ts.

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = process.argv[2] || join(ROOT, "site-export", "src", "content", "cases");
const TIER = { easy: "warm", medium: "tricky", hard: "hard" };

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") ? [p] : [];
  });

const tableText = (t) => (t ? "\n\n" + [t.columns.join(" | "), ...t.rows.map((r) => r.join(" | "))].join("\n") : "");

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const file of walk(join(ROOT, "cases"))) {
  const c = JSON.parse(readFileSync(file, "utf8"));
  const name = (id) => c.suspects.find((s) => s.id === id)?.name ?? id;
  const answerText = (q) =>
    q.kind === "suspect" ? name(q.answer) : q.kind === "choice" ? q.options.find((o) => o.id === q.answer).text : q.answer;
  const hint = (q, level) => c.hints.find((h) => h.question === q.id && h.level === level)?.text;

  const site = {
    number: c.number,
    title: c.title,
    tier: TIER[c.tier],
    difficulty: c.difficulty,
    teaser: c.tagline,
    minutes: c.minutes,
    draft: false,
    booklet: {
      briefing: c.briefing.join("\n\n"),
      rules: c.rules || [],
      setting: c.setting,
      suspects: c.suspects.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        description: s.description,
        motive: s.motive,
        statement: s.statement,
      })),
      witnesses: [],
      evidence: c.evidence.map((e) => ({
        id: e.id.replace(/^ev/, ""),
        title: e.title,
        kind: e.kind,
        source: e.source,
        body: e.body.join("\n\n") + tableText(e.table),
        lines: e.body,
        table: e.table,
      })),
      timeline: [],
      // Back-compatible summary of each question for the current page template.
      puzzles: c.questions.map((q) => ({ id: q.id, prompt: q.prompt, answer: answerText(q), hint: hint(q, 1) })),
      questions: c.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        kind: q.kind,
        options: q.kind === "suspect" ? c.suspects.map((s) => ({ id: s.id, text: s.name })) : q.options,
        answer: q.answer,
        accept: q.accept,
        explanation: q.explanation,
        evidence: q.evidence.map((id) => id.replace(/^ev/, "")),
        hints: [1, 2, 3].map((level) => hint(q, level)),
      })),
      solution: {
        culprit: name(c.solution.culprit),
        culpritId: c.solution.culprit,
        explanation: c.solution.summary,
        chain: c.solution.chain.map((s) => ({ step: s.step, evidence: s.evidence.map((id) => id.replace(/^ev/, "")) })),
        eliminations: (c.solution.eliminations || []).map((e) => ({ name: name(e.suspect), why: e.why })),
      },
    },
  };
  writeFileSync(join(OUT, `${String(c.number).padStart(2, "0")}-${c.slug}.json`), JSON.stringify(site, null, 2) + "\n");
  n++;
}
console.log(`exported ${n} cases to ${OUT}`);
