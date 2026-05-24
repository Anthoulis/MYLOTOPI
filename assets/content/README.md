# Runtime Content

Content is organized first by language and then by section.

Active runtime language folders:

- `en`
- `el`
- `de`
- `fr`
- `it`
- `es`
- `nl`
- `pl`
- `ru`
- `tr`

Only languages listed in `MYLOTOPI_GUIDE_META.languages` are exposed in the app. All language folders in this directory are currently active.

Each language folder has:

- `index.json`: language manifest, UI labels, Mini-map path, section order, section file paths, and audio paths.
- `sections/*.json`: one section content file per tour stop.

Section JSON files must contain `id`, `title`, `navigationTitle`, `preview`, and `details`. They may also contain `bullets`, `challenge`, and `imageAlt`.

The source DOCX marker `Read more>>`, when present, belongs only to extraction logic and must not appear in rendered content.
