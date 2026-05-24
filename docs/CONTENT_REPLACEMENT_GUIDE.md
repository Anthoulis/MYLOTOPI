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

There are no staged language folders currently. All ten language folders are listed in `MYLOTOPI_GUIDE_META.languages` and exposed in the runtime language switcher.

Turkish is active and uses a documented fallback Mini-map until a Turkish-specific source image is provided.

Language flags are rendered from the centralized inline SVG map in `assets/js/app.js`. Do not add emoji flag fields to language manifests.

## Canonical Spot Keys

1. `welcome`
2. `garden-herbs`
3. `windmill-base`
4. `sleeping-area`
5. `machinery`
6. `threshing-floor-donkeys`
7. `cellar-italian-tunnel`
8. `traditional-house`
9. `bakery`

These are the public route keys for QR generation. Preserve them once printed QR codes are produced.

## Replacing Audio

Current project audio format:

- `.mp3` for all language folders currently in `assets/audio/`.

Each language folder under `assets/audio/` contains 9 audio files:

- `section-01.mp3`: Welcome / Introduction
- `section-02.mp3`: Garden / Herbs
- `section-03.mp3`: Windmill base
- `section-04.mp3`: Sleeping area
- `section-05.mp3`: Machinery
- `section-06.mp3`: Threshing floor and donkeys
- `section-07.mp3`: Cellar / Italian tunnel
- `section-08.mp3`: Traditional house
- `section-09.mp3`: Bakery

Replace narration using the same filenames whenever possible.

Do not leave zero-byte, corrupt, or invalid audio files. Browser audio controls must be able to load the files. If final audio is not ready for a future language, keep that language staged or set `audio.ready: false` before activation.

If the final format changes later, update the `audio.path` values in every affected `assets/content/<language>/index.json` file and confirm MIME handling in `assets/js/app.js` still supports the extension.

## Replacing Images

Add final stop images to the matching folder under `assets/images/stops/`.

Recommended filenames:

- `01-main.webp`
- `02-detail.webp`
- `03-extra.webp`

After adding images, update the matching spot's `images` array in `assets/js/content-meta.js`.

Use the metadata fields intentionally:

- `src`: required project-relative image path.
- `alt`: optional localized alt text. Section `imageAlt` is the fallback.
- `fit`: optional, either `cover` or `contain`.
- `position`: optional CSS object-position value such as `center` or `50% 40%`.

If a section has no suitable image, leave `images: []` and let the app show its placeholder. Do not attach a visually unrelated image to avoid an empty gallery.

## Updating Localized Text

Localized runtime content belongs in `assets/content/`.

Each language folder should keep:

- `index.json`
- `sections/01-welcome.json`
- `sections/02-garden-herbs.json`
- `sections/03-windmill-base.json`
- `sections/04-sleeping-area.json`
- `sections/05-machinery.json`
- `sections/06-threshing-floor-donkeys.json`
- `sections/07-cellar-italian-tunnel.json`
- `sections/08-traditional-house.json`
- `sections/09-bakery.json`

Each section JSON must contain:

- `id`
- `title`
- `navigationTitle`
- `preview`
- `details`

`details` preserves the ordered reading structure. Bullet groups are stored once in `bullets` and referenced from `details` with `{ "type": "bulletGroup", "id": "..." }`.

Do not hardcode translated visitor copy in `index.html`, `assets/js/app.js`, or any other JavaScript file.

When extracting from source DOCX files, split on the source marker `Read more>>` if it exists. Text before the marker becomes `preview`; text after the marker becomes `details`. The literal marker must not be stored for rendering.

## Activating A Future Language

1. Confirm the folder has an `index.json` and all 9 section files.
2. Confirm UI labels are fully localized, not mixed with English fallback strings unless deliberately approved.
3. Confirm the young-visitors challenge content is present or intentionally omitted for that language.
4. Confirm all `audio.ready: true` paths exist and play in the browser.
5. Confirm the Mini-map path exists.
6. Move the language code from `stagedLanguages` to `languages` in `assets/js/content-meta.js`.
7. Run `npm run validate`.
8. Manually test language switching, audio, gallery, Mini-map, and URL params.
9. Add an inline SVG flag mapping for the new language in `assets/js/app.js`, or confirm the neutral fallback is intentional.

## Filename And Path Rules

- Keep audio paths in the form `./assets/audio/<language>/section-<number>.mp3`.
- Keep section paths in language manifests in the form `sections/<number>-<slug>.json`.
- Keep stop image folders in the form `assets/images/stops/<number>-<slug>/`.
- Use lowercase kebab-case for new asset filenames where practical.
- Keep public paths stable after QR targets are finalized.
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
8. Test URL params `?lang=en&spot=welcome`.
9. Test invalid params fallback.
10. Check the browser console for errors.
