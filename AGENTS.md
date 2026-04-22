# AGENTS.md

## Project intent
This repository contains the Mylotopi QR guide experience.
It is currently implemented as a lightweight static single-page app with deep-linking, multilingual content, and per-spot audio.

Codex should treat this project as a mobile-first cultural guide for tourists visiting Mylotopi.

## Core rules
- Preserve the project's visual identity. Changes should feel consistent with Mylotopi's heritage, gastronomy, and authentic village character.
- Prefer minimal, maintainable solutions over clever or heavy implementations.
- Mobile-first UX is the default priority. Desktop support matters, but mobile behavior comes first.
- Avoid unnecessary dependencies. Do not introduce a library unless it clearly solves a real problem the current stack cannot solve simply.
- Keep content and presentation separated.
- Use structured multilingual data instead of duplicated hardcoded markup.
- Do not create extra routes or pages when one page with deep-linking is sufficient.
- Preserve accessibility and performance with every change.
- When implementing UI, keep spacing, typography, and touch targets suitable for mobile tourists using phones one-handed and outdoors.
- Before finishing a task, verify behavior manually and check for regressions.

## Architecture expectations
- The QR guide should remain a single-page experience unless there is a strong product reason to change that.
- Deep linking through query params such as `?spot=aloni&lang=en` is the preferred navigation model.
- Query param handling must be robust:
  - invalid `spot` values should fail safely
  - invalid `lang` values should normalize to the default language
  - URL normalization should not break the current view
- Rendering should be data-driven.
- Business/content data belongs in the content model, not in repeated HTML strings spread across the codebase.

## Repo layout
- [qr-guide.html](/C:/dev/MYLOTOPI/qr-guide.html)
  Single HTML entry point for the QR guide.
- [assets/qr-guide.css](/C:/dev/MYLOTOPI/assets/qr-guide.css)
  All guide styling and responsive layout rules.
- [assets/qr-guide.js](/C:/dev/MYLOTOPI/assets/qr-guide.js)
  Runtime logic for query params, rendering, fallback behavior, active-state handling, and audio coordination.
- [assets/qr-guide-content.js](/C:/dev/MYLOTOPI/assets/qr-guide-content.js)
  Structured multilingual guide data. This is the source of truth for content.
- [assets/audio/qr-guide](/C:/dev/MYLOTOPI/assets/audio/qr-guide)
  Audio assets organized by spot and language.

## How to run the project
There is no framework build step in the current repository.

Preferred local run options:
1. Open [qr-guide.html](/C:/dev/MYLOTOPI/qr-guide.html) directly in a browser for quick checks.
2. If a local server is needed, serve the repository as static files and open `/qr-guide.html`.

Do not add a build system unless the project scope has clearly changed and the added complexity is justified.

## Where guide content should live
- All guide copy, localized UI labels, spot metadata, and audio path mappings should live in [assets/qr-guide-content.js](/C:/dev/MYLOTOPI/assets/qr-guide-content.js).
- Do not hardcode translated content directly inside [assets/qr-guide.js](/C:/dev/MYLOTOPI/assets/qr-guide.js) or [qr-guide.html](/C:/dev/MYLOTOPI/qr-guide.html).
- Presentation concerns belong in [assets/qr-guide.css](/C:/dev/MYLOTOPI/assets/qr-guide.css).
- Runtime behavior belongs in [assets/qr-guide.js](/C:/dev/MYLOTOPI/assets/qr-guide.js).

## How to add a new language
1. Add the language code to `supportedLanguages` in [assets/qr-guide-content.js](/C:/dev/MYLOTOPI/assets/qr-guide-content.js).
2. Add any URL aliases to `languageAliases`.
3. Add the localized UI strings under `ui.<lang>`.
4. For each spot, add `translations.<lang>` with at least:
   - `title`
   - `shortText`
   - `audioPath`
5. Add `shortTitle` when the navigation chip needs a shorter label than the full title.
6. Add `audioCaption` and `body` when localized long-form content exists.
7. Add localized `imageAlt` text for the spot if needed.
8. Place the audio file in the matching folder under `assets/audio/qr-guide/<spot>/<lang>.<ext>`.
9. If the audio file is not ready yet, keep `audioReady: false` so the UI falls back safely.

## How to add a new QR spot
1. Add a new spot object to `spots` in [assets/qr-guide-content.js](/C:/dev/MYLOTOPI/assets/qr-guide-content.js).
2. Give it a stable `id`. This id is the deep-link key used in QR URLs.
3. Add its visual metadata:
   - `accent`
   - `accentSoft`
   - `imageSrc` if available
   - `imageAlt`
4. Add translations for all supported languages.
5. Add the corresponding audio files in `assets/audio/qr-guide/<spot-id>/`.
6. Verify the new spot appears correctly in:
   - the section list
   - the sticky spot navigation
   - deep-link scrolling via `?spot=<spot-id>`
7. Do not create a separate page for the new spot unless product requirements explicitly change.

## UI and UX standards
- The selected deep-linked spot must be immediately obvious on load.
- Language switching must be easy to reach and easy to understand on small screens.
- Touch targets should be comfortable for tourists using phones while standing or walking.
- Typography should favor clarity, warmth, and hierarchy over novelty.
- Avoid oversized desktop-like spacing patterns on mobile.
- Audio controls should remain visible, legible, and uncluttered.
- Section cards should feel distinct but cohesive.
- Keep interfaces light and calm. Avoid visual heaviness.

## Accessibility requirements
- Do not autoplay audio.
- Keep all core information available as readable text, not audio only.
- Preserve semantic headings and button roles.
- Preserve keyboard access and visible focus states.
- Respect reduced-motion preferences.
- Keep color contrast and touch target sizes appropriate for real-world mobile use.

## Performance requirements
- Keep the implementation lightweight.
- Avoid unnecessary JavaScript work on load.
- Prefer static/local content over runtime fetches unless there is a clear reason.
- Avoid large media loads by default.
- Do not regress mobile responsiveness or scrolling smoothness.

## Code quality expectations
- Keep functions focused and explicit.
- Prefer one source of truth for ids, languages, and content.
- Remove dead code and redundant configuration when you see it.
- Simplify overengineered logic when a smaller clear solution exists.
- If a change increases complexity, the benefit must be clear and defensible.

## Verification before completion
Before finishing a task, manually verify at minimum:
- the page still works as one page only
- `spot` query params still scroll to the correct section
- the active section highlight still works
- `lang` switching still works and preserves the current spot when appropriate
- audio controls still render and remain usable
- invalid params fail safely
- the page remains mobile-friendly on a narrow viewport
- no obvious regressions were introduced in accessibility or performance

## Definition of done
Work on this project is only done when:
- the requested behavior works end-to-end
- the single-page deep-link architecture remains coherent
- content stays in the structured content model
- the UI remains mobile-first and visually consistent with Mylotopi
- accessibility and performance have not regressed
- manual verification has been performed
- the final code is clean, minimal, and production-ready
