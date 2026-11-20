---
name: design-system
description: Overturn's visual system — product UI (app.overturn.run) and marketing site (overturn.run) have different references. Read before designing or styling anything in this repo.
---

# Overturn design system

Two surfaces, two references. Do not blend them.

## Product UI (apps/web) — reference: Raindrop's app (raindrop.ai)
Dark, dense, built for people who read traces all day.
- Background `#0B0C0F`, surface `#121419`, raised `#181B22`, line `#23272F`. Text `#E6E8EE`, secondary `#9AA1AE`, muted `#6B7280`.
- Left icon rail (56px) + optional 240px secondary nav. Content fills; no max-width on tables.
- Color is reserved for verdicts and severity: pass `#3DDC97`, fail `#FF5C5C`, flaky/warn `#FFB547`, info `#5B8DEF`. Nothing else is colored. Buttons are neutral; the primary action is a light fill (`#E6E8EE` on dark) — never a brand blue.
- Type: Inter/system at 13px for tables and 14px for prose; mono (JetBrains Mono / ui-monospace) for ids, model names, JSON, diffs. Tabular numbers everywhere.
- Rows 32px in tables, 36px in lists. Hover raises to `surface`. Selected row gets a 2px left rule in the verdict color.
- Diffs: side-by-side at ≥1280px, stacked below. Removed in fail-tint, added in pass-tint, at 12% alpha.
- Light theme exists (`?theme=light`, `ov-theme`) and must stay readable, but dark is the design.
- Motion: 120ms. No skeleton shimmer; a quiet progress bar at the top.

## Marketing site (apps/docs → overturn.run) — reference: appliedcompute.com (was past.dev, changed 19 Nov 2026)
Light, editorial, calm. The opposite of the app on purpose. Reads like a journal, not a SaaS template.
- Warm paper `#fffaf7`, ink `#101010`, muted `#737373`, hairline `#ededed`, one hot orange `#f04a00` (pressed `#c13701`). These are measured off the reference, not eyeballed from a screenshot — measure before you guess.
- The orange is spent on three things and nothing else: section eyebrows, the primary CTA, and diagram linework.
- Display type is a transitional editorial serif (Newsreader, standing in for Tiempos Headline); body and UI are Inter; mono (Geist Mono) carries eyebrows, labels, ids and legal lines. Mono labels are uppercase and run **tight**, `-.02em`, never tracked out — wide mono caps read as a SaaS kicker, tight ones read as a plate caption.
- Every section opens with a mono orange eyebrow above the serif headline. One continuous pair of vertical hairlines runs down the page at the 1280px column edge, and sections are separated by hairlines, never by a change of background.
- Hero: headline ≤ 9 words ("Every time a human fixes your agent, Overturn keeps it."), 3D illustration with hover micro-interactions, real product screens in the white version of the app.
- Sections in order: hero → numbered quickstart (1-2-3, copyable commands) → with/without comparison → how it works (capture → correction record → regression test → owned model) → claims-teams-first → FAQ → footer.
- Type: hero headline `clamp(42px,6.2vw,92px)` serif at 400, line-height 1, tracking `-.04em`; section headlines `clamp(30px,3.4vw,48px)` at `-.035em`; body 17px/1.55, 660px measure. The serif is set at 400 and tracked in hard; it is never bolded.
- Logo: the "Pinwheel" mark (four rotating half-disc blades) + lowercase "overturn" wordmark, wordmark lighter and smaller than the mark. Never a SemiBold wordmark.
- Vertical grid lines are now the skeleton, not a thing to avoid. Still no gradients, no stock illustration, and no logos, customer names or quotes we have not earned — `docs/wiki/facts.md` governs every claim on the page. A dark section is allowed once, at most, and only to close the page.
- Hero is centred: eyebrow, headline, one subhead of at most two lines, then the CTA row. Long explanation goes below the fold, never in the hero.
- Micro-interactions, in full. Two, and only two:
  1. **Hero pixel field.** A canvas behind the hero draws a grid of 5px squares on a 16px pitch at `rgba(16,16,16,.045)`. Squares within ~138px of the pointer light accent orange, cubed falloff times a fixed per-cell random multiplier so the lit area reads as scattered sparks and not a disc, decaying at ~2/sec so the cursor leaves a dissolving trail. Canvas, not DOM — ~4k cells a frame. The loop starts on pointer move, stops when nothing is warm, and bails when the node leaves the page (the Framer mount clears its root). Under `prefers-reduced-motion` the field renders static and never reacts.
  2. **Pointable cells.** Any cell in a ruled grid (`.tick`) carries a 7px corner bracket in the hairline colour; on hover the bracket turns accent and nudges 1px up-right, and the cell takes a `rgba(240,74,0,.035)` wash. 160ms.
  Nothing else moves on hover. No parallax on text, no scroll-triggered reveals, no cursor-follow on the headline.

## Both
Sentence case. No emoji. Empty states say what to do next. Status words are exact: pass / fail / flaky / pending — never "success"/"error".
