# The Kudos Library — Design System v1.2

**Status:** Locked for v1 build. Token file: `11_design_tokens.css` (same folder).
**v1.1 (June 4, 2026):** wood palette sampled from the layout-anchor photo; type scale split into marketing/product contexts with full header hierarchy; button system locked (gold primary with daylight hover, gilded-outline secondary, bookplate tertiary).
**v1.2 (June 4, 2026):** texture & rendering rules (§2.7); app header locked to full UBC Navy (§5.3); callout colour rotation — full palette, brown limited (§5.4).
**Sources of truth:** UBC Visual Identity Colour Palette (Aug 2025), UBC DAE FORWARD Campaign Brand Guidelines, `Rebekah_Brand_Application_Guide.md`, `03_design_intent.md`, `10_design_deliverables.md`.
**Decisions made June 2026 interview:** two-layer colour system · Open Sans for functional UI only · ~12-colour book palette · crest in footer + login · old-style Garamond display · worn typewriter card font · hex authoritative with nearest PMS noted.

---

## 1. Brand architecture

Four brands are in play. The Kudos Library sits at level 4:

1. **UBC** — parent. Supplies the crest, UBC Blue, the secondary blues, UBC Gold (PMS 8383), and Open Sans (sanctioned web font).
2. **FORWARD, the campaign for UBC** — supplies the gold colour family only (`#E69400`, `#C86700`). **The FORWARD logo, chevron devices, and gradient treatments do NOT appear in this product.** Rebekah's own brand guide prohibits applying FORWARD campaign treatment to non-campaign pieces; we inherit the colours, not the identity.
3. **AG sub-brands (Giving Day etc.)** — not used here. The Giving Day palette (cyan/magenta/yellow) is explicitly out.
4. **The Kudos Library** — this product. A distinct sub-brand with its own warm library identity, anchored to UBC through colour, the crest, and Open Sans.

**The governing colour rule:** when a colour is needed, default to the closest existing UBC or FORWARD colour; only mint a new colour when nothing in the parent palettes is plausibly close. Section 2 records which colours are inherited and which are new, so the lineage is auditable.

### The two-layer system

| Layer | Where | Palette |
|---|---|---|
| **Institutional layer** | UI chrome: nav, links, buttons, form controls, admin screens, footers, email chrome sent to managers | UBC Blue + FORWARD golds + neutrals. Locked — no new colours here. |
| **Library layer** | The scene: books, spines, shelves, walls, window light, characters, the library card | Extended warm palette (§2.3–2.4). New colours allowed, defined below. |

This split is the integration story: anything functional looks like UBC; anything atmospheric looks like the library. It also makes the product replicable — **future hook:** swapping the institutional layer's token block re-skins the product for a non-UBC org with zero changes to the library layer. Don't build for this now; the token file's structure already provides it.

---

## 2. Colour

Hex is the authoritative spec (this is a web app). Nearest PMS is noted for print vocabulary; matches marked ≈ are approximations — verify against a Pantone bridge before any actual print run. PMS values without ≈ come directly from UBC's published guides.

### 2.1 Institutional layer (locked — inherited, no additions)

| Token | Name | Hex | PMS | Use |
|---|---|---|---|---|
| `--inst-navy` | UBC Blue | `#002145` | 282 | Nav text, headings that need institutional weight, footer band, admin headers, table headers |
| `--inst-link` | Royal Blue | `#0055B7` | 2935 | Links, focus rings. (UBC secondary blue — the only one of the six we use; the lighter cyans read "SaaS" and are banned from this product.) |
| `--inst-gold` | FORWARD Gold | `#E69400` | ≈144 | Primary CTA fill (with ink text), accents, "Give a kudos" button |
| `--inst-gold-deep` | Burnished Gold | `#C86700` | ≈717 | CTA hover/pressed state |
| `--inst-gold-heritage` | UBC Gold | `#A89565` | 8383 | Brass details, ornaments, gilding lines — decorative only, never text |
| `--inst-white` | White | `#FFFFFF` | — | Reverse text on navy/oxblood/green |

**Rules carried over from UBC/her brand guide:** gold is never body text (verified: FORWARD Gold on cream = 2.1:1, fails). CTA buttons are gold fill + ink `#343433` text (5.1:1, passes AA). Never tint-shift or substitute these values.

### 2.2 Library layer — surfaces & scene

| Token | Name | Hex | PMS | Lineage | Use |
|---|---|---|---|---|---|
| `--lib-cream` | Reading Room Cream | `#F5EEDD` | ≈9180 | new | Default page/panel background. The "not pure white" rule. |
| `--lib-parchment` | Parchment | `#EAE0C8` | ≈7501 | new | Library card stock, aged-paper surfaces, modals |
| `--lib-ink` | Ink | `#343433` | ≈447 | **inherited** (UBC DAE template body colour) | Body text. Warm near-black, never `#000`. |
| `--lib-daylight` | Daylight Gold | `#F3C96B` | ≈141 | new | Window light, highlights, primary-button hover |

#### The wood ramp (old-world shelving)

Sampled directly from the v1 layout-anchor photo (`Inspiration/l66220250115093010.webp`) — the actual dominant tones of the inspiration cabinetry, darkest to lightest. They are illustration fills, not brand colours, so PMS matching is deferred until a print need exists.

| Token | Name | Hex | Use |
|---|---|---|---|
| `--wood-espresso` | Espresso | `#2B231D` | Shelf interiors, cabinet depths, deepest shadow (the photo's dominant tone) |
| `--wood-walnut-deep` | Deep Walnut | `#4B352A` | Cabinet frames, shelf uprights, mullions |
| `--wood-walnut` | Walnut | `#5E4836` | The primary shelf/cabinet wood |
| `--wood-smoked` | Smoked Oak | `#695B4C` | Greyed background panelling, recessed planes |
| `--wood-cabinet` | Lit Cabinet | `#926E54` | Cabinet faces catching ambient light |
| `--wood-burl` | Burl | `#955735` | The desk's reddish burl, warm accents |
| `--wood-caramel` | Sunlit Caramel | `#D3B08E` | Desktop and frame planes in direct window light |

Gilt edges, hardware, and glints use Heritage Gold `#A89565` (PMS 8383) — the photo's brightest aged-oak highlight samples within a few points of UBC Gold, so per the governing rule it snaps to the UBC colour. Walnut-toned UI accents (card borders, signage, ruled lines) now use `--wood-walnut-deep`; the earlier `--lib-wood`/`--lib-wood-deep` tokens are replaced by this ramp. The Leather Brown spine (#11) keeps its own value `#693F23`.

### 2.3 Book spine palette (12)

The procedural variety engine for shelves. 6 of 12 are inherited — the shelves quietly carry UBC's colours without a logo in sight.

| # | Token | Name | Hex | PMS | Lineage |
|---|---|---|---|---|---|
| 1 | `--spine-navy` | UBC Navy | `#002145` | 282 | **UBC primary** |
| 2 | `--spine-royal` | Royal Blue | `#0055B7` | 2935 | **UBC secondary** |
| 3 | `--spine-heritage` | Heritage Gold | `#A89565` | 8383 | **UBC gold** |
| 4 | `--spine-gold` | Forward Gold | `#E69400` | ≈144 | **FORWARD** |
| 5 | `--spine-burnished` | Burnished Gold | `#C86700` | ≈717 | **FORWARD** |
| 6 | `--spine-ink` | Ink Cloth | `#343433` | ≈447 | **UBC DAE template** |
| 7 | `--spine-oxblood` | Oxblood | `#76232F` | ≈188 | new |
| 8 | `--spine-green` | Library Green | `#154734` | ≈3435 | new |
| 9 | `--spine-moss` | Moss | `#6E7F5C` | ≈5763 | new |
| 10 | `--spine-brick` | Brick | `#9C4A2F` | ≈7587 | new |
| 11 | `--spine-leather` | Leather Brown | `#693F23` | ≈469 | new |
| 12 | `--spine-vellum` | Vellum | `#EAE0C8` | ≈7501 | new |

Spine text/ornament rule: white or vellum foil on dark spines (1, 2, 6–11); ink or oxblood on light spines (3, 4, 5, 12). All verified ≥ AA at ornament sizes.

### 2.4 Functional colours (mapped, not minted)

No new colours for states — reuse the palette: success = Library Green `#154734` · error = Oxblood `#76232F` · warning = Burnished Gold `#C86700` · info = Royal Blue `#0055B7`. All pass AA as white-text fills or as dark text on cream.

### 2.5 Verified contrast pairs (WCAG, computed)

| Pair | Ratio | Grade |
|---|---|---|
| Ink on Cream (body text) | 10.8 | AAA |
| UBC Navy on Cream (headings) | 13.9 | AAA |
| Royal Blue on Cream (links) | 6.1 | AA |
| Ink on FORWARD Gold (CTA) | 5.1 | AA |
| White on Navy / Oxblood / Green | 16.1 / 10.2 / 10.6 | AAA |
| Cream on Walnut (signage) | 7.8 | AAA |
| Ink on Daylight Gold | 7.9 | AAA |
| FORWARD Gold *text* on Cream | 2.1 | **FAIL — never** |
| Heritage Gold *text* on Cream | 2.5 | **FAIL — never** |
| Navy on Moss | 3.7 | AA-large only (≥24px) |

**Avoid list (restated):** pure white backgrounds, pure black text, the UBC light cyans (PMS 2995/298/297/2975), Giving Day palette, neon, flat slate grays.

### 2.6 Illustration colour rule

All scene and character art (shelves, desk scene, windows, the cat, the librarian, badges, icon presets, email header illustrations) draws exclusively from this system's palette — spine colours, wood ramp, daylight, and surfaces. No off-palette colours in illustration work. Asset specs themselves (sizes, poses, priorities) live in `10_design_deliverables.md`, not here — this document owns the colours; that one owns the assets. If an illustration genuinely cannot work within the palette (e.g., the homepage rug), mint the colour at that moment and add it here — never preemptively.

### 2.7 Texture & rendering

The scene should feel illustrated and material, not clip-art flat. This section owns the *rules*; the textured assets themselves are deliverables (`10_design_deliverables.md`).

**The materials vocabulary** — four textures exist, mapped to what they're rendering:

| Material | Where | Rendering cue |
|---|---|---|
| **Wood grain** | Shelves, frames, desk, signage | Fine striations running along the grain direction; at most two value steps within one surface |
| **Leather** | Book spines (leather preset), chair | Soft centre-light vignette + fine pore grain |
| **Cloth** | Book spines (cloth preset) | Subtle diagonal weave crosshatch |
| **Vellum / paper** | Book spines (vellum preset), card stock, pages | Faint horizontal striation, slight edge unevenness |

These map directly to the spine presets' `texture type` (leather/cloth/vellum) already specced in deliverable 3A.

**Intensity rule — textures are felt, not seen.** Texture overlays stay at or under ~8% opacity (≈4% under text). One material per surface. If a texture is the first thing you notice, it's twice too strong.

**Banned:** photographic textures, emboss/bevel effects, heavy inner shadows, gold-foil glints that animate, anything skeuomorphic-2010. Subtle, not gimmicky.

**Where texture applies:** library-layer surfaces only — shelves, spines, desk, card stock, signage. The institutional layer (header, footer, buttons, forms, admin) stays **flat**; that contrast between flat chrome and material scene is part of the two-layer system, and texture must never reduce a verified text-contrast pair.

---

## 3. Typography

All web-embeddable Google Fonts. Whitney is licensed to Rebekah's machine and cannot ship in a web app; Open Sans is UBC's sanctioned digital alternative and carries the UBC typographic connection.

### 3.1 The five roles

| Role | Font | Weights | Use |
|---|---|---|---|
| **Display** | **EB Garamond** | 500, 600, 700 + italics | Page titles, section headers, book titles, "Book of the Week." Old-style Garamond — the letterforms of actual old library books. |
| **Body** | **Crimson Pro** | 400, 600 + italic | Kudos text, paragraphs, descriptions. A book face designed for reading; warmer and sturdier than Garamond at small sizes. |
| **Card / stamp** | **Special Elite** | 400 only | Library card fields, date stamps, badges, leaderboard entries, "DUE DATE" labels. Worn typewriter — inked, slightly uneven. |
| **Functional UI** | **Open Sans** | 400, 600 | Form labels, inputs, buttons, admin tables, settings, toasts. The UBC typographic anchor. |
| **Handwritten** (kudos picker only) | **Caveat** | 400, 600 | One of the user-selectable kudos fonts. Never used for UI. |

CSS stacks (in token file): EB Garamond and Crimson Pro fall back to Georgia/serif; Special Elite to Courier New/monospace; Open Sans to Arial/sans-serif (UBC's own fallback chain).

### 3.2 Type scale (desktop-only, 1280px+)

Two contexts share the same five fonts but run different scales. The marketing page (`/`) is public-facing and oratorical; the product (everything behind login) is a reading environment and runs denser.

**Marketing page** (`mk-` tokens):

| Token | Size/line | Font | Use |
|---|---|---|---|
| `--text-mk-hero` | 56/64 | EB Garamond 600 | The hero line ("A library a team builds together…") |
| `--text-mk-lede` | 21/34 | Crimson Pro 400 italic | Hero subtitle, section ledes |
| `--text-mk-h2` | 36/44 | EB Garamond 600 | Section headers (What it is, How it works…) |
| `--text-mk-h3` | 24/32 | EB Garamond 600 | Subsections, step titles |
| `--text-mk-eyebrow` | 12/16 | Open Sans 600, +0.08em, uppercase | Kicker above section headers |
| `--text-mk-body` | 18/30 | Crimson Pro 400 | Marketing body copy |
| `--text-mk-caption` | 14/20 | Open Sans 400 | Screenshot captions, footer |

**In-product** (`app-` tokens):

| Token | Size/line | Font | Use |
|---|---|---|---|
| `--text-app-title` | 32/40 | EB Garamond 600 | Page title (one per screen) |
| `--text-app-h2` | 24/32 | EB Garamond 600 | Section headers (New Arrivals, shelf names) |
| `--text-app-h3` | 19/26 | EB Garamond 600 | Sub-sections, modal titles, book titles |
| `--text-app-h4` | 13/18 | Open Sans 600, +0.06em, uppercase | Minor headers, admin table headers, form group labels |
| `--text-app-body` | 17/28 | Crimson Pro 400 | Kudos text, descriptions — the primary reading surface; never below 16 |
| `--text-app-body-sm` | 15/24 | Crimson Pro 400 | Metadata sentences, secondary descriptions |
| `--text-app-ui` | 14/20 | Open Sans 400/600 | Buttons, inputs, settings, toasts |
| `--text-app-ui-sm` | 12/16 | Open Sans 400 | Timestamps, helper text, badges |
| `--text-app-card` | 15/24 | Special Elite | Library card fields |
| `--text-app-card-sm` | 12/18 | Special Elite | Card stamps, due-date labels |

Hierarchy rule: Garamond owns levels 1–3 (the bookish voice), Open Sans owns level 4 down (the functional voice). A screen should never need more than three Garamond sizes at once.

### 3.4 Email context (the 12 HTML templates)

Most email clients block webfonts, so the Google Fonts above won't render in inboxes. Per `06_email_design_brief.md`, emails substitute web-safe equivalents — same roles, degraded gracefully: display/body serif → **Georgia**; functional UI → **Arial** (UBC's own fallback chain); typewriter card moments → **Courier New**. Colours are unchanged (hex works everywhere); the bookish feel in email is carried by the header illustrations (§2.6 palette rule applies) and Georgia's serif warmth. If this section and the email brief ever disagree, the email brief wins on email mechanics; this document wins on colour.

### 3.3 Kudos message font picker (5 curated)

Maps to the PRD's `font_choice` preset key: `classic` Crimson Pro (default) · `elegant` EB Garamond italic · `typewriter` Special Elite · `handwritten` Caveat · `modern` Open Sans. All already loaded — the picker costs nothing extra.

---

## 4. Logos

**Mark of choice: the UBC crest** (not the full signature/wordmark) — the heraldic, old-world option, per direction. Note for the record: UBC treats crest-only as a "small or iconic use," which is exactly how we use it. If this product ever goes formally public under UBC, expect the brand team to ask for the full signature on the marketing page.

| Context | File | Treatment |
|---|---|---|
| App footer (every screen) | `ubc-logo-2018-crest-white-rgb300.png` | On UBC Navy footer band, small (~32–40px tall) |
| `/login` | `ubc-logo-2018-crest-blue-rgb300.png` | On cream, modest, above or below the sign-in card |
| Marketing page footer | crest, blue on cream | Same scale as app footer |

Footer text convention (borrowed from ubc.ca's common look and feel, the only CLF element we adopt): the crest sits beside the text line "The University of British Columbia", with the link row (Terms · Privacy) following. We deliberately do **not** adopt the full CLF header/footer — that system marks official UBC websites, and this product is a sub-brand intended to be replicable beyond UBC. No land acknowledgement in footers (decided June 2026; copy decision, revisitable).

Files live in `03_Brand_and_Voice/_sources/Logos/UBC/`.

**Integrity rules (from UBC guides, non-negotiable):** clear space equal to the crest's own height on all sides · never stretch, recolour, rotate, or apply effects · never place on busy or low-contrast backgrounds · minimum legible size. The crest is **chrome, not scenery** — it never appears as an in-world illustrated object (no crest bookplates inside books; that crosses into modifying the mark).

**Not in this product:** FORWARD logo and chevrons (colours only — see §1), Giving Day marks, UBC full signature (reserved for future formal use).

---

## 5. Components

### 5.1 Buttons (locked June 4, 2026 — chosen from six rendered options)

| Role | Look | States | Contrast (verified) |
|---|---|---|---|
| **Primary** | Forward Gold `#E69400` fill, Ink `#343433` text, 3px radius, Open Sans 600 14px | Hover: fill brightens to Daylight Gold `#F3C96B` ("catching the window light"). Pressed: rest fill + `scale(0.98)`. Focus: 2px Royal Blue `#0055B7` ring. | Rest 5.1:1 AA · hover 7.9:1 AAA |
| **Secondary** ("gilded outline") | Transparent fill, 1px Deep Walnut `#4B352A` border, UBC Navy text | Hover: fills Forward Gold, ink text, gold border. Pressed: `scale(0.98)`. | Rest 13.9:1 AAA · hover 5.1:1 AA |
| **Tertiary** ("bookplate stamp") | Parchment fill, Oxblood top+bottom 1px rules (no side borders, no radius), Special Elite text in Oxblood, +0.05em | Hover: inverts — Oxblood fill, parchment text. | Both states 7.8:1 AAA |

Rules: the bookplate button appears **only inside library-card and book contexts** (checkout actions, card footers) — never in forms or admin. Burnished Gold `#C86700` never carries text in any state (3.4:1 with cream — fails); it is decorative only. Destructive actions use Oxblood fill + cream text (8.9:1 AAA) styled as a primary — not the bookplate.

### 5.2 The library card

The recurring motif: leaderboard entries, profile cards, badge displays, featured kudos. It should look like a card stamped 400 times since 1962.

- **Stock:** Parchment `#EAE0C8`; 1px border in Deep Walnut `#4B352A` at 40% opacity; corners 2px (cards are cut square, not rounded); subtle paper-grain texture acceptable, no drop-shadow heavier than `0 1px 3px rgba(52,52,51,.18)`.
- **Header rule:** double horizontal rule (1px + 1px, 2px gap) in Oxblood `#76232F` under the card title — the classic checkout-card header.
- **Title field:** Special Elite, 15px, Ink, letter-spacing 0.04em, ALL CAPS for field labels ("AUTHOR", "DATE DUE", "BORROWER").
- **Ruled lines:** entry rows sit on 1px lines in Deep Walnut at 30% — the lined area of a checkout card.
- **Date stamp:** Special Elite in Oxblood, rotated −2° to −4°, slightly reduced opacity (85%) — the "stamped by hand" cue. Used for dates, badge awards, "CHECKED OUT" states.
- **Wear:** at most one subtle corner-fade or smudge per card. Restraint — suggestion of age, not costume.

---

### 5.3 App chrome — the navy bookends

**Header: full UBC Navy `#002145` band** (locked June 2026 — chosen over the stripe variant). Cream brand title in EB Garamond, cream nav links in Open Sans 600 (hover: Daylight Gold), gold primary CTA. The header and the navy footer bookend every screen in UBC Blue — the institutional anchor at top and bottom, with the warm library scene held between them. Header is flat (no texture, per §2.7) and carries no crest (crest stays footer + login, §4).

Contrast: cream on navy 13.9:1 AAA; the gold CTA reads clearly against navy.

*Documented alternative:* cream header with a bold navy top stripe — one line of CSS if full navy ever feels heavy in practice. Revisit only with evidence.

### 5.4 Callouts & signage — colour rotation

The browns belong to things that are literally wooden. UI callouts pull from the **full palette** so pages feel bright and warm, not uniformly brown.

**Wash backgrounds** — derived from existing colours at low opacity over cream (not new hexes):

| Callout type | Wash (background) | Accent rule + heading | Use |
|---|---|---|---|
| **Featured / prompt** | Daylight Gold @ 18% | Heritage Gold rule, UBC Navy heading | Prompt-of-the-week, Book of the Week framing, featured surfaces |
| **Success / celebration** | Library Green @ 7% | Library Green | Kudos sent confirmations, badge awards, milestones |
| **Informational** | UBC Navy @ 6% | UBC Navy | Onboarding teaching lines, settings notes, digests |
| **Alert** | Oxblood @ 6% | Oxblood | Errors, moderation notices, destructive confirmations |

Anatomy: wash background + 3px solid left rule in the accent colour + accent-colour heading + ink body text. 3px radius. Flat (no texture — callouts are chrome).

**Rotation rules:** wooden signage (Special Elite on Deep Walnut) is reserved for *in-scene* wayfinding — at most one wooden sign per screen. Adjacent callouts never repeat the same colour. Brown carries at most a third of the callout/signage moments on any screen — some brown, never all brown. Eyebrow labels rotate the same way (oxblood, green, navy, walnut) rather than defaulting to walnut.

## 6. Voice on the surface

Copy rules live in the PRD; the design-system-relevant ones: library-themed microcopy throughout ("new in the stacks," "added to the shelf," "reserved for you") — warm, never saccharine. If the FORWARD campaign is ever referenced in copy (unlikely in-app), naming rules apply: "FORWARD, the campaign for UBC" on first reference, never "FORWARD" alone, never italicized.

---

## 7. Using the tokens

`11_design_tokens.css` defines everything above as CSS custom properties under `:root`, grouped into `/* INSTITUTIONAL LAYER */` and `/* LIBRARY LAYER */` blocks, plus font imports and the type scale. For the build: import the Google Fonts `<link>` (in the file's header comment), then the stylesheet; in Tailwind v4 the same variables drop into an `@theme` block unchanged. Claude Code must use tokens — raw hex in components is a build error.

**Future hooks (noted, not built):** institutional-layer swap for non-UBC orgs (§1) · dark mode would add a second `:root` block, nothing else · Special Collections (v1.1) can extend `--spine-*` without touching anything.
