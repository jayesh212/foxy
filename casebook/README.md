# Foxy case files

The case library for Foxy, the detective workbook site. Thirty cases (10 easy, 10 medium,
10 hard), each with facts, evidence, suspects, workbook questions, Mr. Foxy's three-level
hints and a full answer key.

```
cases/easy|medium|hard/NN-slug.json   the cases (source of truth)
schema/case.schema.json               JSON Schema for a case file
schema/astro-content.config.ts        proposed src/content.config.ts for the Astro site
scripts/validate-cases.mjs            fairness and consistency checks
scripts/build-cases.mjs               player bundles with hashed answers + answer keys
scripts/export-astro.mjs              export to the site's content collection format
tools/solvers/                        brute-force uniqueness checks for logic cases
site-export/src/content/cases/        the 30 cases already exported for the site
docs/AUTHORING.md                     how to write, playtest and add a case
```

```sh
node scripts/validate-cases.mjs
node scripts/export-astro.mjs ../src/content/cases   # from casebook/ inside the site repo
for f in tools/solvers/*.py; do python3 "$f"; done
```

No dependencies beyond Node 18+ and Python 3.
