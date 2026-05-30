import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const metaPath = path.join(repoRoot, "assets/js/content-meta.js");
const contentDirectory = path.join(repoRoot, "assets/content");
const validFits = new Set(["cover", "contain"]);
const sanePositionPattern = /^[a-z0-9.%\-\s]+$/i;
const requiredUiFields = [
  "pageTitle",
  "heroTitle",
  "intro",
  "languageLabel",
  "sectionsLabel",
  "audioHeading",
  "readMore",
  "readLess",
  "challengeLabel",
  "previousSection",
  "nextSection",
  "kicker",
  "navigationLabel",
  "currentSectionLabel",
  "miniMapTitle",
  "miniMapDescription",
  "miniMapTapHint",
  "miniMapOpen",
  "miniMapDownload",
  "miniMapModalClose",
  "miniMapImageAlt",
  "sectionSelectorLabel",
  "sectionSelectorPlaceholder",
  "audioTitleLabel",
  "audioAriaLabel",
  "selectedBadge",
  "imagePlaceholderLabel",
  "imagePlaceholderHint",
  "audioFallback",
  "announcerPrefix",
  "galleryPrevious",
  "galleryNext",
  "imageCounter",
  "challengeTitle",
  "previousSectionAria",
  "nextSectionAria",
  "sectionLabelSeparator",
  "loadErrorTitle",
  "loadErrorBody",
];

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

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
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
  const contentFiles = listJsonFiles(contentDirectory);
  const contentLanguageCodes = contentFiles.map((fileName) => fileName.replace(/\.json$/, ""));

  if (!activeLanguages.length) {
    addError("Languages", "MYLOTOPI_GUIDE_META.languages must list at least one active runtime language.");
  }

  findDuplicates(activeLanguages).forEach((lang) => {
    addError("Languages", `Active language is listed more than once: ${lang}`);
  });

  if (meta.defaultLanguage && !activeLanguages.includes(meta.defaultLanguage)) {
    addError("Languages", `Default language is not active: ${meta.defaultLanguage}`);
  }

  activeLanguages.forEach((lang) => {
    const expectedFile = `${lang}.json`;
    if (!contentFiles.includes(expectedFile)) {
      addError("Content", `Active language is missing assets/content/${expectedFile}.`);
    }
  });

  contentLanguageCodes.forEach((lang) => {
    if (!activeLanguages.includes(lang)) {
      addError("Content", `Content file is not listed as active in content-meta.js: assets/content/${lang}.json`);
    }
  });

  return activeLanguages;
}

function validateNoOldContentTree() {
  listDirectories(contentDirectory).forEach((directoryName) => {
    const directoryPath = path.join(contentDirectory, directoryName);
    const oldIndexPath = path.join(directoryPath, "index.json");
    const oldSectionsPath = path.join(directoryPath, "sections");

    if (fs.existsSync(oldIndexPath) || fs.existsSync(oldSectionsPath)) {
      addError(
        "Content",
        `Old content layout is no longer supported. Remove assets/content/${directoryName}/index.json and sections/*.json.`
      );
    } else {
      addWarning("Content", `Unexpected directory remains under assets/content: assets/content/${directoryName}`);
    }
  });

  const localesDirectory = path.join(repoRoot, "assets/locales");
  if (fs.existsSync(localesDirectory)) {
    const localeScripts = fs
      .readdirSync(localesDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"));

    localeScripts.forEach((entry) => {
      addError("Content", `assets/locales/*.js is not part of this architecture: assets/locales/${entry.name}`);
    });
  }
}

function validateSectionsMeta(meta) {
  const sectionOrder = Array.isArray(meta.sectionOrder) ? meta.sectionOrder : [];
  const sections = isPlainObject(meta.sections) ? meta.sections : {};

  if (Object.prototype.hasOwnProperty.call(meta, "spotOrder") || Object.prototype.hasOwnProperty.call(meta, "spots")) {
    addError("Metadata", "Use sectionOrder and sections in content-meta.js; spotOrder/spots belong to the old architecture.");
  }

  if (!sectionOrder.length) {
    addError("Sections", "sectionOrder must contain at least one canonical section id.");
  }

  findDuplicates(sectionOrder).forEach((sectionId) => {
    addError("Sections", `sectionOrder contains a duplicate section id: ${sectionId}`);
  });

  sectionOrder.forEach((sectionId) => {
    if (!isPlainObject(sections[sectionId])) {
      addError("Sections", `sectionOrder references a missing metadata section: ${sectionId}`);
    }
  });

  Object.keys(sections).forEach((sectionId) => {
    if (!sectionOrder.includes(sectionId)) {
      addWarning("Sections", `Section exists in metadata but is not in sectionOrder: ${sectionId}`);
    }
  });

  sectionOrder.forEach((sectionId) => {
    const section = sections[sectionId];
    if (!isPlainObject(section)) {
      return;
    }

    if (typeof section.accent !== "string" || !section.accent.trim()) {
      addError("Sections", `${sectionId} must define an accent color.`);
    }

    if (typeof section.accentSoft !== "string" || !section.accentSoft.trim()) {
      addError("Sections", `${sectionId} must define an accentSoft color.`);
    }

    if (!Array.isArray(section.images)) {
      addError("Images", `${sectionId} must define images as an array.`);
      return;
    }

    if (!section.images.length) {
      addWarning("Images", `${sectionId} has images: []; the runtime placeholder will be shown intentionally.`);
      return;
    }

    section.images.forEach((image, imageIndex) => {
      const label = `${sectionId} image ${imageIndex + 1}`;

      if (!isPlainObject(image)) {
        addError("Images", `${label} must be an object with a src value.`);
        return;
      }

      if (Object.prototype.hasOwnProperty.call(image, "alt")) {
        addError("Images", `${label} must not contain localized alt text; keep imageAlt in assets/content/{lang}.json.`);
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

  return sectionOrder;
}

function validateTextField(value, group, label) {
  if (typeof value !== "string" || !value.trim()) {
    addError(group, `${label} must be a non-empty string.`);
  }
}

function validateUi(content, lang, contentPath) {
  if (!isPlainObject(content.ui)) {
    addError("Content", `${formatRelative(contentPath)} must define a ui object.`);
    return;
  }

  requiredUiFields.forEach((field) => {
    validateTextField(content.ui[field], "Content", `${lang} ui.${field}`);
  });
}

function validateDetails(details, lang, sectionId) {
  if (!Array.isArray(details) || !details.length) {
    addError("Content", `${lang}/${sectionId} details must be a non-empty array.`);
    return;
  }

  details.forEach((block, index) => {
    const label = `${lang}/${sectionId} details[${index}]`;
    if (typeof block === "string") {
      if (!block.trim()) {
        addError("Content", `${label} must not be an empty string.`);
      }
      return;
    }

    if (!isPlainObject(block)) {
      addError("Content", `${label} must be a string or structured object.`);
      return;
    }

    if (block.type === "heading") {
      validateTextField(block.text, "Content", `${label}.text`);
      return;
    }

    if (block.type === "list") {
      if (!Array.isArray(block.items) || !block.items.length) {
        addError("Content", `${label}.items must be a non-empty array.`);
      }
      return;
    }

    if (!block.text) {
      addError("Content", `${label} has an unsupported detail block shape.`);
    }
  });
}

function validateAudio(section, lang, sectionId) {
  const audio = section.audio || {};

  if (!isPlainObject(audio)) {
    addError("Audio", `${lang}/${sectionId} audio must be an object.`);
    return;
  }

  if (audio.ready !== true) {
    return;
  }

  const audioPath = assertFileExists(audio.path, "Audio", `${lang}/${sectionId} audio.path`);
  if (!audioPath) {
    return;
  }

  if (fs.statSync(audioPath).size === 0) {
    addError("Audio", `${lang}/${sectionId} audio file is zero bytes: ${audio.path}`);
  }
}

function validateMiniMap(content, lang) {
  const miniMap = content.miniMap || {};
  if (!miniMap.path) {
    return;
  }

  assertFileExists(miniMap.path, "Mini-maps", `${lang} miniMap.path`);

  if (miniMap.fallback === true) {
    addWarning("Mini-maps", `${lang} uses a documented fallback mini-map.`);
  }
}

function validateLanguageContent(lang, sectionOrder) {
  const contentPath = path.join(contentDirectory, `${lang}.json`);
  const contentLabel = `assets/content/${lang}.json`;

  if (!fs.existsSync(contentPath)) {
    addError("Content", `${contentLabel} is missing.`);
    return;
  }

  const content = readJsonFile(contentPath, "Content", contentLabel);
  if (!content) {
    return;
  }

  if (content.code !== lang) {
    addError("Content", `${contentLabel} has code "${content.code}", expected "${lang}".`);
  }

  validateTextField(content.nativeName, "Content", `${lang} nativeName`);
  validateUi(content, lang, contentPath);
  validateMiniMap(content, lang);

  if (!Array.isArray(content.sections)) {
    addError("Content", `${contentLabel} must define a sections array.`);
    return;
  }

  const sectionIds = content.sections.map((section) => section && section.id);
  findDuplicates(sectionIds).forEach((sectionId) => {
    addError("Content", `${contentLabel} contains duplicate section id: ${sectionId}`);
  });

  if (!arraysMatch(sectionIds, sectionOrder)) {
    addError("Content", `${contentLabel} sections must match MYLOTOPI_GUIDE_META.sectionOrder exactly.`);
  }

  content.sections.forEach((section, index) => {
    const expectedSectionId = sectionOrder[index];
    const sectionId = section && section.id ? section.id : expectedSectionId || `index ${index}`;

    if (!isPlainObject(section)) {
      addError("Content", `${lang} section ${index + 1} must be an object.`);
      return;
    }

    if (section.id !== expectedSectionId) {
      addError("Content", `${lang} section ${index + 1} id "${section.id}" must be "${expectedSectionId}".`);
    }

    ["id", "title", "navigationTitle", "preview"].forEach((field) => {
      validateTextField(section[field], "Content", `${lang}/${sectionId} ${field}`);
    });

    validateDetails(section.details, lang, sectionId);
    validateAudio(section, lang, sectionId);
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

validateNoOldContentTree();
const meta = loadGuideMeta();

if (meta) {
  const activeLanguages = validateLanguageRegistry(meta);
  const sectionOrder = validateSectionsMeta(meta);

  activeLanguages.forEach((lang) => {
    validateLanguageContent(lang, sectionOrder);
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
}

printFindings("\nWarnings", warnings, console.warn);
