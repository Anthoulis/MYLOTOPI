(function () {
  const guideData = window.MYLOTOPI_QR_GUIDE_CONTENT;

  if (!guideData) {
    throw new Error("Mylotopi QR guide content is missing.");
  }

  const DEFAULT_LANG = guideData.defaultLanguage;
  const SPOT_ORDER = guideData.spots.map(function (spot) {
    return spot.id;
  });
  const SUPPORTED_LANGUAGES = guideData.supportedLanguages.slice();
  const LANG_MAP = Object.assign({}, guideData.languageAliases);
  const REDUCED_MOTION_QUERY = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    lang: DEFAULT_LANG,
    activeSpot: null,
    shouldNormalizeUrl: false,
  };

  const elements = {
    kicker: document.getElementById("guide-kicker"),
    title: document.getElementById("guide-title"),
    intro: document.getElementById("guide-intro"),
    languageLabel: document.getElementById("guide-language-label"),
    spotsLabel: document.getElementById("guide-spots-label"),
    languageSwitcher: document.getElementById("language-switcher"),
    spotNav: document.getElementById("spot-nav"),
    main: document.getElementById("guide-main"),
    announcer: document.getElementById("guide-announcer"),
  };

  function normalizeLang(value) {
    if (!value) {
      return null;
    }

    const key = value.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
    return LANG_MAP[key] || null;
  }

  function normalizeSpot(value) {
    if (!value) {
      return null;
    }

    const key = value.toString().trim().toLowerCase();
    return SPOT_ORDER.includes(key) ? key : null;
  }

  function getUiForLanguage(lang) {
    return guideData.ui[lang] || guideData.ui[DEFAULT_LANG] || guideData.ui.en;
  }

  function getUi() {
    return getUiForLanguage(state.lang);
  }

  function getSpot(id) {
    return guideData.spots.find(function (spot) {
      return spot.id === id;
    }) || null;
  }

  function getFirstAvailableTranslation(translations) {
    return (
      SUPPORTED_LANGUAGES.map(function (lang) {
        return translations[lang];
      }).find(Boolean) ||
      Object.values(translations)[0] ||
      null
    );
  }

  function resolveTranslation(spot, requestedLang) {
    const translations = spot && spot.translations ? spot.translations : {};
    const baseTranslation =
      translations[DEFAULT_LANG] ||
      getFirstAvailableTranslation(translations) ||
      {};
    const requestedTranslation = translations[requestedLang] || {};

    return Object.assign({}, baseTranslation, requestedTranslation, {
      body: Array.isArray(requestedTranslation.body)
        ? requestedTranslation.body
        : Array.isArray(baseTranslation.body)
          ? baseTranslation.body
          : [],
    });
  }

  function resolveShortTitle(spot, requestedLang) {
    const translation = resolveTranslation(spot, requestedLang);
    return translation ? translation.shortTitle || translation.title : "";
  }

  function resolveImageAlt(spot, requestedLang) {
    const imageAlt = spot.imageAlt || {};
    return (
      imageAlt[requestedLang] ||
      imageAlt[DEFAULT_LANG] ||
      SUPPORTED_LANGUAGES.map(function (lang) {
        return imageAlt[lang];
      }).find(Boolean) ||
      resolveShortTitle(spot, requestedLang)
    );
  }

  function resolveAudioPath(spot, requestedLang) {
    const translation = resolveTranslation(spot, requestedLang);
    if (translation && translation.audioPath && translation.audioReady !== false) {
      return translation.audioPath;
    }

    const defaultTranslation = spot.translations[DEFAULT_LANG];
    if (defaultTranslation && defaultTranslation.audioPath) {
      return defaultTranslation.audioPath;
    }

    const fallbackTranslation = Object.values(spot.translations).find(function (candidate) {
      return candidate && candidate.audioPath;
    });

    return fallbackTranslation ? fallbackTranslation.audioPath : "";
  }

  function resolveAudioMimeType(audioPath) {
    const normalizedPath = (audioPath || "").toLowerCase();

    if (normalizedPath.endsWith(".mp3")) {
      return "audio/mpeg";
    }

    if (normalizedPath.endsWith(".ogg")) {
      return "audio/ogg";
    }

    if (normalizedPath.endsWith(".m4a")) {
      return "audio/mp4";
    }

    if (normalizedPath.endsWith(".wav")) {
      return "audio/wav";
    }

    return "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderParagraphs(paragraphs) {
    return (paragraphs || [])
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph) + "</p>";
      })
      .join("");
  }

  function renderLanguageButtons() {
    const ui = getUi();

    elements.languageSwitcher.innerHTML = SUPPORTED_LANGUAGES.map(function (langKey) {
      const pressed = langKey === state.lang;
      const uiLabel =
        ui.languageNames[langKey] ||
        getUiForLanguage(DEFAULT_LANG).languageNames[langKey] ||
        langKey.toUpperCase();

      return (
        '<button class="guide-lang-button" type="button" data-lang="' +
        langKey +
        '" aria-pressed="' +
        String(pressed) +
        '" aria-current="' +
        (pressed ? "true" : "false") +
        '">' +
        escapeHtml(uiLabel) +
        "</button>"
      );
    }).join("");
  }

  function renderSpotNav() {
    elements.spotNav.innerHTML = guideData.spots
      .map(function (spot) {
        const pressed = spot.id === state.activeSpot;

        return (
          '<button class="guide-spot-chip" type="button" data-spot="' +
          spot.id +
          '" aria-pressed="' +
          String(pressed) +
          '" aria-current="' +
          (pressed ? "location" : "false") +
          '" style="--chip-accent:' +
          spot.accent +
          ";--chip-accent-deep:" +
          spot.accent +
          ';">' +
          escapeHtml(resolveShortTitle(spot, state.lang)) +
          "</button>"
        );
      })
      .join("");
  }

  function renderSections() {
    const ui = getUi();

    elements.main.innerHTML = guideData.spots
      .map(function (spot, index) {
        const translation = resolveTranslation(spot, state.lang);
        const audioSrc = resolveAudioPath(spot, state.lang);
        const audioMimeType = resolveAudioMimeType(audioSrc);
        const isActive = state.activeSpot === spot.id;
        const sectionIndex = String(index + 1).padStart(2, "0");
        const shortTitle = translation.shortTitle || translation.title;
        const bodyMarkup = renderParagraphs(translation.body);
        const mediaMarkup = spot.imageSrc
          ? '<div class="guide-media-frame"><img src="' +
            escapeHtml(spot.imageSrc) +
            '" alt="' +
            escapeHtml(resolveImageAlt(spot, state.lang)) +
            '"></div>'
          : '<div class="guide-media-frame is-placeholder" role="img" aria-label="' +
            escapeHtml(resolveImageAlt(spot, state.lang)) +
            '"><div class="guide-media-placeholder"><span class="guide-media-placeholder-label">' +
            escapeHtml(ui.imagePlaceholderLabel) +
            "</span><strong>" +
            escapeHtml(shortTitle) +
            "</strong><span>" +
            escapeHtml(ui.imagePlaceholderHint) +
            "</span></div></div>";

        const audioMarkup = audioSrc
          ? '<audio class="guide-audio-player" controls preload="none" aria-label="' +
            escapeHtml(ui.audioHeading + ": " + translation.title) +
            '"><source src="' +
            escapeHtml(audioSrc) +
            '"' +
            (audioMimeType ? ' type="' + escapeHtml(audioMimeType) + '"' : "") +
            "></audio>"
          : '<p class="guide-audio-fallback">' + escapeHtml(ui.audioFallback) + "</p>";

        return (
          '<article class="guide-section' +
          (isActive ? " is-active" : "") +
          '" id="spot-' +
          spot.id +
          '" data-spot="' +
          spot.id +
          '" tabindex="-1" style="--section-accent:' +
          spot.accent +
          ";--section-accent-soft:" +
          spot.accentSoft +
          ';">' +
          '<div class="guide-section-top">' +
          '<div class="guide-section-meta">' +
          '<span class="guide-section-index">' +
          sectionIndex +
          "</span>" +
          (isActive ? '<span class="guide-selected-pill">' + escapeHtml(ui.selectedBadge) + "</span>" : "") +
          "</div>" +
          '<h2 class="guide-section-title">' +
          escapeHtml(translation.title) +
          "</h2>" +
          '<p class="guide-section-description">' +
          escapeHtml(translation.shortText) +
          "</p>" +
          "</div>" +
          mediaMarkup +
          '<section class="guide-audio-card" aria-label="' +
          escapeHtml(ui.audioHeading) +
          '">' +
          '<p class="guide-audio-heading">' +
          escapeHtml(ui.audioHeading) +
          "</p>" +
          (translation.audioCaption
            ? '<p class="guide-audio-caption">' + escapeHtml(translation.audioCaption) + "</p>"
            : "") +
          audioMarkup +
          (spot.placeholderAudio
            ? '<p class="guide-audio-placeholder">' + escapeHtml(ui.audioPlaceholderNotice) + "</p>"
            : "") +
          "</section>" +
          (bodyMarkup ? '<div class="guide-copy">' + bodyMarkup + "</div>" : "") +
          "</article>"
        );
      })
      .join("");
  }

  function syncActiveState() {
    const sections = elements.main.querySelectorAll(".guide-section");
    const chips = elements.spotNav.querySelectorAll(".guide-spot-chip");
    const ui = getUi();

    sections.forEach(function (section) {
      const isActive = section.dataset.spot === state.activeSpot;
      section.classList.toggle("is-active", isActive);

      const badge = section.querySelector(".guide-selected-pill");
      if (isActive && !badge) {
        const meta = section.querySelector(".guide-section-meta");
        const badgeElement = document.createElement("span");
        badgeElement.className = "guide-selected-pill";
        badgeElement.textContent = ui.selectedBadge;
        meta.appendChild(badgeElement);
      }

      if (!isActive && badge) {
        badge.remove();
      }
    });

    chips.forEach(function (chip) {
      const isActive = chip.dataset.spot === state.activeSpot;
      chip.setAttribute("aria-pressed", String(isActive));
      chip.setAttribute("aria-current", isActive ? "location" : "false");
    });
  }

  function updateUrl() {
    const url = new URL(window.location.href);

    if (state.activeSpot) {
      url.searchParams.set("spot", state.activeSpot);
    } else {
      url.searchParams.delete("spot");
    }

    url.searchParams.set("lang", state.lang);
    window.history.replaceState({}, "", url.toString());
  }

  function announceActiveSpot() {
    if (!state.activeSpot) {
      return;
    }

    const ui = getUi();
    const spot = getSpot(state.activeSpot);
    if (!spot) {
      return;
    }

    const translation = resolveTranslation(spot, state.lang);
    elements.announcer.textContent = ui.announcerPrefix + ": " + translation.title;
  }

  function moveToSpot(spotId, options) {
    const settings = Object.assign(
      {
        behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
        focus: true,
        updateUrl: true,
      },
      options || {}
    );

    state.activeSpot = normalizeSpot(spotId);
    syncActiveState();

    if (settings.updateUrl) {
      updateUrl();
    }

    if (!state.activeSpot) {
      return;
    }

    const section = document.getElementById("spot-" + state.activeSpot);
    if (!section) {
      return;
    }

    section.scrollIntoView({
      behavior: settings.behavior,
      block: "start",
    });

    if (settings.focus) {
      window.setTimeout(function () {
        section.focus({ preventScroll: true });
      }, settings.behavior === "smooth" ? 320 : 0);
    }

    announceActiveSpot();
  }

  function renderGuide() {
    const ui = getUi();

    document.documentElement.lang = state.lang;
    document.title = ui.pageTitle + " | Mylotopi";
    elements.kicker.textContent = ui.kicker;
    elements.title.textContent = ui.pageTitle;
    elements.intro.textContent = ui.intro;
    elements.languageLabel.textContent = ui.languageLabel;
    elements.spotsLabel.textContent = ui.spotsLabel;
    elements.languageSwitcher.setAttribute("aria-label", ui.languageLabel);
    elements.spotNav.setAttribute("aria-label", ui.spotsLabel);

    renderLanguageButtons();
    renderSpotNav();
    renderSections();
    bindAudioPlayers();
  }

  function bindAudioPlayers() {
    const players = Array.from(elements.main.querySelectorAll("audio"));

    players.forEach(function (player) {
      player.addEventListener("play", function () {
        players.forEach(function (otherPlayer) {
          if (otherPlayer !== player) {
            otherPlayer.pause();
          }
        });
      });
    });
  }

  function applyLocation() {
    const params = new URLSearchParams(window.location.search);
    const rawLang = params.get("lang");
    const rawSpot = params.get("spot");
    const canonicalRawLang = rawLang
      ? rawLang.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-")
      : null;
    const canonicalRawSpot = rawSpot ? rawSpot.toString().trim().toLowerCase() : null;
    const normalizedLang = normalizeLang(rawLang) || DEFAULT_LANG;
    const normalizedSpot = normalizeSpot(rawSpot);

    state.lang = normalizedLang;
    state.activeSpot = normalizedSpot;
    state.shouldNormalizeUrl =
      (canonicalRawLang !== null && canonicalRawLang !== normalizedLang) ||
      (canonicalRawSpot !== null && canonicalRawSpot !== normalizedSpot);
  }

  function handleLanguageClick(event) {
    const button = event.target.closest("button[data-lang]");
    if (!button) {
      return;
    }

    const nextLang = normalizeLang(button.dataset.lang) || DEFAULT_LANG;
    if (nextLang === state.lang) {
      return;
    }

    state.lang = nextLang;
    renderGuide();
    syncActiveState();
    updateUrl();

    if (state.activeSpot) {
      moveToSpot(state.activeSpot, {
        behavior: "auto",
        focus: false,
        updateUrl: false,
      });
    }
  }

  function handleSpotClick(event) {
    const button = event.target.closest("button[data-spot]");
    if (!button) {
      return;
    }

    moveToSpot(button.dataset.spot, {
      behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
      focus: true,
      updateUrl: true,
    });
  }

  function init() {
    applyLocation();
    renderGuide();
    syncActiveState();

    if (state.shouldNormalizeUrl) {
      updateUrl();
      state.shouldNormalizeUrl = false;
    }

    elements.languageSwitcher.addEventListener("click", handleLanguageClick);
    elements.spotNav.addEventListener("click", handleSpotClick);

    if (state.activeSpot) {
      window.setTimeout(function () {
        moveToSpot(state.activeSpot, {
          behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
          focus: true,
          updateUrl: false,
        });
      }, 120);
    }
  }

  init();
})();
