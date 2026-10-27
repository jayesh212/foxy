# Writing a Foxy case

Every case is one JSON file in `cases/<tier>/NN-slug.json`, checked against
`schema/case.schema.json`. That file is the single source of truth. The website,
printable booklets and the answer checker are all generated from it.

## Workflow

1. **Pitch the trick first.** Write one sentence: "The solver realises ___ because ___."
   If you can't, the case isn't ready. Pick a mechanic that hasn't been used recently
   (see the mechanics table below).
2. **Copy a case of the same tier** as a template and give it the next free number.
   Never reuse a retired number or slug.
3. **Write the evidence before the story.** List the facts that prove the answer, then
   the facts that eliminate each innocent suspect, then the red herrings. Every innocent
   suspect needs an elimination backed by evidence, not by character.
4. **Write the questions** as a staircase: each one is a step of the deduction chain, and
   the last one is always the accusation (`kind: "suspect"`).
5. **Write Mr. Foxy's hints**: three per question.
   - Level 1, *nudge*: where to look ("Start with the weather.")
   - Level 2, *pointer*: what to compare ("Compare the 3:02 camera note with the 4:00 notebook.")
   - Level 3, *strong*: the deduction, one step short of the answer.
6. **Validate**: `node scripts/validate-cases.mjs`. It checks ids, references, that every
   question has hints at all three levels, that every innocent has an elimination, and
   that the last question names the culprit.
7. **Prove uniqueness** for logic-heavy cases (liars, seating, routes): add a brute-force
   script to `tools/solvers/` and point `playtest.verifier` at it. It must show exactly one
   possible culprit.
8. **Playtest cold.** Give the player view (no `solution`, no answers) to someone who
   hasn't seen the case. Watch where they get stuck and what they wrongly assume. Then:
   - an assumption the case relies on but doesn't state goes into `rules`;
   - a second possible culprit gets a new elimination clue;
   - an accidental shortcut that skips the deduction gets removed.
   Record what you changed in `playtest.revisions`. The validator refuses an empty list.
9. **Export to the site**: `node scripts/export-astro.mjs <site>/src/content/cases`, then
   run the Astro build.

## Fairness rules

- **Everything needed is in the booklet.** If the solution depends on a fact about the
  world (glass flies away from a blow, a mirror swaps left and right, BST is UTC+1), an
  exhibit must say it.
- **One answer.** Ask "who else could it be?" for every suspect. If the answer is "it
  depends", add a clue or a rule.
- **No mind-reading.** Motives are colour. Nobody is convicted by motive alone.
- **No shortcuts.** If one exhibit names the culprit outright, the rest of the case is
  pointless. Hide each fact in a different place so they have to be combined.
- **Positive proof at the end.** The final step should be a physical link (the lunchbox,
  the sequin, the tweezers), so the reveal feels earned, not just "everyone else had an alibi".
- **Tier targets**: easy 3+ suspects, one key contradiction, ~10–15 min. Medium 4+ suspects,
  two combined deductions, ~20–25 min. Hard 5+ suspects, three or more chained steps,
  ~35–50 min.

## What ships to players

`node scripts/build-cases.mjs` writes `dist/cases/index.json` (the archive),
`dist/cases/<slug>.json` (the booklet with answers replaced by salted hashes) and
`dist/answers/<slug>.json` (the answer key, to reveal after the accusation). The hashes
stop casual peeking in the browser, not a determined cheat, so check ranked answers on
the server.

## Mechanics used so far

| # | Case | Main mechanic |
|---|---|---|
| 01 | The Wet Umbrella | weather vs. statement |
| 02 | Wet Paint | footwear, where the paint is |
| 03 | Closed on Sunday | calendar, opening hours |
| 04 | The Quiet Dog | what didn't happen |
| 05 | The Smudged Note | handwriting (left-handed) |
| 06 | The Dark Beach | almanac, an impossible sighting |
| 07 | Slip of the Tongue | guilty knowledge |
| 08 | The Giant Pumpkin | two physical filters (size, soil) |
| 09 | Tracks in the Snow | snowfall timing, closed circle |
| 10 | The Spelling Mistake | writing habits grid |
| 11 | The Mirror Selfie | mirrored clock |
| 12 | The Ghost Orchid | cross-referencing five logs |
| 13 | The Gullrock Lamp | one liar, contradictions |
| 14 | The Cookbook Code | book cipher, pen indentations |
| 15 | The Blackout Dinner | seating logic grid |
| 16 | The Long Stride | step length to height |
| 17 | The 8:05 to Bramley | timetable footnotes |
| 18 | The Blinking Clock | reset clock arithmetic |
| 19 | The Mayor's Cat | map distances and speeds |
| 20 | The Causeway | tide window |
| 21 | The Wrong Hour | UTC vs. summer time |
| 22 | The Liars' Weekend | truth-tellers and liars |
| 23 | The Locked Study | locked room that was opened |
| 24 | The Lemon Slice | toxicology window, counting |
| 25 | The Magpie Cipher | Vigenère + door-log grid |
| 26 | Harbour at Dusk | dating a forgery, provenance |
| 27 | The Highland Owl | train access and exits |
| 28 | Inside Job | staged scene |
| 29 | The Last Broadcast | church bells in a recording |
| 30 | The Golden Magnifier | finale: cipher + log + liar |
