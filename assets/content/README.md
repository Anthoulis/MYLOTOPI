# Runtime Content

Content is organized first by language and then by section.

Each language folder has:

- `index.json`: language manifest, UI labels, mini-map path, section order, section file paths, and audio paths.
- `sections/*.json`: one section content file per tour stop.

Section JSON files contain `id`, `title`, `preview`, `details`, and `bullets`.

The source DOCX marker `Read more>>`, when present, belongs only to extraction logic and must not appear in rendered content.
