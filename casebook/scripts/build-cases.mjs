#!/usr/bin/env node
// Turns the authored case files into what the website ships.
//
//   dist/cases/index.json        catalog for the case archive (no spoilers)
//   dist/cases/<slug>.json       the booklet a player downloads: facts, suspects,
//                                evidence, questions and hints. Answers are replaced
//                                by salted SHA-256 hashes so the page can check an
//                                answer without revealing it in the source.
//   dist/answers/<slug>.json     answer key, explanations and solution. Serve this
//                                only after the player submits their accusation.
//
// Usage: node scripts/build-cases.mjs   (run validate-cases.mjs first)

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "dist");

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") ? [p] : [];
  });

// Answers are compared lower-case with spaces squeezed, so "09:05" and " 09:05 " match.
export const normalize = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
export const hashAnswer = (caseId, questionId, answer) =>
  createHash("sha256").update(`${caseId}:${questionId}:${normalize(answer)}`).digest("hex");

mkdirSync(join(OUT, "cases"), { recursive: true });
mkdirSync(join(OUT, "answers"), { recursive: true });

const cases = walk(join(ROOT, "cases"))
  .map((f) => JSON.parse(readFileSync(f, "utf8")))
  .sort((a, b) => a.number - b.number);

const index = cases.map((c) => ({
  id: c.id,
  number: c.number,
  slug: c.slug,
  title: c.title,
  tier: c.tier,
  difficulty: c.difficulty,
  minutes: c.minutes,
  tagline: c.tagline,
  crime: c.crime,
  tags: c.tags || [],
  suspects: c.suspects.length,
}));
writeFileSync(join(OUT, "cases", "index.json"), JSON.stringify(index, null, 2));

for (const c of cases) {
  const { solution, playtest, $schema, ...booklet } = c;
  booklet.questions = c.questions.map(({ answer, accept, explanation, evidence, ...q }) => ({
    ...q,
    answerHashes: [answer, ...(accept || [])].map((a) => hashAnswer(c.id, q.id, a)),
  }));
  writeFileSync(join(OUT, "cases", `${c.slug}.json`), JSON.stringify(booklet, null, 2));
  writeFileSync(
    join(OUT, "answers", `${c.slug}.json`),
    JSON.stringify(
      {
        id: c.id,
        questions: c.questions.map(({ id, answer, accept, explanation, evidence }) => ({ id, answer, accept, explanation, evidence })),
        solution,
      },
      null,
      2,
    ),
  );
}
console.log(`built ${cases.length} cases into dist/`);
