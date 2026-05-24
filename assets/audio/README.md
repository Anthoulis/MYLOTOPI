# Audio Asset Contract

Audio files are organized by language code.

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

Each folder currently contains 9 MP3 files, one per canonical tour stop:

- `section-01.mp3`: Welcome / Introduction
- `section-02.mp3`: Garden / Herbs
- `section-03.mp3`: Windmill base
- `section-04.mp3`: Sleeping area
- `section-05.mp3`: Machinery
- `section-06.mp3`: Threshing floor and donkeys
- `section-07.mp3`: Cellar / Italian tunnel
- `section-08.mp3`: Traditional house
- `section-09.mp3`: Bakery

Language manifests in `assets/content/<language>/index.json` are the source of truth for runtime audio paths.

Before deployment, play every referenced audio file in a browser and run `npm run validate`.

Do not link to files inside `Mylotopi files` from the public site.
