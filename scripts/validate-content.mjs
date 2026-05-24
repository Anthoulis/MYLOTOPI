import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const metaPath = path.join(repoRoot, "assets/js/content-meta.js");
const validFits = new Set(["cover", "contain"]);
const sanePositionPattern = /^[a-z0-9.%\-\s]+$/i;

const errors = new Map();
const warnings = new Map();

function addFinding(collection, group, message) {
  if (!collection.has(group)) {
    collection.set(group, []);
  }

  collection.get(group).push(message);
}

function addError(group, message) {
  addFinding(errors, group, message);
}

function addWarning(group, message) {
  addFinding(warnings, group, message);
}

function formatRelative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function readJsonFile(filePath, group, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addError(group, `${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function listDirectories(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function resolveProjectPath(publicPath, group, label) {
  if (typeof publicPath !== "string" || !publicPath.trim()) {
    addError(group, `${label} must be a non-empty local path.`);
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(publicPath)) {
    addError(group, `${label} must be a project-relative path, not a URL or absolute URI: ${publicPath}`);
    return null;
  }

  const cleanedPath = publicPath.replace(/^\.?[\\/]/, "");
  const resolvedPath = path.resolve(repoRoot, cleanedPath);
  const rootWithSeparator = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;

  if (resolvedPath !== repoRoot && !resolvedPath.startsWith(rootWithSeparator)) {
    addError(group, `${label} resolves outside the repository: ${publicPath}`);
    return null;
  }

  return resolvedPath;
}

function assertFileExists(publicPath, group, label) {
  const resolvedPath = resolveProjectPath(publicPath, group, label);
  if (!resolvedPath) {
    return null;
  }

  if (!fs.existsSync(resolvedPath)) {
    addError(group, `${label} does not exist: ${publicPath}`);
    return null;
  }

  if (!fs.statSync(resolvedPath).isFile()) {
    addError(group, `${label} is not a file: ${publicPath}`);
    return null;
  }

  return resolvedPath;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return Array.from(duplicates);
}

function arraysMatch(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function loadGuideMeta() {
  if (!fs.existsSync(metaPath)) {
    addError("Metadata", "assets/js/content-meta.js does not exist.");
    return null;
  }

  const sandbox = { window: {} };
  vm.createContext(sandbox);

  try {
    const source = fs.readFileSync(metaPath, "utf8");
    vm.runInContext(source, sandbox, {
      filename: metaPath,
      timeout: 1000,
    });
  } catch (error) {
    addError("Metadata", `assets/js/content-meta.js cannot be inspected safely: ${error.message}`);
    return null;
  }

  if (!isPlainObject(sandbox.window.MYLOTOPI_GUIDE_META)) {
    addError("Metadata", "MYLOTOPI_GUIDE_META was not exported as an object.");
    return null;
  }

  return sandbox.window.MYLOTOPI_GUIDE_META;
}

function validateLanguageRegistry(meta) {
  const activeLanguages = Array.isArray(meta.languages) ? meta.languages : [];
  const stagedLanguages = Array.isArray(meta.stagedLanguages) ? meta.stagedLanguages : [];
  const contentDirectory = path.join(repoRoot, "assets/content");
  const contentLanguages = listDirectories(contentDirectory);
  const registeredLanguages = new Set([...activeLanguages, ...stagedLanguages]);

  if (!activeLanguages.length) {
    addError("Languages", "MYLOTOPI_GUIDE_META.languages must list at least one active runtime language.");
  }

  findDuplicates(activeLanguages).forEach((lang) => {
    addError("Languages", `Active language is listed more than once: ${lang}`);
  });

  findDuplicates(stagedLanguages).forEach((lang) => {
    addError("Languages", `Staged language is listed more than once: ${lang}`);
  });

  activeLanguages.forEach((lang) => {
    if (stagedLanguages.includes(lang)) {
      addError("Languages", `Language cannot be both active and staged: ${lang}`);
    }
  });

  if (meta.defaultLanguage && !activeLanguages.includes(meta.defaultLanguage)) {
    addError("Languages", `Default language is not active: ${meta.defaultLanguage}`);
  }

  contentLanguages.forEach((lang) => {
    if (!registeredLanguages.has(lang)) {
      addError("Languages", `Content folder is neither active nor staged in content-meta.js: assets/content/${lang}`);
    }
  });

  stagedLanguages.forEach((lang) => {
    if (!contentLanguages.includes(lang)) {
      addWarning("Languages", `Staged language has no content folder yet: ${lang}`);
    }
  });

  if (stagedLanguages.length) {
    addWarning("Languages", `Staged language folders are documented but not runtime-active: ${stagedLanguages.join(", ")}`);
  }

  return activeLanguages;
}

function validateSpots(meta) {
  const spotOrder = Array.isArray(meta.spotOrder) ? meta.spotOrder : [];
  const spots = isPlainObject(meta.spots) ? meta.spots : {};

  if (!spotOrder.length) {
    addError("Spots", "spotOrder must contain at least one canonical spot id.");
  }

  findDuplicates(spotOrder).forEach((spotId) => {
    addError("Spots", `spotOrder contains a duplicate spot id: ${spotId}`);
  });

  spotOrder.forEach((spotId) => {
    if (!isPlainObject(spots[spotId])) {
      addError("Spots", `spotOrder references a missing spot: ${spotId}`);
    }
  });

  Object.keys(spots).forEach((spotId) => {
    if (!spotOrder.includes(spotId)) {
      addWarning("Spots", `Spot exists in metadata but is not in spotOrder: ${spotId}`);
    }
  });

  spotOrder.forEach((spotId) => {
    const spot = spots[spotId];
    if (!isPlainObject(spot)) {
      return;
    }

    if (!Array.isArray(spot.images)) {
      addError("Images", `${spotId} must define images as an array.`);
      return;
    }

    if (!spot.images.length) {
      addWarning("Images", `${spotId} has images: []; the runtime placeholder will be shown intentionally.`);
      return;
    }

    spot.images.forEach((image, imageIndex) => {
      const label = `${spotId} image ${imageIndex + 1}`;

      if (!isPlainObject(image)) {
        addError("Images", `${label} must be an object with a src value.`);
        return;
      }

      assertFileExists(image.src, "Images", `${label} src`);

      if (image.fit && !validFits.has(image.fit)) {
        addError("Images", `${label} has invalid fit "${image.fit}". Use "cover" or "contain".`);
      }

      if (image.position && (typeof image.position !== "string" || !sanePositionPattern.test(image.position.trim()))) {
        addError("Images", `${label} has an unsafe or invalid position value: ${image.position}`);
      }
    });
  });

  return spotOrder;
}

function validateAudio(manifest, lang, spotId) {
  const audio = manifest.audio || {};

  if (audio.ready !== true) {
    return;
  }

  const audioPath = assertFileExists(audio.path, "Audio", `${lang}/${spotId} audio.path`);
  if (!audioPath) {
    return;
  }

  if (fs.statSync(audioPath).size === 0) {
    addError("Audio", `${lang}/${spotId} audio file is zero bytes: ${audio.path}`);
  }
}

function validateSectionFields(section, lang, spotId, sectionPath) {
  ["title", "navigationTitle", "preview"].forEach((field) => {
    if (typeof section[field] !== "string" || !section[field].trim()) {
      addError("Content", `${lang}/${spotId} section ${field} must be a non-empty string: ${formatRelative(sectionPath)}`);
    }
  });

  if (!Array.isArray(section.details) || !section.details.length) {
    addError("Content", `${lang}/${spotId} section details must be a non-empty array: ${formatRelative(sectionPath)}`);
  }
}

function validateLanguageContent(meta, lang, spotOrder) {
  const indexPath = path.join(repoRoot, "assets/content", lang, "index.json");
  const indexLabel = `assets/content/${lang}/index.json`;

  if (!fs.existsSync(indexPath)) {
    addError("Content", `${indexLabel} is missing.`);
    return;
  }

  const index = readJsonFile(indexPath, "Content", indexLabel);
  if (!index) {
    return;
  }

  if (index.code !== lang) {
    addError("Content", `${indexLabel} has code "${index.code}", expected "${lang}".`);
  }

  if (!Array.isArray(index.sections)) {
    addError("Content", `${indexLabel} must define a sections array.`);
    return;
  }

  if (Array.isArray(index.sectionOrder) && !arraysMatch(index.sectionOrder, spotOrder)) {
    addError("Content", `${indexLabel} sectionOrder must match MYLOTOPI_GUIDE_META.spotOrder.`);
  }

  const manifestIds = index.sections.map((section) => section && section.id);
  findDuplicates(manifestIds).forEach((spotId) => {
    addError("Content", `${indexLabel} contains duplicate section manifest id: ${spotId}`);
  });

  const missingSections = spotOrder.filter((spotId) => !manifestIds.includes(spotId));
  const extraSections = manifestIds.filter((spotId) => spotId && !spotOrder.includes(spotId));

  missingSections.forEach((spotId) => {
    addError("Content", `${indexLabel} is missing a section manifest for canonical spot: ${spotId}`);
  });

  extraSections.forEach((spotId) => {
    addError("Content", `${indexLabel} contains a non-canonical section manifest: ${spotId}`);
  });

  const miniMap = index.miniMap || {};
  if (miniMap.path) {
    assertFileExists(miniMap.path, "Mini-maps", `${lang} miniMap.path`);
  }

  if (miniMap.fallback === true) {
    addWarning("Mini-maps", `${lang} uses a documented fallback mini-map.`);
  }

  spotOrder.forEach((spotId) => {
    const manifest = index.sections.find((section) => section && section.id === spotId);
    if (!manifest) {
      return;
    }

    if (typeof manifest.path !== "string" || !manifest.path.trim()) {
      addError("Content", `${indexLabel} manifest for ${spotId} must define a section path.`);
      return;
    }

    const sectionPath = path.join(repoRoot, "assets/content", lang, manifest.path);
    if (!fs.existsSync(sectionPath)) {
      addError("Content", `${lang}/${spotId} section file is missing: assets/content/${lang}/${manifest.path}`);
      return;
    }

    const section = readJsonFile(sectionPath, "Content", `assets/content/${lang}/${manifest.path}`);
    if (!section) {
      return;
    }

    if (section.id !== manifest.id) {
      addError(
        "Content",
        `${lang}/${spotId} section id "${section.id}" does not match manifest id "${manifest.id}": ${formatRelative(sectionPath)}`
      );
    }

    validateSectionFields(section, lang, spotId, sectionPath);
    validateAudio(manifest, lang, spotId);
  });
}

function printFindings(title, collection, log) {
  if (!collection.size) {
    return;
  }

  log(title);
  collection.forEach((messages, group) => {
    log(`\n${group}`);
    messages.forEach((message) => {
      log(`  - ${message}`);
    });
  });
}

const meta = loadGuideMeta();

if (meta) {
  const activeLanguages = validateLanguageRegistry(meta);
  const spotOrder = validateSpots(meta);

  activeLanguages.forEach((lang) => {
    validateLanguageContent(meta, lang, spotOrder);
  });
}

if (errors.size) {
  console.error("Mylotopi content validation failed.");
  printFindings("\nErrors", errors, console.error);
  printFindings("\nWarnings", warnings, console.warn);
  process.exit(1);
}

console.log("Mylotopi content validation passed.");

if (meta) {
  console.log(`Active languages: ${meta.languages.join(", ")}`);
  if (Array.isArray(meta.stagedLanguages) && meta.stagedLanguages.length) {
    console.log(`Staged languages: ${meta.stagedLanguages.join(", ")}`);
  }
}

printFindings("\nWarnings", warnings, console.warn);
