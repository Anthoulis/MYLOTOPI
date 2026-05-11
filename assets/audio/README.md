# Audio Replacement Contract

Audio files are organized by language:

- `en`
- `el`
- `de`
- `nl`
- `pl`

Each language folder must contain 9 audio files, one per canonical tour stop.

Current placeholder format: silent `.wav`.

Final audio should replace placeholders using the same filenames whenever possible. Do not leave zero-byte, corrupt, or invalid audio files.

Do not change audio paths unless the matching locale references in `assets/locales/*.js` are intentionally updated at the same time.
