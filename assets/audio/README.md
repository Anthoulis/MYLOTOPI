# Audio Replacement Contract

Audio files are organized by language:

- `en`
- `el`
- `de`
- `nl`
- `pl`
- `it`
- `fr`
- `es`
- `ru`
- `tr`

Each language folder must contain 9 audio files, one per canonical tour stop.

Current production formats:

- Real audio: `.mp3` for `en`, `de`, `nl`, `pl`, `fr`, and `es`.
- Pending placeholders: silent `.wav` for `el`, `it`, `ru`, and `tr`.

Greek, Italian, Russian, and Turkish final audio is pending and currently remains on silent WAV placeholders.

Final audio should replace placeholders using the same filenames whenever possible. Do not leave zero-byte, corrupt, or invalid audio files.

Do not change audio paths unless the matching locale references in `assets/locales/*.js` are intentionally updated at the same time.
