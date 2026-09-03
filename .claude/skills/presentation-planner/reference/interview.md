# Interview - question bank & arc templates

One question per message. Prefer `AskUserQuestion` with concrete options; fall
back to open text for 1, 2, 6.

## Questions

| # | Ask | Option seeds (offer these, plus "other") |
|---|---|---|
| 1 | What's the talk about? | open text |
| 2 | What should the audience think or do differently afterwards? | inform / understand · learn a repeatable skill · be persuaded of a position · make or approve a decision |
| 3 | Who's the audience - role, size, familiarity with the topic? | open text; nudge for all three |
| 4 | How long is the slot? | 5 · 10 · 20 · 30 · 45 · 60 min |
| 5 | Tone? | formal & polished · conversational · hands-on workshop · punchy & irreverent |
| 6 | The 2-4 things they must still remember next week? | open text |
| 7 | Structure - here's a proposed arc, adjust it | see templates below |
| 8 | For each section: does it need a visual, and what kind? | diagram · chart · live demo · comparison · map · animation · none |
| 9 | A brand theme? | list existing `[data-theme]` names · none |

## Duration -> rough slide count

Assume ~1.5 min per slide, then trim ~15% for intro/Q&A.

| Duration | Target slides |
|---|---|
| 5 min | 3-4 |
| 10 min | 6-8 |
| 20 min | 12-16 |
| 30 min | 18-24 |
| 45 min | 26-34 |
| 60 min | 36-45 |

Use this to size the arc - add or split sections until the count is in range.
Put the number in the plan's `slides:` key.

## Arc templates

Offer the one that fits the goal from Q2. Fill section names with the user's
topic before showing it; invite edits.

### Problem -> Solution -> Proof -> Action  (persuade / decide)
```
Hook - the problem in their world
Why it matters now
The idea / the shift
How it works (2-3 sections)
Proof - evidence, example, demo
Objections / what it isn't
What to do Monday
```

### Concept -> Practice  (teach a skill)
```
The mental model
Term by term (glossary sections)
Worked example
Your turn - a guided exercise
Common mistakes
Recap + where to go next
```

### N Things  (inform)
```
Framing - why this list
Thing 1 ... Thing N   (one section each, parallel shape)
How they fit together
Takeaways
```

### Journey / Chronological  (story, case study)
```
Where we started
Turning points (2-4 sections)
Where we landed
What we'd do differently
Lessons
```

`deck-builder` adds `00-title`, `01-overview`, and a closing `key-takeaways`
slide automatically - don't put those in the arc.
