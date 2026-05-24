# AGENTS.md

## Project intent
This repository contains the standalone Mylotopi QR guide microsite.
It is implemented as a lightweight static single-page app with deep-linking, multilingual content, per-spot galleries, and per-spot audio.

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
- Deep linking through query params such as `?spot=welcome&lang=en` is the preferred navigation model.
- Query param handling must be robust:
  - invalid `spot` values should fail safely
  - invalid `lang` values should normalize to the default language
  - URL normalization should not break the current view
- Rendering should be data-driven.
- Business/content data belongs in the content model, not in repeated HTML strings spread across the codebase.

## Repo layout
- [index.html](/C:/dev/MYLOTOPI/index.html)
  Main static microsite entry point.
- [qr-guide.html](/C:/dev/MYLOTOPI/qr-guide.html)
  Compatibility redirect to `index.html` that preserves query params.
- [assets/css/main.css](/C:/dev/MYLOTOPI/assets/css/main.css)
  All guide styling and responsive layout rules.
- [assets/js/content-meta.js](/C:/dev/MYLOTOPI/assets/js/content-meta.js)
  Non-localized guide metadata: language config, spot order, spot visual metadata, and image arrays.
- [assets/js/i18n.js](/C:/dev/MYLOTOPI/assets/js/i18n.js)
  Lightweight i18n helper and fallback logic.
- [assets/js/app.js](/C:/dev/MYLOTOPI/assets/js/app.js)
  Runtime state, rendering, URL/deep-link behavior, events, gallery logic, and audio coordination.
- [assets/content](/C:/dev/MYLOTOPI/assets/content)
  Structured JSON content organized by language and section.
- [assets/images](/C:/dev/MYLOTOPI/assets/images)
  Spot image folders.
- [assets/audio](/C:/dev/MYLOTOPI/assets/audio)
  Audio assets organized by language.

## How to run the project
There is no framework build step in the current repository.

Preferred local run options:
1. Open [index.html](/C:/dev/MYLOTOPI/index.html) directly in a browser for quick checks.
2. If a local server is needed, serve the repository as static files and open `/index.html`.

Do not add a build system unless the project scope has clearly changed and the added complexity is justified.

## Where guide content should live
- Non-localized metadata belongs in [assets/js/content-meta.js](/C:/dev/MYLOTOPI/assets/js/content-meta.js).
- Localized UI and spot copy belongs in [assets/content](/C:/dev/MYLOTOPI/assets/content).
- Do not hardcode translated content directly inside [assets/js/app.js](/C:/dev/MYLOTOPI/assets/js/app.js) or [index.html](/C:/dev/MYLOTOPI/index.html).
- Presentation concerns belong in [assets/css/main.css](/C:/dev/MYLOTOPI/assets/css/main.css).
- Runtime behavior belongs in [assets/js/app.js](/C:/dev/MYLOTOPI/assets/js/app.js).

## How to add a new language
1. Keep the language in `stagedLanguages` in [assets/js/content-meta.js](/C:/dev/MYLOTOPI/assets/js/content-meta.js) until it is production-ready.
2. Add its fixed native label and URL aliases.
3. Add a matching content folder under [assets/content](/C:/dev/MYLOTOPI/assets/content).
4. For each spot, add localized content with at least:
   - `title`
   - `navigationTitle`
   - `preview`
   - `details`
   - `audio.path`
5. Add localized UI labels in the language `index.json`.
6. Add localized `imageAlt` text for the spot if needed.
7. Place the audio file in the matching folder under `assets/audio/<lang>/`.
8. If the audio file is not ready yet, keep `audio.ready: false` so the UI falls back safely.
9. Move the language code to `languages` only after validation and manual review.
10. Run `npm run validate` before activating the language.

## How to add a new QR spot
1. Add the new spot id to `spotOrder` in [assets/js/content-meta.js](/C:/dev/MYLOTOPI/assets/js/content-meta.js).
2. Add a matching spot object to `spots`. This id is the deep-link key used in QR URLs.
3. Add its visual metadata:
   - `accent`
   - `accentSoft`
   - `images`
4. Add translations for all supported locales.
5. Add the corresponding audio files in `assets/audio/<lang>/`.
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
- the Mini-map modal still opens and closes correctly
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
