#!/usr/bin/env node
// Checks every case file in cases/ for the rules a fair Foxy case must follow.
// Usage: node scripts/validate-cases.mjs [file ...]
// Exits 1 if any case has an error. No dependencies.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TIERS = { easy: [1, 2], medium: [2, 3], hard: [4, 5] };
const MIN_SUSPECTS = { easy: 3, medium: 4, hard: 5 };
const KINDS = ["statement", "document", "object", "photo", "log", "map", "report", "letter", "transcript", "timetable", "note"];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") && !name.startsWith("index") ? [p] : [];
  });
}

function check(file) {
  const errors = [];
  const warn = [];
  const err = (m) => errors.push(m);
  let c;
  try {
    c = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    return { errors: [`not valid JSON: ${e.message}`], warn };
  }

  for (const k of ["id", "number", "slug", "title", "tier", "difficulty", "minutes", "tagline", "setting", "briefing", "suspects", "evidence", "questions", "hints", "solution", "playtest"]) {
    if (c[k] === undefined) err(`missing "${k}"`);
  }
  if (errors.length) return { errors, warn };

  const base = file.split("/").pop();
  const nn = String(c.number).padStart(2, "0");
  if (c.id !== `case-${nn}`) err(`id should be case-${nn}`);
  if (base !== `${nn}-${c.slug}.json`) err(`file name should be ${nn}-${c.slug}.json`);
  if (!file.includes(`/cases/${c.tier}/`)) err(`file should live in cases/${c.tier}/`);
  if (!TIERS[c.tier]) err(`unknown tier ${c.tier}`);
  else {
    const [lo, hi] = TIERS[c.tier];
    if (c.difficulty < lo || c.difficulty > hi) err(`difficulty ${c.difficulty} outside ${lo}-${hi} for ${c.tier}`);
    if (c.suspects.length < MIN_SUSPECTS[c.tier]) err(`${c.tier} cases need at least ${MIN_SUSPECTS[c.tier]} suspects`);
  }

  const suspects = new Set();
  for (const s of c.suspects) {
    if (suspects.has(s.id)) err(`duplicate suspect ${s.id}`);
    suspects.add(s.id);
    for (const k of ["name", "role", "description", "statement"]) if (!s[k]) err(`suspect ${s.id} missing ${k}`);
  }

  const evidence = new Set();
  for (const e of c.evidence) {
    if (evidence.has(e.id)) err(`duplicate evidence ${e.id}`);
    evidence.add(e.id);
    if (!KINDS.includes(e.kind)) err(`evidence ${e.id} has unknown kind ${e.kind}`);
    if (!Array.isArray(e.body) || !e.body.length) err(`evidence ${e.id} has empty body`);
    if (e.table) for (const r of e.table.rows) if (r.length !== e.table.columns.length) err(`evidence ${e.id} table row has ${r.length} cells, expected ${e.table.columns.length}`);
  }
  const refs = (list, where) => (list || []).forEach((id) => evidence.has(id) || err(`${where} cites unknown evidence ${id}`));

  const questions = new Set();
  for (const q of c.questions) {
    if (questions.has(q.id)) err(`duplicate question ${q.id}`);
    questions.add(q.id);
    if (!q.evidence?.length) err(`${q.id} cites no evidence`);
    refs(q.evidence, q.id);
    if (q.kind === "choice") {
      const ids = (q.options || []).map((o) => o.id);
      if (ids.length < 2) err(`${q.id} needs at least 2 options`);
      if (!ids.includes(q.answer)) err(`${q.id} answer ${q.answer} is not an option`);
      if (new Set(ids).size !== ids.length) err(`${q.id} has duplicate option ids`);
    }
    if (q.kind === "suspect" && !suspects.has(q.answer)) err(`${q.id} answer ${q.answer} is not a suspect`);
    if (q.kind === "time" && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(q.answer)) err(`${q.id} time answer must be HH:MM (24h)`);
    if (q.kind === "number" && !/^-?[0-9]+(\.[0-9]+)?$/.test(q.answer)) err(`${q.id} number answer must be numeric`);
    if (q.kind === "text" && !(q.accept || []).length) warn.push(`${q.id} is free text with no accept[] list; grading will be strict`);
  }
  const last = c.questions[c.questions.length - 1];
  if (last.kind !== "suspect" || last.answer !== c.solution.culprit) err(`last question must be the accusation (kind "suspect", answer = solution.culprit)`);

  for (const q of c.questions) {
    for (const lvl of [1, 2, 3]) {
      const n = c.hints.filter((h) => h.question === q.id && h.level === lvl).length;
      if (n !== 1) err(`${q.id} needs exactly one level-${lvl} hint (has ${n})`);
    }
  }
  for (const h of c.hints) if (!questions.has(h.question)) err(`hint points at unknown question ${h.question}`);

  if (!suspects.has(c.solution.culprit)) err(`culprit ${c.solution.culprit} is not a suspect`);
  for (const s of c.solution.chain) refs(s.evidence, "solution chain");
  const cleared = new Set((c.solution.eliminations || []).map((e) => e.suspect));
  for (const s of suspects) if (s !== c.solution.culprit && !cleared.has(s)) err(`no elimination given for innocent suspect ${s}`);

  // Spoiler guard: the tagline and briefing must not name the culprit as guilty.
  const culpritName = c.suspects.find((s) => s.id === c.solution.culprit)?.name;
  if (culpritName && c.tagline.includes(culpritName)) warn.push(`tagline names the culprit`);

  if (!c.playtest.revisions?.length) err(`playtest.revisions is empty; record what changed after playtesting`);
  return { errors, warn, c };
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : walk(join(ROOT, "cases"));
let bad = 0;
const numbers = new Map();
const slugs = new Map();
for (const f of files.sort()) {
  const { errors, warn, c } = check(f);
  const rel = relative(ROOT, f);
  if (c) {
    if (numbers.has(c.number)) errors.push(`number ${c.number} also used by ${numbers.get(c.number)}`);
    if (slugs.has(c.slug)) errors.push(`slug ${c.slug} also used by ${slugs.get(c.slug)}`);
    numbers.set(c.number, rel);
    slugs.set(c.slug, rel);
  }
  for (const w of warn) console.log(`  warn  ${rel}: ${w}`);
  if (errors.length) {
    bad++;
    for (const e of errors) console.log(`  ERROR ${rel}: ${e}`);
  } else {
    console.log(`  ok    ${rel}`);
  }
}
console.log(`\n${files.length - bad}/${files.length} cases valid`);
process.exit(bad ? 1 : 0);
