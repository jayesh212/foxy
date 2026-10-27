import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Proposed replacement for the site's src/content.config.ts.
// Everything the current schema has is unchanged; the booklet gains optional fields
// for the workbook (rules, statements, evidence tables, questions, Mr. Foxy's hints,
// the deduction chain). Existing placeholder cases without a booklet still validate.
const person = z.object({
  id: z.string().optional(),
  name: z.string(),
  role: z.string(),
  description: z.string().optional(),
  motive: z.string().optional(),
  statement: z.string().optional(),
});

const table = z.object({ columns: z.array(z.string()), rows: z.array(z.array(z.string())) });

const cases = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cases" }),
  schema: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    tier: z.enum(["warm", "tricky", "hard", "cold"]),
    difficulty: z.number().int().min(1).max(5),
    teaser: z.string(),
    summary: z.string().optional(),
    minutes: z.number().int().positive().optional(),
    solveRate: z.string().optional(),
    lockedUntil: z.enum(["Sergeant", "Inspector", "Chief"]).optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    booklet: z
      .object({
        briefing: z.string(),
        rules: z.array(z.string()).default([]),
        setting: z.object({ place: z.string(), when: z.string() }).optional(),
        suspects: z.array(person),
        witnesses: z.array(person).default([]),
        evidence: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            body: z.string(),
            kind: z.string().optional(),
            source: z.string().optional(),
            lines: z.array(z.string()).optional(),
            table: table.optional(),
          }),
        ),
        timeline: z.array(z.object({ time: z.string(), event: z.string() })).default([]),
        puzzles: z
          .array(z.object({ id: z.string(), prompt: z.string(), answer: z.string(), hint: z.string().optional() }))
          .default([]),
        questions: z
          .array(
            z.object({
              id: z.string(),
              prompt: z.string(),
              kind: z.enum(["suspect", "choice", "time", "number", "text"]),
              options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
              answer: z.string(),
              accept: z.array(z.string()).optional(),
              explanation: z.string(),
              evidence: z.array(z.string()),
              hints: z.array(z.string()).length(3), // nudge, pointer, strong
            }),
          )
          .default([]),
        solution: z.object({
          culprit: z.string(),
          culpritId: z.string().optional(),
          explanation: z.string(),
          chain: z.array(z.object({ step: z.string(), evidence: z.array(z.string()) })).default([]),
          eliminations: z.array(z.object({ name: z.string(), why: z.string() })).default([]),
        }),
      })
      .optional(),
  }),
});

export const collections = { cases };
