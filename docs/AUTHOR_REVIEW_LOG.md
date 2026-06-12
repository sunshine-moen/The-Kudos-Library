# Author Quote Review Log

Tracks the verification status of every quote in the author quote pool. Source of truth: `docs/content/05_author_quotes_starter.md`.

Before adding a quote to production or seeding it with confidence ✓, Rebekah reviews and confirms with a date and notes below.

---

## ✓ Seeded (14 quotes — confidence high, in `scripts/seed/seed-ag-tenant.ts` as of 2026-06-12)

| Author | Quote (excerpt) | Source cited in doc | Seeded |
|---|---|---|---|
| Margaret Atwood | "In the spring, at the end of the day, you should smell like dirt." | _Bluebeard's Egg_ | ✓ 2026-06-12 |
| L.M. Montgomery | "It's so easy to be wicked without knowing it, isn't it?" | _Anne of Green Gables_ | ✓ 2026-06-12 |
| L.M. Montgomery | "I'm so glad I live in a world where there are Octobers." | _Anne of Green Gables_ | ✓ 2026-06-12 |
| Richard Wagamese | "All we are is story…" | _One Native Life_ | ✓ 2026-06-12 |
| Mary Oliver | "Tell me, what is it you plan to do / with your one wild and precious life?" | _The Summer Day_ | ✓ 2026-06-12 |
| Mary Oliver | "Instructions for living a life: / Pay attention. / Be astonished. / Tell about it." | _Sometimes_ | ✓ 2026-06-12 |
| Maya Angelou | "I've learned that people will forget what you said…but people will never forget how you made them feel." | Widely attributed | ✓ 2026-06-12 |
| Toni Morrison | "If you have some power, then your job is to empower somebody else." | _O Magazine_ interview | ✓ 2026-06-12 |
| Octavia Butler | "Every story I create, creates me." | _Bloodchild and Other Stories_ | ✓ 2026-06-12 |
| Kurt Vonnegut | "We are what we pretend to be, so we must be careful about what we pretend to be." | _Mother Night_ | ✓ 2026-06-12 |
| Annie Dillard | "How we spend our days is, of course, how we spend our lives." | _The Writing Life_ | ✓ 2026-06-12 |
| Ursula K. Le Guin | "The creative adult is the child who survived." | Widely attributed | ✓ 2026-06-12 |
| Wendell Berry | "It may be that when we no longer know what to do, / we have come to our real work…" | _The Real Work_ | ✓ 2026-06-12 |
| James Baldwin | "Not everything that is faced can be changed, but nothing can be changed until it is faced." | _I Am Not Your Negro_ | ✓ 2026-06-12 |

---

## ~ Pending review (12 quotes — medium/low confidence, NOT seeded)

These require Rebekah to verify the exact text and source before seeding. See REB-82.

| Author | Quote (excerpt) | Confidence | Notes |
|---|---|---|---|
| Eden Robinson | "The land remembers everything…" | ~ | Attributed but source not pinned. Verify exact text. |
| Carol Shields | "We are all implicated in each other's lives…" | ~ | Verify source. |
| Lawrence Hill | "Memory is a form of hope." | ~ | Verify source + exact wording. |
| Michael Ondaatje | "We are the sum of our losses." | ~ | Often cited; verify original source. |
| Maria Campbell | "When you know who you are, no one can take that from you." | ~ | Verify source. |
| Rupi Kaur | "What is stronger than the human heart / which shatters over and over / and still lives." | ~ | From _Milk and Honey_ or _The Sun and Her Flowers_ — verify. |
| Alice Munro | "We want to be forgiven for everything." | ⚠ | Attribution unclear. Do not use without pinning source. |
| Timothy Findley | "The past is never where you think you left it." | ⚠ | Verify attribution — may be misquote. |
| Robertson Davies | "The eye sees only what the mind is prepared to comprehend." | ⚠ | Verify exact source. |
| Alistair MacLeod | "We are all better when we're loved." | ⚠ | Verify. |
| Yann Martel | "Life is so beautiful that death has fallen in love with it…" | ⚠ | Verify from _Life of Pi_. |
| Patrick Lane | "We are the ones who make the world." | ⚠ | Verify — source unclear. |

---

## How to promote a quote from pending → seeded

1. Verify the exact quote text against the original source.
2. Add the author and quote to `AUTHOR_QUOTES` in `scripts/seed/seed-ag-tenant.ts`.
3. Update this log: move the row to the Seeded table with date and verified source.
4. Re-run the seed script against the AG tenant database.
5. Note the update in Linear under REB-82.

---

## How to retire a seeded quote

If a quote is found to be misattributed or the source is contested:

1. Remove it from `AUTHOR_QUOTES` in `scripts/seed/seed-ag-tenant.ts`.
2. Delete the row from `author_quote` in the database (`DELETE FROM author_quote WHERE author_name = '...' AND quote_text = '...'`).
3. Move the row to a "Retired" section in this log with a note.
4. Note the change in Linear under REB-82.
