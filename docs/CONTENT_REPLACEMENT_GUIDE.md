# Content Replacement Guide

This guide explains how to replace placeholder content without changing the QR Guide structure or app behavior.

## Language Codes

- `en`: English, default
- `el`: Greek
- `de`: German
- `nl`: Dutch
- `pl`: Polish
- `it`: Italian
- `fr`: French
- `es`: Spanish
- `ru`: Russian
- `tr`: Turkish

Keep this order in the UI unless there is an explicit product decision to change it.

## Canonical Spot Keys

1. `welcome`
2. `herb-garden`
3. `windmill-first-floor`
4. `windmill-second-floor`
5. `windmill-third-floor`
6. `threshing-floor-donkeys`
7. `cellar-italian-tunnel`
8. `traditional-house`
9. `bakery`

Do not rename these keys unless all metadata, locale, URL, and asset references are updated together.

## Replacing Audio

Current project audio formats:

- `.mp3` for languages with complete real incoming narration: `en`, `de`, `nl`, `pl`, `fr`, `es`.
- `.wav` for languages still using silent placeholders: `el`, `it`, `ru`, `tr`.

Greek audio is pending and currently uses valid silent `.wav` placeholders.

Each language folder under `assets/audio/` contains 9 audio files:

- `01-welcome.<ext>`
- `02-herb-garden.<ext>`
- `03-windmill-first-floor.<ext>`
- `04-windmill-second-floor.<ext>`
- `05-windmill-third-floor.<ext>`
- `06-threshing-floor-donkeys.<ext>`
- `07-cellar-italian-tunnel.<ext>`
- `08-traditional-house.<ext>`
- `09-bakery.<ext>`

Replace placeholder files with final narration using the same filenames whenever possible.

Do not leave zero-byte, corrupt, or invalid audio files. Browser audio controls must be able to load the files.

If the final format changes later, update the `audio.path` values in every affected `assets/locales/<language>.js` file and confirm MIME handling in `assets/js/app.js` still supports the extension.

## Replacing Images

Add final stop images to the matching folder under `assets/images/stops/`.

Recommended filenames:

- `01-main.webp`
- `02-detail.webp`
- `03-extra.webp`

After adding images, update the matching spot's `images` array in `assets/js/content-meta.js`.

Existing tunnel images currently remain in `assets/images/tunnel/` and are referenced from `assets/js/content-meta.js`. If those images are moved later, update every referenced path in the metadata file at the same time.

## Updating Locale Text

Localized content belongs in `assets/locales/`.

Each locale file should keep the same 9 spot keys and the same general data shape:

- `title`
- `shortTitle`
- `shortText`
- `imageAlt`
- `audio.path`
- `audio.caption`
- `body`

Do not hardcode translated visitor copy in `index.html` or `assets/js/app.js`.

## Filename And Path Rules

- Keep audio paths in the form `./assets/audio/<language>/<number>-<slug>.<ext>`.
- Match `<ext>` to the actual file extension used in that language folder.
- Keep stop image folders in the form `assets/images/stops/<number>-<slug>/`.
- Use lowercase kebab-case for new asset filenames where practical.
- Keep existing public paths stable unless every reference is updated safely.
- Do not link internal staff files from the public UI.

## Deployment Checklist

- All 10 locale files load without JavaScript errors.
- All locales contain the same 9 spot keys.
- Every `audio.path` points to an existing valid file.
- No audio file is zero-byte.
- Final images referenced in `content-meta.js` exist.
- `index.html` still loads `main.css`, `content-meta.js`, all locale files, `i18n.js`, and `app.js`.
- Mini-map navigation still scrolls to the correct stops.
- Stop dropdown navigation still scrolls to the correct stops.
- Language switching preserves the current spot where appropriate.
- Gallery controls still work.
- No public page links to `staff-instructions.docx`.
