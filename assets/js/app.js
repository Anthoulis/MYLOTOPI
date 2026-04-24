(function () {
  const meta = window.MYLOTOPI_GUIDE_META;
  const i18n = window.MYLOTOPI_GUIDE_I18N;

  if (!meta || !i18n) {
    throw new Error("Mylotopi guide app dependencies are missing.");
  }

  const SPOT_ORDER = Array.isArray(meta.spotOrder) ? meta.spotOrder.slice() : Object.keys(meta.spots || {});
  const SPOTS_BY_ID = meta.spots || {};
  const REDUCED_MOTION_QUERY = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    lang: i18n.defaultLanguage,
    activeSpot: null,
    galleries: {},
    shouldNormalizeUrl: false,
  };

  const elements = {
    kicker: document.getElementById("guide-kicker"),
    title: document.getElementById("guide-title"),
    intro: document.getElementById("guide-intro"),
    activeSpotLabel: document.getElementById("active-spot-label"),
    activeLanguageLabel: document.getElementById("active-language-label"),
    spotMenu: document.getElementById("spot-menu"),
    spotTrigger: document.getElementById("spot-menu-trigger"),
    spotSwitcher: document.getElementById("spot-switcher"),
    languageMenu: document.getElementById("language-menu"),
    languageTrigger: document.getElementById("language-menu-trigger"),
    languageSwitcher: document.getElementById("language-switcher"),
    main: document.getElementById("guide-main"),
    announcer: document.getElementById("guide-announcer"),
  };

  function normalizeSpot(value) {
    if (!value) {
      return null;
    }

    const key = value.toString().trim().toLowerCase();
    return SPOT_ORDER.includes(key) ? key : null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function resolveAudioMimeType(path) {
    const normalizedPath = (path || "").toLowerCase();

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

  function renderParagraphs(paragraphs) {
    return (paragraphs || [])
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph) + "</p>";
      })
      .join("");
  }

  function getGalleryImage(spotId, index) {
    const images = SPOTS_BY_ID[spotId].images || [];
    const image = images[index];

    if (typeof image === "string") {
      return { src: image, alt: i18n.getImageAlt(spotId, state.lang) };
    }

    return image || null;
  }

  function getGalleryIndex(spotId) {
    const images = SPOTS_BY_ID[spotId].images || [];
    const index = state.galleries[spotId] || 0;
    return images.length ? Math.min(index, images.length - 1) : 0;
  }

  function renderGallery(spotId, content, ui) {
    const spot = SPOTS_BY_ID[spotId];
    const images = spot.images || [];
    const index = getGalleryIndex(spotId);
    const image = getGalleryImage(spotId, index);

    if (!images.length || !image) {
      return (
        '<div class="guide-gallery" data-gallery-spot="' +
        spotId +
        '">' +
        '<div class="guide-media-frame guide-gallery-frame is-placeholder" role="img" aria-label="' +
        escapeHtml(i18n.getImageAlt(spotId, state.lang)) +
        '"><div class="guide-media-placeholder"><span class="guide-media-placeholder-label">' +
        escapeHtml(ui.imagePlaceholderLabel) +
        "</span><strong>" +
        escapeHtml(content.shortTitle || content.title) +
        "</strong><span>" +
        escapeHtml(ui.imagePlaceholderHint) +
        "</span></div></div></div>"
      );
    }

    return (
      '<figure class="guide-gallery" data-gallery-spot="' +
      spotId +
      '">' +
      '<div class="guide-media-frame guide-gallery-frame"><img class="guide-gallery-image" src="' +
      escapeHtml(image.src) +
      '" alt="' +
      escapeHtml(image.alt || i18n.getImageAlt(spotId, state.lang)) +
      '"></div>' +
      '<figcaption class="guide-gallery-controls">' +
      '<button class="guide-gallery-button" type="button" data-gallery-direction="-1" aria-label="' +
      escapeHtml(ui.galleryPrevious || "Previous image") +
      '"' +
      (index === 0 ? " disabled" : "") +
      ">‹</button>" +
      '<span class="guide-gallery-count">' +
      String(index + 1) +
      " / " +
      String(images.length) +
      "</span>" +
      '<button class="guide-gallery-button" type="button" data-gallery-direction="1" aria-label="' +
      escapeHtml(ui.galleryNext || "Next image") +
      '"' +
      (index === images.length - 1 ? " disabled" : "") +
      ">›</button>" +
      "</figcaption></figure>"
    );
  }

  function renderLanguageButtons() {
    const ui = i18n.getUi(state.lang);

    elements.activeLanguageLabel.textContent = i18n.getLanguageLabel(state.lang);
    elements.languageTrigger.setAttribute("aria-label", ui.languageLabel);
    elements.languageMenu.setAttribute("aria-label", ui.languageLabel);
    elements.languageSwitcher.setAttribute("aria-label", ui.languageLabel);

    elements.languageSwitcher.innerHTML = i18n.supportedLanguages.map(function (langKey) {
      const pressed = langKey === state.lang;

      return (
        '<button class="guide-lang-button" type="button" data-lang="' +
        langKey +
        '" aria-pressed="' +
        String(pressed) +
        '" aria-current="' +
        (pressed ? "true" : "false") +
        '">' +
        escapeHtml(i18n.getLanguageLabel(langKey)) +
        "</button>"
      );
    }).join("");
  }

  function renderSpotButtons() {
    const ui = i18n.getUi(state.lang);
    const activeLabel = state.activeSpot ? i18n.getSpotLabel(state.activeSpot, state.lang) : ui.spotsLabel;

    elements.activeSpotLabel.textContent = activeLabel;
    elements.spotTrigger.setAttribute("aria-label", ui.spotsLabel);
    elements.spotMenu.setAttribute("aria-label", ui.spotsLabel);
    elements.spotSwitcher.setAttribute("aria-label", ui.spotsLabel);

    elements.spotSwitcher.innerHTML = SPOT_ORDER.map(function (spotId) {
      const isActive = spotId === state.activeSpot;

      return (
        '<button class="guide-spot-option" type="button" data-spot="' +
        spotId +
        '" aria-current="' +
        (isActive ? "true" : "false") +
        '">' +
        '<span>' +
        escapeHtml(i18n.getSpotLabel(spotId, state.lang)) +
        "</span>" +
        "</button>"
      );
    }).join("");
  }

  function renderSections() {
    const ui = i18n.getUi(state.lang);

    elements.main.innerHTML = SPOT_ORDER.map(function (spotId, index) {
      const spot = SPOTS_BY_ID[spotId];
      if (!spot) {
        return "";
      }

      const content = i18n.getSpotText(spotId, state.lang);
      const audio = i18n.getAudio(spotId, state.lang);
      const audioMimeType = resolveAudioMimeType(audio.path);
      const isActive = state.activeSpot === spotId;
      const sectionIndex = String(index + 1).padStart(2, "0");
      const bodyMarkup = renderParagraphs(content.body);
      const galleryMarkup = renderGallery(spotId, content, ui);

      const audioMarkup = audio.path
        ? '<audio class="guide-audio-player" controls preload="none" aria-label="' +
          escapeHtml(ui.audioHeading + ": " + content.title) +
          '"><source src="' +
          escapeHtml(audio.path) +
          '"' +
          (audioMimeType ? ' type="' + escapeHtml(audioMimeType) + '"' : "") +
          "></audio>"
        : '<p class="guide-audio-fallback">' + escapeHtml(ui.audioFallback) + "</p>";

      return (
        '<article class="guide-section' +
        (isActive ? " is-active" : "") +
        '" id="spot-' +
        spotId +
        '" data-spot="' +
        spotId +
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
        escapeHtml(content.title) +
        "</h2>" +
        '<p class="guide-section-description">' +
        escapeHtml(content.shortText) +
        "</p>" +
        "</div>" +
        galleryMarkup +
        '<section class="guide-audio-card" aria-label="' +
        escapeHtml(ui.audioHeading) +
        '">' +
        '<p class="guide-audio-heading">' +
        escapeHtml(ui.audioHeading) +
        "</p>" +
        (audio.caption ? '<p class="guide-audio-caption">' + escapeHtml(audio.caption) + "</p>" : "") +
        audioMarkup +
        (spot.audioPlaceholder ? '<p class="guide-audio-placeholder">' + escapeHtml(ui.audioPlaceholderNotice) + "</p>" : "") +
        "</section>" +
        (bodyMarkup ? '<div class="guide-copy">' + bodyMarkup + "</div>" : "") +
        "</article>"
      );
    }).join("");
  }

  function syncActiveState() {
    const ui = i18n.getUi(state.lang);

    elements.main.querySelectorAll(".guide-section").forEach(function (section) {
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

    renderSpotButtons();
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

    const ui = i18n.getUi(state.lang);
    const content = i18n.getSpotText(state.activeSpot, state.lang);
    elements.announcer.textContent = ui.announcerPrefix + ": " + content.title;
  }

  function closeMenus() {
    elements.spotMenu.open = false;
    elements.languageMenu.open = false;
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
    const ui = i18n.getUi(state.lang);

    document.documentElement.lang = state.lang;
    document.title = ui.pageTitle + " | Mylotopi";
    elements.kicker.textContent = ui.kicker;
    elements.title.textContent = ui.pageTitle;
    elements.intro.textContent = ui.intro;

    // Render pipeline: chrome first, data-driven sections second, then media bindings.
    renderLanguageButtons();
    renderSections();
    renderSpotButtons();
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
    const normalizedLang = i18n.normalizeLanguage(rawLang) || i18n.defaultLanguage;
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

    const nextLang = i18n.normalizeLanguage(button.dataset.lang) || i18n.defaultLanguage;
    if (nextLang === state.lang) {
      closeMenus();
      return;
    }

    state.lang = nextLang;
    renderGuide();
    syncActiveState();
    updateUrl();
    closeMenus();

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

    const targetSpot = normalizeSpot(button.dataset.spot);
    if (!targetSpot) {
      return;
    }

    closeMenus();
    moveToSpot(targetSpot, {
      behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
      focus: true,
      updateUrl: true,
    });
  }

  function handleGalleryClick(event) {
    const button = event.target.closest("button[data-gallery-direction]");
    if (!button) {
      return;
    }

    const gallery = button.closest("[data-gallery-spot]");
    const spotId = gallery ? gallery.dataset.gallerySpot : null;
    const spot = spotId ? SPOTS_BY_ID[spotId] : null;
    const images = spot ? spot.images || [] : [];
    if (!spotId || !images.length) {
      return;
    }

    const direction = Number(button.dataset.galleryDirection);
    const nextIndex = Math.max(0, Math.min(getGalleryIndex(spotId) + direction, images.length - 1));
    state.galleries[spotId] = nextIndex;

    // Gallery state is separate from URL/language state, so image changes do not affect deep links.
    renderSections();
    syncActiveState();
    bindAudioPlayers();
  }

  function handleDocumentClick(event) {
    if (!elements.spotMenu.contains(event.target)) {
      elements.spotMenu.open = false;
    }

    if (!elements.languageMenu.contains(event.target)) {
      elements.languageMenu.open = false;
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key === "Escape") {
      closeMenus();
    }
  }

  function handleMenuToggle(event) {
    if (!event.target.open) {
      return;
    }

    if (event.target === elements.spotMenu) {
      elements.languageMenu.open = false;
    }

    if (event.target === elements.languageMenu) {
      elements.spotMenu.open = false;
    }
  }

  function init() {
    // State flow starts from URL params, then the render pipeline builds the page from metadata/locales.
    applyLocation();
    renderGuide();
    syncActiveState();

    if (state.shouldNormalizeUrl) {
      updateUrl();
      state.shouldNormalizeUrl = false;
    }

    elements.languageSwitcher.addEventListener("click", handleLanguageClick);
    elements.spotSwitcher.addEventListener("click", handleSpotClick);
    elements.main.addEventListener("click", handleGalleryClick);
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeydown);
    elements.spotMenu.addEventListener("toggle", handleMenuToggle);
    elements.languageMenu.addEventListener("toggle", handleMenuToggle);

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
