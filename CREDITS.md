# Credits

## 21st.dev components
None are used yet. No 21st.dev code, prompts or URLs have been invented. The six slots below are filled with in-house implementations so the site works today. When you paste a pick (the "Copy prompt", TSX or shadcn add command), it replaces the stand-in, gets restyled to the ZARISH tokens, has `framer-motion` imports changed to `motion/react`, is audited (no tracking, external calls or demo content) and is listed here with author and source URL.

| Slot | Current stand-in (in this repo) | 21st.dev pick | Author | Source URL |
| --- | --- | --- | --- | --- |
| 1 Hero / shader | `src/components/GemCanvas.tsx`, `Story.tsx` | not chosen | | |
| 2 Depth piece | parallax layers in `HomeSections.tsx` (CraftStats) | not chosen | | |
| 3 Cursor | `Cursor` in `src/components/fx.tsx` | not chosen | | |
| 4 Product cards / bento | `src/components/ProductCard.tsx` | not chosen | | |
| 5 Marquee / ticker | `Marquee`, `NumberTicker` in `fx.tsx` | not chosen | | |
| 6 Text effect | `KineticText` in `fx.tsx` | not chosen | | |

## Libraries
Next.js, React, Tailwind CSS, Motion (`motion/react`), Lenis, three.js, @react-three/fiber, @react-three/drei, @supabase/supabase-js, lucide-react, clsx, tailwind-merge. Each is used under its own open-source licence.

## Fonts
Cormorant and Montserrat from Google Fonts (SIL Open Font Licence).

## Design system
Generated with the UI UX Pro Max skill (`.claude/skills/ui-ux-pro-max`, output in `design-system/zarish/MASTER.md`). Overrides are explained at the top of `src/app/globals.css`. See the skill's own LICENSE file for its terms.
