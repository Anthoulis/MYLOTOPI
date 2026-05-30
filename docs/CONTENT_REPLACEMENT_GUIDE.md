# Content Replacement Guide

This guide explains how to replace structured content without changing the QR Guide structure or app behavior.

## Language Status

Active runtime languages:

- `en`: English, default
- `el`: Greek
- `de`: German
- `fr`: French
- `it`: Italian
- `es`: Spanish
- `nl`: Dutch
- `pl`: Polish
- `ru`: Russian
- `tr`: Turkish

Each active language has exactly one editable content file: `assets/content/<language>.json`.

Turkish is active and uses a documented fallback Mini-map until a Turkish-specific source image is provided.

Language flags are rendered from the centralized inline SVG map in `assets/js/app.js`. Do not add emoji flag fields to content files.

## Route Model

There is one public QR code. It should open the guide from the beginning, normally `/index.html` with an optional `?lang=<code>` parameter.

Sections are internal navigation inside the same page. The app still accepts optional `?spot=<section-id>` links for testing and direct sharing, but content architecture does not depend on separate QR destinations per section.

## Canonical Section Keys

1. `welcome`
2. `herb-garden`
3. `windmill-first-floor`
4. `windmill-second-floor`
5. `windmill-third-floor`
6. `threshing-floor-donkeys`
7. `cellar-italian-tunnel`
8. `traditional-house`
9. `bakery`

These IDs are defined once in `assets/js/content-meta.js` and each `assets/content/<language>.json` file must use the same order.

## Updating Localized Text

Localized runtime content belongs in `assets/content/<language>.json`.

For example:

- English: `assets/content/en.json`
- Greek: `assets/content/el.json`
- German: `assets/content/de.json`

Each language file contains:

- `code`
- `nativeName`
- `aliases`
- `ui`
- optional `miniMap`
- `sections`

Each section must contain:

- `id`
- `title`
- `navigationTitle`
- `preview`
- `details`
- `audio`
- `imageAlt`

`details` preserves the ordered reading structure. It can contain plain paragraph strings, heading blocks, and list blocks.

Do not hardcode translated visitor copy in `index.html`, `assets/js/app.js`, or any other JavaScript file.

When extracting from source DOCX files, split on the source marker `Read more>>` if it exists. Text before the marker becomes `preview`; text after the marker becomes `details`. The literal marker must not be stored for rendering.

## Replacing Audio

Current project audio format:

- `.mp3` for all language folders currently in `assets/audio/`.

Each language folder under `assets/audio/` contains 9 audio files:

- `section-01.mp3`: Welcome / Introduction
- `section-02.mp3`: Herb Garden
- `section-03.mp3`: Windmill First Floor
- `section-04.mp3`: Windmill Second Floor
- `section-05.mp3`: Windmill Third Floor
- `section-06.mp3`: Threshing floor and donkeys
- `section-07.mp3`: Cellar / Italian tunnel
- `section-08.mp3`: Traditional house
- `section-09.mp3`: Bakery

Replace narration using the same filenames whenever possible.

Do not leave zero-byte, corrupt, or invalid audio files. Browser audio controls must be able to load the files. If final audio is not ready for a language, keep `audio.ready: false` until it is ready.

If the final format changes later, update the `audio.path` values inside every affected `assets/content/<language>.json` file and confirm MIME handling in `assets/js/app.js` still supports the extension.

## Replacing Images

Add final section images to the matching folder under `assets/images/stops/`.

Recommended filenames:

- `01-main.webp`
- `02-detail.webp`
- `03-extra.webp`

After adding images, update the matching section's `images` array in `assets/js/content-meta.js`.

Use the metadata fields intentionally:

- `src`: required project-relative image path.
- `fit`: optional, either `cover` or `contain`.
- `position`: optional CSS object-position value such as `center` or `50% 40%`.

Localized image alt text belongs in the section's `imageAlt` field inside each `assets/content/<language>.json` file. Do not put alt text in `assets/js/content-meta.js`.

If a section has no suitable image, leave `images: []` and let the app show its placeholder. Do not attach a visually unrelated image to avoid an empty gallery.

## Activating A Future Language

1. Create `assets/content/<language>.json`.
2. Confirm UI labels are fully localized, not mixed with English fallback strings unless deliberately approved.
3. Confirm all 9 sections exist in canonical order.
4. Confirm each section has `audio.path` and `audio.ready` set correctly.
5. Confirm all `audio.ready: true` paths exist and play in the browser.
6. Confirm the Mini-map path exists, if provided.
7. Add the language code to `languages` in `assets/js/content-meta.js`.
8. Run `npm run validate`.
9. Manually test language switching, audio, gallery, Mini-map, and URL params.
10. Add an inline SVG flag mapping for the new language in `assets/js/app.js`, or confirm the neutral fallback is intentional.

## Filename And Path Rules

- Keep audio paths in the form `./assets/audio/<language>/section-<number>.mp3`.
- Keep language content files in the form `assets/content/<language>.json`.
- Keep section IDs lowercase kebab-case.
- Keep image files under `assets/images/stops/`.
- Keep `qr-guide.html` as a compatibility redirect unless old QR targets are known to be unused.
- Do not link internal staff files from the public UI.

## Pre-deploy Checklist

1. Run a local static server.
2. Run `npm run validate`.
3. Test widths `320`, `360`, `390`, `430`, `720`, `980`, and `1180`.
4. Test language switching.
5. Test every audio file.
6. Test every gallery.
7. Test the Mini-map modal.
8. Test URL params `?lang=en`, `?lang=en&spot=welcome`, and invalid params.
9. Check the browser console for errors.
