// Makes the light copies the site serves from the full-quality originals: `npm run media`.
// Needs ffmpeg (Windows: winget install Gyan.FFmpeg), or its path in the FFMPEG variable.
// Only missing copies are made; --force makes all of them again. The copies are committed, so the
// server never builds anything and this runs only when an original changes.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { AUDIO_BITRATE, audioCopy, iconCopies, imageVariants } from "./media.mjs";
import { LOGO_ORIGINAL, ROOT, loadSite } from "./site.mjs";

const force = process.argv.includes("--force");
const ffmpeg = process.env.FFMPEG || "ffmpeg";
const site = loadSite();
const absolute = (relativePath) => path.join(ROOT, relativePath);
let made = 0;
let kept = 0;

function run(args) {
  try {
    execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("ffmpeg was not found. Install it (winget install Gyan.FFmpeg) or set FFMPEG to its path.");
    }
    throw error;
  }
}

// Writes through a temporary file, so a failed run never leaves half a copy behind.
function make(outputPath, buildArgs) {
  const target = absolute(outputPath);
  if (!force && fs.existsSync(target)) {
    kept += 1;
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target.replace(/(\.[a-z0-9]+)$/i, ".tmp$1");
  run([...buildArgs(temporary)]);
  fs.renameSync(temporary, target);
  made += 1;
  console.log(`made ${outputPath}`);
}

function makeImage(originalPath, kind, quality, extraArgs = []) {
  const { width } = site.imageSize(originalPath);
  for (const variant of imageVariants(originalPath, kind, width)) {
    make(variant.path, (out) => [
      "-i", absolute(originalPath),
      "-vf", `scale=${variant.width}:-2:flags=lanczos`,
      "-map_metadata", "-1",
      "-c:v", "libwebp", "-quality", String(quality), "-compression_level", "6",
      ...extraArgs,
      out,
    ]);
  }
}

// Photos of every stop.
for (const id of site.meta.sectionOrder) {
  site.meta.sections[id].images.forEach((image) => makeImage(image.src, "photo", 80));
}

// The hand-drawn map of every language: a drawing keeps its lines better at a higher quality.
for (const lang of site.meta.languages) {
  makeImage(site.content.get(lang).miniMap.path, "map", 85);
}

// The header logo keeps its transparency.
makeImage(LOGO_ORIGINAL, "logo", 90, ["-pix_fmt", "yuva420p"]);

// The tab and home-screen icon: the windmill flower of the logo, on the charcoal of the header.
for (const icon of iconCopies()) {
  const flower = Math.round(icon.size * 0.86);
  make(icon.path, (out) => [
    "-i", absolute(LOGO_ORIGINAL),
    "-f", "lavfi", "-i", `color=c=0x1f2210:s=${icon.size}x${icon.size}`,
    // A circle around the flower's centre (585, 116 in the 1188×340 logo) leaves out the letters beside it.
    "-filter_complex",
    `[0]crop=232:232:469:0,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-W/2,Y-H/2),W/2-1),alpha(X,Y),0)',` +
      `scale=${flower}:${flower}:flags=lanczos[f];[1][f]overlay=(W-w)/2:(H-h)/2:format=auto`,
    "-frames:v", "1",
    out,
  ]);
}

// Every narration, as speech-quality mono MP3.
for (const lang of site.meta.languages) {
  for (const section of site.content.get(lang).sections) {
    make(audioCopy(section.audio.path), (out) => [
      "-i", absolute(section.audio.path),
      "-map_metadata", "-1",
      "-ac", "1", "-ar", "44100",
      "-c:a", "libmp3lame", "-b:a", AUDIO_BITRATE,
      out,
    ]);
  }
}

console.log(`Media: ${made} made, ${kept} already there.`);
