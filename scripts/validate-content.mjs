import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "assets", "content");
const META_PATH = path.join(ROOT, "assets", "js", "content-meta.js");
const VALIDATOR_PATH = path.join(ROOT, "scripts", "validate-content.mjs");
const EXPECTED_LANGUAGES = ["en", "el", "de", "fr", "it", "es", "nl", "pl", "ru", "tr"];
const EXPECTED_SECTION_ORDER = [
  "welcome",
  "herb-garden",
  "windmill-base",
  "sleeping-area",
  "machinery",
  "threshing-floor-donkeys",
  "cellar-italian-tunnel",
  "traditional-house",
  "bakery",
];
const REQUIRED_UI_KEYS = [
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
const REMOVED_UI_KEYS = [
  ["mini", "Map", "Download"].join(""),
  ["mini", "Map", "View"].join(""),
];
const STALE_SECTION_IDS = [
  ["windmill", "first", "floor"].join("-"),
  ["windmill", "second", "floor"].join("-"),
  ["windmill", "third", "floor"].join("-"),
];
const LEGACY_STOP_PARAM = "sp" + "ot";
const SOURCE_TEXTS_NAME = ["source", "texts"].join("-");
const OLD_QR_COPY = ["QR code", "opens"].join(" ");
const TEXT_FILE_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".txt"]);

const errors = {
  content: [],
  ui: [],
  sections: [],
  assets: [],
  runtime: [],
};

function addError(group, message) {
  errors[group].push(message);
}

function formatRelative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function unique(values) {
  return Array.from(new Set(values));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addError("content", `${formatRelative(filePath)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function readMetadata() {
  try {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(META_PATH, "utf8"), sandbox, {
      filename: META_PATH,
    });
    return sandbox.window.MYLOTOPI_GUIDE_META || null;
  } catch (error) {
    addError("runtime", `${formatRelative(META_PATH)} could not be evaluated: ${error.message}`);
    return null;
  }
}

function resolveAssetPath(assetPath) {
  if (typeof assetPath !== "string" || !assetPath.trim()) {
    return null;
  }

  if (!assetPath.startsWith("./")) {
    return null;
  }

  return path.join(ROOT, ...assetPath.slice(2).split("/"));
}

function assertAssetExists(assetPath, owner, group = "assets") {
  const resolvedPath = resolveAssetPath(assetPath);

  if (!resolvedPath) {
    addError(group, `${owner} has a non-relative asset path: ${String(assetPath)}`);
    return null;
  }

  if (!fs.existsSync(resolvedPath)) {
    addError(group, `${owner} references missing asset ${assetPath}`);
  }

  return resolvedPath;
}

function expectObject(value, owner, group) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    addError(group, `${owner} must be an object.`);
    return false;
  }
  return true;
}

function expectString(value, owner, group) {
  if (typeof value !== "string" || !value.trim()) {
    addError(group, `${owner} must be a non-empty string.`);
    return false;
  }
  return true;
}

function expectArray(value, owner, group) {
  if (!Array.isArray(value)) {
    addError(group, `${owner} must be an array.`);
    return false;
  }
  return true;
}

function validateCopyItem(item, owner) {
  if (typeof item === "string") {
    expectString(item, owner, "sections");
    return;
  }

  if (!expectObject(item, owner, "sections")) {
    return;
  }

  const hasLabel = Object.prototype.hasOwnProperty.call(item, "label");
  const hasText = Object.prototype.hasOwnProperty.call(item, "text");

  if (hasLabel) {
    expectString(item.label, `${owner}.label`, "sections");
  }

  if (hasText) {
    expectString(item.text, `${owner}.text`, "sections");
  }

  if (!hasLabel && !hasText) {
    addError("sections", `${owner} must contain label or text.`);
  }
}

function validateDetails(details, owner) {
  if (!expectArray(details, owner, "sections")) {
    return;
  }

  details.forEach((block, index) => {
    const blockOwner = `${owner}[${index}]`;

    if (typeof block === "string") {
      expectString(block, blockOwner, "sections");
      return;
    }

    if (!expectObject(block, blockOwner, "sections")) {
      return;
    }

    if (block.type === "heading") {
      expectString(block.text, `${blockOwner}.text`, "sections");
      return;
    }

    if (block.type === "list") {
      if (!expectArray(block.items, `${blockOwner}.items`, "sections")) {
        return;
      }
      block.items.forEach((item, itemIndex) => validateCopyItem(item, `${blockOwner}.items[${itemIndex}]`));
      return;
    }

    if (Object.prototype.hasOwnProperty.call(block, "text")) {
      expectString(block.text, `${blockOwner}.text`, "sections");
      return;
    }

    addError("sections", `${blockOwner} must be a text block, heading, or list.`);
  });
}

function validateChallenge(challenge, owner) {
  if (challenge == null) {
    return;
  }

  if (!expectObject(challenge, owner, "sections")) {
    return;
  }

  ["label", "title", "intro"].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(challenge, key)) {
      expectString(challenge[key], `${owner}.${key}`, "sections");
    }
  });

  if (!expectArray(challenge.items, `${owner}.items`, "sections")) {
    return;
  }

  challenge.items.forEach((item, index) => validateCopyItem(item, `${owner}.items[${index}]`));
}

function validateAudio(audio, owner, lang, sectionIndex) {
  if (!expectObject(audio, owner, "sections")) {
    return;
  }

  expectString(audio.path, `${owner}.path`, "sections");
  if (audio.path) {
    assertAssetExists(audio.path, `${owner}.path`);
  }

  if (Object.prototype.hasOwnProperty.call(audio, "ready") && typeof audio.ready !== "boolean") {
    addError("sections", `${owner}.ready must be a boolean when present.`);
  }

  if (Object.prototype.hasOwnProperty.call(audio, "caption")) {
    expectString(audio.caption, `${owner}.caption`, "sections");
  }

  const expectedPath = `./assets/audio/${lang}/section-${String(sectionIndex + 1).padStart(2, "0")}.mp3`;
  if (audio.path !== expectedPath) {
    addError("assets", `${owner}.path should be ${expectedPath}, got ${audio.path || "<empty>"}.`);
  }
}

function validateContentFiles(meta) {
  const contentFiles = fs.existsSync(CONTENT_DIR)
    ? fs.readdirSync(CONTENT_DIR).filter((fileName) => fileName.endsWith(".json")).sort()
    : [];

  if (!contentFiles.length) {
    addError("content", "No content JSON files found.");
    return new Map();
  }

  const contentByLanguage = new Map();

  contentFiles.forEach((fileName) => {
    const filePath = path.join(CONTENT_DIR, fileName);
    const lang = path.basename(fileName, ".json");
    const content = readJson(filePath);
    if (!content) {
      return;
    }

    if (content.code !== lang) {
      addError("content", `${formatRelative(filePath)} has code ${content.code || "<missing>"} but filename is ${lang}.`);
    }

    contentByLanguage.set(lang, content);
  });

  const fileLanguages = contentFiles.map((fileName) => path.basename(fileName, ".json")).sort();
  const metaLanguages = Array.isArray(meta.languages) ? meta.languages.slice().sort() : [];

  metaLanguages.forEach((lang) => {
    if (!contentByLanguage.has(lang)) {
      addError("content", `Language ${lang} is listed in metadata but has no content JSON file.`);
    }
  });

  fileLanguages.forEach((lang) => {
    if (!metaLanguages.includes(lang)) {
      addError("content", `${lang}.json is not listed as an active metadata language.`);
    }
  });

  if (!arraysEqual(metaLanguages, EXPECTED_LANGUAGES.slice().sort())) {
    addError("content", `Active languages changed. Expected ${EXPECTED_LANGUAGES.join(", ")}; got ${metaLanguages.join(", ")}.`);
  }

  return contentByLanguage;
}

function validateMetadata(meta) {
  if (!expectObject(meta, "content metadata", "runtime")) {
    return;
  }

  if (!arraysEqual(meta.languages || [], EXPECTED_LANGUAGES)) {
    addError("runtime", `metadata.languages must be ${EXPECTED_LANGUAGES.join(", ")}.`);
  }

  if (!arraysEqual(meta.sectionOrder || [], EXPECTED_SECTION_ORDER)) {
    addError("runtime", `metadata.sectionOrder must be ${EXPECTED_SECTION_ORDER.join(", ")}.`);
  }

  if (!expectObject(meta.sections, "metadata.sections", "runtime")) {
    return;
  }

  const metadataSectionIds = Object.keys(meta.sections);
  const extraMetadataSections = metadataSectionIds.filter((sectionId) => !EXPECTED_SECTION_ORDER.includes(sectionId));
  const missingMetadataSections = EXPECTED_SECTION_ORDER.filter((sectionId) => !metadataSectionIds.includes(sectionId));

  extraMetadataSections.forEach((sectionId) => addError("runtime", `metadata.sections has unsupported id ${sectionId}.`));
  missingMetadataSections.forEach((sectionId) => addError("runtime", `metadata.sections is missing ${sectionId}.`));

  EXPECTED_SECTION_ORDER.forEach((sectionId) => {
    const sectionMeta = meta.sections[sectionId];
    if (!expectObject(sectionMeta, `metadata.sections.${sectionId}`, "runtime")) {
      return;
    }

    expectString(sectionMeta.accent, `metadata.sections.${sectionId}.accent`, "runtime");
    expectString(sectionMeta.accentSoft, `metadata.sections.${sectionId}.accentSoft`, "runtime");

    if (!expectArray(sectionMeta.images, `metadata.sections.${sectionId}.images`, "runtime")) {
      return;
    }

    sectionMeta.images.forEach((image, index) => {
      const owner = `metadata.sections.${sectionId}.images[${index}]`;

      if (typeof image === "string") {
        assertAssetExists(image, owner);
        return;
      }

      if (!expectObject(image, owner, "runtime")) {
        return;
      }

      expectString(image.src, `${owner}.src`, "runtime");
      assertAssetExists(image.src, `${owner}.src`);

      if (Object.prototype.hasOwnProperty.call(image, "fit") && !["cover", "contain"].includes(image.fit)) {
        addError("runtime", `${owner}.fit must be cover or contain.`);
      }

      if (Object.prototype.hasOwnProperty.call(image, "position")) {
        expectString(image.position, `${owner}.position`, "runtime");
      }
    });
  });
}

function validateUi(contentByLanguage) {
  for (const [lang, content] of contentByLanguage.entries()) {
    const owner = `${lang}.json.ui`;
    if (!expectObject(content.ui, owner, "ui")) {
      continue;
    }

    REMOVED_UI_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(content.ui, key)) {
        addError("ui", `${owner}.${key} is unused and must be removed.`);
      }
    });

    REQUIRED_UI_KEYS.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(content.ui, key)) {
        addError("ui", `${owner}.${key} is required.`);
        return;
      }
      expectString(content.ui[key], `${owner}.${key}`, "ui");
    });

    Object.keys(content.ui)
      .filter((key) => !REQUIRED_UI_KEYS.includes(key) && !REMOVED_UI_KEYS.includes(key))
      .forEach((key) => addError("ui", `${owner}.${key} is not used by the renderer.`));
  }

  const keySignatures = new Map();
  for (const [lang, content] of contentByLanguage.entries()) {
    if (!content.ui || typeof content.ui !== "object") {
      continue;
    }
    const signature = Object.keys(content.ui).sort().join("|");
    keySignatures.set(signature, [...(keySignatures.get(signature) || []), lang]);
  }

  if (keySignatures.size > 1) {
    addError("ui", `Languages do not share identical ui keys: ${Array.from(keySignatures.values()).map((langs) => langs.join(",")).join(" / ")}.`);
  }
}

function validateSections(contentByLanguage, meta) {
  for (const [lang, content] of contentByLanguage.entries()) {
    const owner = `${lang}.json.sections`;

    if (!expectArray(content.sections, owner, "sections")) {
      continue;
    }

    const ids = content.sections.map((section) => (section && section.id ? section.id : "<missing>"));
    if (!arraysEqual(ids, EXPECTED_SECTION_ORDER)) {
      addError("sections", `${owner} order must be ${EXPECTED_SECTION_ORDER.join(", ")}; got ${ids.join(", ")}.`);
    }

    if (!arraysEqual(ids, meta.sectionOrder || [])) {
      addError("sections", `${owner} does not match metadata.sectionOrder.`);
    }

    if (unique(ids).length !== ids.length) {
      addError("sections", `${owner} contains duplicate ids.`);
    }

    content.sections.forEach((section, index) => {
      const sectionOwner = `${owner}[${index}]`;
      if (!expectObject(section, sectionOwner, "sections")) {
        return;
      }

      ["id", "title", "navigationTitle", "preview"].forEach((key) => {
        expectString(section[key], `${sectionOwner}.${key}`, "sections");
      });

      validateDetails(section.details, `${sectionOwner}.details`);
      validateAudio(section.audio, `${sectionOwner}.audio`, lang, index);
      validateChallenge(section.challenge, `${sectionOwner}.challenge`);

      if (Object.prototype.hasOwnProperty.call(section, "imageAlt")) {
        expectString(section.imageAlt, `${sectionOwner}.imageAlt`, "sections");
      }
    });
  }
}

function validateMiniMaps(contentByLanguage) {
  const miniMapPathsByLanguage = new Map();

  for (const [lang, content] of contentByLanguage.entries()) {
    const owner = `${lang}.json.miniMap`;

    if (!expectObject(content.miniMap, owner, "assets")) {
      continue;
    }

    Object.keys(content.miniMap)
      .filter((key) => key !== "path")
      .forEach((key) => addError("assets", `${owner}.${key} is unsupported.`));

    expectString(content.miniMap.path, `${owner}.path`, "assets");
    const miniMapPath = assertAssetExists(content.miniMap.path, `${owner}.path`);
    if (miniMapPath) {
      miniMapPathsByLanguage.set(lang, miniMapPath);
    }
  }

  const trPath = miniMapPathsByLanguage.get("tr");
  const enPath = miniMapPathsByLanguage.get("en");
  if (trPath && enPath && fs.existsSync(trPath) && fs.existsSync(enPath)) {
    const trHash = crypto.createHash("sha256").update(fs.readFileSync(trPath)).digest("hex");
    const enHash = crypto.createHash("sha256").update(fs.readFileSync(enPath)).digest("hex");
    if (trHash === enHash) {
      addError("assets", "tr.json.miniMap.path points to the same image bytes as en.json; Turkish minimap needs an explicit current asset.");
    }
  }
}

function validateRequiredAudioFiles(meta) {
  const languages = Array.isArray(meta.languages) ? meta.languages : [];

  languages.forEach((lang) => {
    for (let index = 1; index <= EXPECTED_SECTION_ORDER.length; index += 1) {
      const fileName = `section-${String(index).padStart(2, "0")}.mp3`;
      const audioPath = path.join(ROOT, "assets", "audio", lang, fileName);
      if (!fs.existsSync(audioPath)) {
        addError("assets", `Missing required audio file assets/audio/${lang}/${fileName}.`);
      }
    }
  });
}

function collectTextFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") {
        return;
      }
      results.push(...collectTextFiles(fullPath));
      return;
    }

    if (entry.isFile() && TEXT_FILE_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  });

  return results;
}

function validateRuntimeReferences() {
  const sourceTextsPath = path.join(ROOT, SOURCE_TEXTS_NAME);
  if (fs.existsSync(sourceTextsPath)) {
    addError("runtime", `${SOURCE_TEXTS_NAME}/ must not exist in the public website tree.`);
  }

  const textFiles = collectTextFiles(ROOT).filter((filePath) => path.resolve(filePath) !== VALIDATOR_PATH);
  const staleNeedles = [...STALE_SECTION_IDS, SOURCE_TEXTS_NAME, OLD_QR_COPY, ...REMOVED_UI_KEYS];

  textFiles.forEach((filePath) => {
    const relativePath = formatRelative(filePath);
    const text = fs.readFileSync(filePath, "utf8");

    staleNeedles.forEach((needle) => {
      if (text.includes(needle)) {
        addError("runtime", `${relativePath} contains stale reference ${needle}.`);
      }
    });
  });

  const runtimeFiles = [
    path.join(ROOT, "index.html"),
    path.join(ROOT, "assets", "css", "main.css"),
    path.join(ROOT, "assets", "js", "app.js"),
    path.join(ROOT, "assets", "js", "content-meta.js"),
    path.join(ROOT, "assets", "js", "i18n.js"),
  ];
  const legacyParamPattern = new RegExp(`\\b${escapeRegExp(LEGACY_STOP_PARAM)}\\b|${escapeRegExp(LEGACY_STOP_PARAM)}[-_]`, "i");

  runtimeFiles.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      addError("runtime", `${formatRelative(filePath)} is missing.`);
      return;
    }

    const text = fs.readFileSync(filePath, "utf8");
    if (legacyParamPattern.test(text)) {
      addError("runtime", `${formatRelative(filePath)} still contains the legacy URL parameter/name ${LEGACY_STOP_PARAM}.`);
    }
  });
}

function printResults() {
  const failedGroups = Object.entries(errors).filter(([, groupErrors]) => groupErrors.length);

  if (!failedGroups.length) {
    console.log(`Mylotopi content validation passed: ${EXPECTED_LANGUAGES.length} languages, ${EXPECTED_SECTION_ORDER.length} sections, assets verified.`);
    return;
  }

  console.error("Mylotopi content validation failed:");
  failedGroups.forEach(([group, groupErrors]) => {
    console.error(`\n${group.toUpperCase()}`);
    groupErrors.forEach((message) => {
      console.error(`- ${message}`);
    });
  });
  process.exitCode = 1;
}

const meta = readMetadata();

if (meta) {
  validateMetadata(meta);
  const contentByLanguage = validateContentFiles(meta);
  validateUi(contentByLanguage);
  validateSections(contentByLanguage, meta);
  validateMiniMaps(contentByLanguage);
  validateRequiredAudioFiles(meta);
}

validateRuntimeReferences();
printResults();
