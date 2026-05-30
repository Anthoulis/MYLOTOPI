# Runtime Content

Content is organized as one complete JSON file per active language.

Active runtime language files:

- `en.json`
- `el.json`
- `de.json`
- `fr.json`
- `it.json`
- `es.json`
- `nl.json`
- `pl.json`
- `ru.json`
- `tr.json`

Only language codes listed in `MYLOTOPI_GUIDE_META.languages` are exposed in the app.

Each language file contains:

- `code`, `nativeName`, and `aliases`
- `ui` labels used by the guide interface
- optional `miniMap` path metadata
- `sections`, in the canonical order from `assets/js/content-meta.js`

Each section contains its visitor text, challenge content, language-specific audio path, and localized `imageAlt` text. Shared image paths and accent colors stay in `assets/js/content-meta.js`.

To edit English text, open `assets/content/en.json`. To edit Greek text, open `assets/content/el.json`.

The source DOCX marker `Read more>>`, when present, belongs only to extraction logic and must not appear in rendered content.
