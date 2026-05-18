(function () {
  const meta = window.MYLOTOPI_GUIDE_META;
  const i18n = window.MYLOTOPI_GUIDE_I18N;

  if (!meta || !i18n) {
    throw new Error("Mylotopi guide app dependencies are missing.");
  }

  const SPOT_ORDER = Array.isArray(meta.spotOrder) ? meta.spotOrder.slice() : Object.keys(meta.spots || {});
  const SPOTS_BY_ID = meta.spots || {};
  const REDUCED_MOTION_QUERY = window.matchMedia("(prefers-reduced-motion: reduce)");
  const COPY_COLLAPSE_BLOCK_THRESHOLD = 5;
  const COPY_COLLAPSE_TEXT_THRESHOLD = 720;
  const DOM_IDS = {
    kicker: "guide-kicker",
    title: "guide-title",
    intro: "guide-intro",
    activeSpotLabel: "active-spot-label",
    activeLanguageLabel: "active-language-label",
    spotMenu: "spot-menu",
    spotTrigger: "spot-menu-trigger",
    spotSwitcher: "spot-switcher",
    languageMenu: "language-menu",
    languageTrigger: "language-menu-trigger",
    languageSwitcher: "language-switcher",
    main: "guide-main",
    announcer: "guide-announcer",
  };

  const state = {
    lang: i18n.defaultLanguage,
    activeSpot: null,
    galleries: {},
    shouldNormalizeUrl: false,
  };

  const elements = Object.keys(DOM_IDS).reduce(function (result, key) {
    result[key] = document.getElementById(DOM_IDS[key]);
    return result;
  }, {});

  assertRequiredElements();

  function assertRequiredElements() {
    const missingIds = Object.keys(DOM_IDS)
      .filter(function (key) {
        return !elements[key];
      })
      .map(function (key) {
        return "#" + DOM_IDS[key];
      });

    if (missingIds.length) {
      throw new Error("Mylotopi guide DOM is missing required elements: " + missingIds.join(", "));
    }
  }

  function normalizeSpot(value) {
    if (!value) {
      return null;
    }

    const key = normalizeQueryParam(value);
    return SPOT_ORDER.includes(key) ? key : null;
  }

  function getSpotAnchorId(spotId) {
    const spot = SPOTS_BY_ID[spotId];
    return spot && spot.anchorId ? spot.anchorId : spotId;
  }

  function getSpotSection(spotId) {
    return spotId ? document.getElementById(getSpotAnchorId(spotId)) : null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
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

  function getAudioPlayers() {
    return Array.from(elements.main.querySelectorAll("audio"));
  }

  function getAudioPlayerSpot(player) {
    const section = player.closest(".guide-section[data-spot]");
    return section ? section.dataset.spot : null;
  }

  function getAudioPlayerForSpot(spotId) {
    const section = getSpotSection(spotId);
    return section ? section.querySelector("audio") : null;
  }

  function resetAudioPlayer(player) {
    if (!player) {
      return;
    }

    player.pause();
    try {
      player.currentTime = 0;
    } catch (error) {
      console.warn("Unable to reset audio playback position.", error);
      player.load();
    }
  }

  function loadAudioMetadata(player) {
    if (!player) {
      return;
    }

    player.preload = "metadata";

    if (player.readyState === HTMLMediaElement.HAVE_NOTHING) {
      player.load();
    }
  }

  function stopAllAudioPlayers() {
    getAudioPlayers().forEach(resetAudioPlayer);
  }

  function stopAudioPlayersExcept(spotId) {
    getAudioPlayers().forEach(function (player) {
      if (getAudioPlayerSpot(player) !== spotId) {
        resetAudioPlayer(player);
      }
    });
  }

  function activateSpotAudio(spotId) {
    // Spot/language changes own audio lifecycle. Gallery changes must never call this.
    const player = getAudioPlayerForSpot(spotId);

    stopAudioPlayersExcept(spotId);
    resetAudioPlayer(player);
    loadAudioMetadata(player);
  }

  function getBulletGroupsById(bullets) {
    return (bullets || []).reduce(function (result, group) {
      if (group && group.id) {
        result[group.id] = group;
      }

      return result;
    }, {});
  }

  function renderCopyItem(item) {
    if (typeof item === "string") {
      return "<li>" + escapeHtml(item) + "</li>";
    }

    if (!item || typeof item !== "object") {
      return "";
    }

    const label = item.label ? "<strong>" + escapeHtml(item.label) + "</strong>" : "";
    const text = item.text ? "<span>" + escapeHtml(item.text) + "</span>" : "";

    return "<li>" + label + text + "</li>";
  }

  function renderBulletGroup(group) {
    if (!group || !Array.isArray(group.items)) {
      return "";
    }

    return (
      '<ul class="guide-copy-list">' +
      group.items.map(renderCopyItem).join("") +
      "</ul>"
    );
  }

  function renderCopyBlock(block, bulletGroupsById) {
    if (typeof block === "string") {
      return "<p>" + escapeHtml(block) + "</p>";
    }

    if (!block || typeof block !== "object") {
      return "";
    }

    if (block.type === "heading" && block.text) {
      return '<h3 class="guide-copy-heading">' + escapeHtml(block.text) + "</h3>";
    }

    if (block.type === "bulletGroup" && block.id) {
      return renderBulletGroup(bulletGroupsById[block.id]);
    }

    if (block.type === "list" && Array.isArray(block.items)) {
      return renderBulletGroup(block);
    }

    if (block.text) {
      return "<p>" + escapeHtml(block.text) + "</p>";
    }

    return "";
  }

  function renderCopyBlocks(blocks, bulletGroupsById) {
    return (blocks || [])
      .map(function (block) {
        return renderCopyBlock(block, bulletGroupsById);
      })
      .join("");
  }

  function getCopyBlockText(block, bulletGroupsById) {
    if (typeof block === "string") {
      return block;
    }

    if (!block || typeof block !== "object") {
      return "";
    }

    if (block.type === "bulletGroup" && block.id && bulletGroupsById[block.id]) {
      return getCopyBlockText(bulletGroupsById[block.id]);
    }

    if (Array.isArray(block.items)) {
      return block.items
        .map(function (item) {
          if (typeof item === "string") {
            return item;
          }

          return item ? [item.label, item.text].filter(Boolean).join(" ") : "";
        })
        .join(" ");
    }

    return block.text || "";
  }

  function shouldCollapseCopy(blocks, bullets) {
    const copyBlocks = blocks || [];
    const bulletGroupsById = getBulletGroupsById(bullets);
    const textLength = copyBlocks
      .map(function (block) {
        return getCopyBlockText(block, bulletGroupsById);
      })
      .join(" ").length;

    return copyBlocks.length > COPY_COLLAPSE_BLOCK_THRESHOLD || textLength > COPY_COLLAPSE_TEXT_THRESHOLD;
  }

  function renderCopySection(spotId, content, ui) {
    const detailBlocks = content.details || [];
    const bulletGroupsById = getBulletGroupsById(content.bullets);
    const bodyMarkup = renderCopyBlocks(detailBlocks, bulletGroupsById);
    if (!bodyMarkup) {
      return "";
    }

    const isCollapsible = shouldCollapseCopy(detailBlocks, content.bullets);
    const copyId = "guide-copy-" + spotId;

    return (
      '<div class="guide-copy-wrap' +
      (isCollapsible ? " is-collapsible is-collapsed" : "") +
      '">' +
      '<div class="guide-copy" id="' +
      escapeHtml(copyId) +
      '"' +
      (isCollapsible ? ' data-copy-panel data-expanded="false"' : "") +
      ">" +
      bodyMarkup +
      "</div>" +
      (isCollapsible
        ? '<button class="guide-copy-toggle" type="button" data-copy-toggle aria-expanded="false" aria-controls="' +
          escapeHtml(copyId) +
          '" data-read-more="' +
          escapeHtml(ui.readMore || "Read more") +
          '" data-read-less="' +
          escapeHtml(ui.readLess || "Read less") +
          '">' +
          escapeHtml(ui.readMore || "Read more") +
          "</button>"
        : "") +
      "</div>"
    );
  }

  function getSpotImages(spotId) {
    const spot = SPOTS_BY_ID[spotId];
    return spot && Array.isArray(spot.images) ? spot.images : [];
  }

  function getGalleryImageAlt(image, spotId) {
    const localizedAlt = i18n.getImageAlt(spotId, state.lang);
    const imageAlt = image && image.alt;

    if (!imageAlt) {
      return localizedAlt;
    }

    if (typeof imageAlt === "object") {
      return imageAlt[state.lang] || imageAlt[i18n.defaultLanguage] || localizedAlt;
    }

    return state.lang === i18n.defaultLanguage ? imageAlt : localizedAlt;
  }

  function getGalleryImage(spotId, index) {
    const images = getSpotImages(spotId);
    const image = images[index];

    if (typeof image === "string") {
      return {
        src: image,
        alt: i18n.getImageAlt(spotId, state.lang),
        fit: "cover",
        position: "center",
      };
    }

    if (!image || !image.src) {
      return null;
    }

    return {
      src: image.src,
      alt: getGalleryImageAlt(image, spotId),
      fit: normalizeImageFit(image.fit),
      position: normalizeImagePosition(image.position),
    };
  }

  function normalizeImageFit(value) {
    return value === "contain" ? "contain" : "cover";
  }

  function normalizeImagePosition(value) {
    const position = value || "center";
    return /^[a-z0-9.%\-\s]+$/i.test(position) ? position : "center";
  }

  function getGalleryIndex(spotId) {
    const images = getSpotImages(spotId);
    const index = state.galleries[spotId] || 0;
    return images.length ? Math.min(index, images.length - 1) : 0;
  }

  function renderGallery(spotId, content, ui) {
    const images = getSpotImages(spotId);
    const index = getGalleryIndex(spotId);
    const image = getGalleryImage(spotId, index);
    const escapedSpotId = escapeHtml(spotId);

    if (!images.length || !image) {
      return (
        '<div class="guide-gallery" data-gallery-spot="' +
        escapedSpotId +
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
      escapedSpotId +
      '">' +
      '<div class="guide-media-frame guide-gallery-frame" data-image-fit="' +
      escapeHtml(image.fit) +
      '"><img class="guide-gallery-image" src="' +
      escapeHtml(image.src) +
      '" alt="' +
      escapeHtml(image.alt || i18n.getImageAlt(spotId, state.lang)) +
      '" style="--gallery-fit:' +
      escapeHtml(image.fit) +
      ";--gallery-position:" +
      escapeHtml(image.position) +
      '"></div>' +
      '<figcaption class="guide-gallery-controls">' +
      '<button class="guide-gallery-button" type="button" data-gallery-direction="-1" aria-label="' +
      escapeHtml(ui.galleryPrevious || "Previous image") +
      '"' +
      (index === 0 ? " disabled" : "") +
      ">&lsaquo;</button>" +
      '<span class="guide-gallery-count">' +
      String(index + 1) +
      " / " +
      String(images.length) +
      "</span>" +
      '<button class="guide-gallery-button" type="button" data-gallery-direction="1" aria-label="' +
      escapeHtml(ui.galleryNext || "Next image") +
      '"' +
      (index === images.length - 1 ? " disabled" : "") +
      ">&rsaquo;</button>" +
      "</figcaption></figure>"
    );
  }

  function updateGalleryView(spotId) {
    const gallery = elements.main.querySelector('[data-gallery-spot="' + spotId + '"]');
    const images = getSpotImages(spotId);
    const image = getGalleryImage(spotId, getGalleryIndex(spotId));

    if (!gallery || !images.length || !image) {
      return;
    }

    const frame = gallery.querySelector(".guide-gallery-frame");
    const imageElement = gallery.querySelector(".guide-gallery-image");
    const count = gallery.querySelector(".guide-gallery-count");
    const previousButton = gallery.querySelector('button[data-gallery-direction="-1"]');
    const nextButton = gallery.querySelector('button[data-gallery-direction="1"]');
    const index = getGalleryIndex(spotId);

    if (!frame || !imageElement || !count || !previousButton || !nextButton) {
      gallery.outerHTML = renderGallery(spotId, i18n.getSpotText(spotId, state.lang), i18n.getUi(state.lang));
      return;
    }

    // Update only image-related DOM so active audio elements keep playing uninterrupted.
    frame.dataset.imageFit = image.fit;
    imageElement.src = image.src;
    imageElement.alt = image.alt || i18n.getImageAlt(spotId, state.lang);
    imageElement.style.setProperty("--gallery-fit", image.fit);
    imageElement.style.setProperty("--gallery-position", image.position);
    count.textContent = String(index + 1) + " / " + String(images.length);
    previousButton.disabled = index === 0;
    nextButton.disabled = index === images.length - 1;
  }

  function renderAudioMarkup(audio, content, ui) {
    if (!audio.path) {
      return '<p class="guide-audio-fallback">' + escapeHtml(ui.audioFallback) + "</p>";
    }

    const audioMimeType = resolveAudioMimeType(audio.path);

    return (
      '<audio class="guide-audio-player" controls preload="metadata" aria-label="' +
      escapeHtml(ui.audioHeading + ": " + content.title) +
      '"><source src="' +
      escapeHtml(audio.path) +
      '"' +
      (audioMimeType ? ' type="' + escapeHtml(audioMimeType) + '"' : "") +
      "></audio>"
    );
  }

  function renderLanguageButtons() {
    const ui = i18n.getUi(state.lang);
    const activeLanguageName = i18n.getLanguageName(state.lang);

    elements.activeLanguageLabel.textContent = i18n.getLanguageLabel(state.lang);
    elements.languageTrigger.setAttribute("aria-label", ui.languageLabel + ": " + activeLanguageName);
    elements.languageMenu.setAttribute("aria-label", ui.languageLabel);
    elements.languageSwitcher.setAttribute("aria-label", ui.languageLabel);

    elements.languageSwitcher.innerHTML = i18n.supportedLanguages.map(function (langKey) {
      const pressed = langKey === state.lang;
      const languageName = i18n.getLanguageName(langKey);

      return (
        '<button class="guide-lang-button" type="button" data-lang="' +
        langKey +
        '" aria-label="' +
        escapeHtml(ui.languageLabel + ": " + languageName) +
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

  function renderMiniMap(ui) {
    const visibleStops = SPOT_ORDER.filter(function (spotId) {
      return Boolean(SPOTS_BY_ID[spotId]);
    });
    const miniMap = i18n.getMiniMap(state.lang);

    if (!visibleStops.length) {
      return "";
    }

    return (
      '<nav class="guide-mini-map" aria-labelledby="guide-mini-map-title">' +
      '<div class="guide-mini-map-header">' +
      '<h2 class="guide-mini-map-title" id="guide-mini-map-title">' +
      escapeHtml(ui.miniMapTitle || "Mini-map") +
      "</h2>" +
      (ui.miniMapDescription
        ? '<p class="guide-mini-map-description">' + escapeHtml(ui.miniMapDescription) + "</p>"
        : "") +
      "</div>" +
      '<figure class="guide-mini-map-figure">' +
      '<img class="guide-mini-map-image" src="' +
      escapeHtml(miniMap.path || "./assets/maps/en/minimap.jpg") +
      '" alt="' +
      escapeHtml(ui.miniMapImageAlt || "Mylotopi mini-map showing the nine tour stops") +
      '">' +
      "</figure>" +
      '<ol class="guide-mini-map-list">' +
      visibleStops.map(function (spotId, index) {
        const isActive = spotId === state.activeSpot;
        const stopNumber = String(index + 1).padStart(2, "0");

        return (
          '<li class="guide-mini-map-item">' +
          '<a class="guide-mini-map-link" href="#' +
          escapeHtml(getSpotAnchorId(spotId)) +
          '" data-mini-map-spot="' +
          escapeHtml(spotId) +
          '" aria-current="' +
          (isActive ? "location" : "false") +
          '">' +
          '<span class="guide-mini-map-number">' +
          stopNumber +
          "</span>" +
          '<span class="guide-mini-map-label">' +
          escapeHtml(i18n.getSpotLabel(spotId, state.lang)) +
          "</span>" +
          "</a></li>"
        );
      }).join("") +
      "</ol></nav>"
    );
  }

  function renderSections() {
    const ui = i18n.getUi(state.lang);

    const sectionsMarkup = SPOT_ORDER.map(function (spotId, index) {
      const spot = SPOTS_BY_ID[spotId];
      if (!spot) {
        return "";
      }

      const content = i18n.getSpotText(spotId, state.lang);
      const audio = i18n.getAudio(spotId, state.lang);
      const isActive = state.activeSpot === spotId;
      const sectionIndex = String(index + 1).padStart(2, "0");
      const copyMarkup = renderCopySection(spotId, content, ui);
      const galleryMarkup = renderGallery(spotId, content, ui);
      const audioMarkup = renderAudioMarkup(audio, content, ui);

      return (
        '<article class="guide-section' +
        (isActive ? " is-active" : "") +
        '" id="' +
        escapeHtml(getSpotAnchorId(spotId)) +
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
        escapeHtml(content.preview || content.shortText) +
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
        "</section>" +
        copyMarkup +
        "</article>"
      );
    }).join("");

    elements.main.innerHTML = renderMiniMap(ui) + sectionsMarkup;
  }

  function syncMiniMapState() {
    elements.main.querySelectorAll(".guide-mini-map-link[data-mini-map-spot]").forEach(function (link) {
      link.setAttribute("aria-current", link.dataset.miniMapSpot === state.activeSpot ? "location" : "false");
    });
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

    syncMiniMapState();
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

  function getNavigationOptions() {
    return {
      behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
      focus: true,
      updateUrl: true,
    };
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

    const nextSpot = normalizeSpot(spotId);
    const previousSpot = state.activeSpot;

    state.activeSpot = nextSpot;

    if (previousSpot !== state.activeSpot) {
      activateSpotAudio(state.activeSpot);
    }

    syncActiveState();

    if (settings.updateUrl) {
      updateUrl();
    }

    if (!state.activeSpot) {
      return;
    }

    const section = getSpotSection(state.activeSpot);
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
    loadAudioMetadata(getAudioPlayerForSpot(state.activeSpot));
  }

  function bindAudioPlayers() {
    getAudioPlayers().forEach(function (player) {
      player.addEventListener("play", function () {
        const spotId = getAudioPlayerSpot(player);

        stopAudioPlayersExcept(spotId);
      });
    });
  }

  function normalizeQueryParam(value) {
    return value.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
  }

  function applyLocation() {
    const params = new URLSearchParams(window.location.search);
    const rawLang = params.get("lang");
    const rawSpot = params.get("spot");
    const hasLangParam = params.has("lang");
    const hasSpotParam = params.has("spot");
    const canonicalRawLang = hasLangParam ? normalizeQueryParam(rawLang || "") : null;
    const canonicalRawSpot = hasSpotParam ? (rawSpot || "").toString().trim().toLowerCase() : null;
    const normalizedLang = i18n.normalizeLanguage(rawLang) || i18n.defaultLanguage;
    const normalizedSpot = normalizeSpot(rawSpot);

    state.lang = normalizedLang;
    state.activeSpot = normalizedSpot;
    state.shouldNormalizeUrl =
      (hasLangParam && canonicalRawLang !== normalizedLang) ||
      (hasSpotParam && canonicalRawSpot !== normalizedSpot);
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

    stopAllAudioPlayers();

    state.lang = nextLang;
    renderGuide();
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
    moveToSpot(targetSpot, getNavigationOptions());
  }

  function handleMiniMapClick(event) {
    const link = event.target.closest("a[data-mini-map-spot]");
    if (!link) {
      return;
    }

    const targetSpot = normalizeSpot(link.dataset.miniMapSpot);
    if (!targetSpot) {
      return;
    }

    event.preventDefault();
    closeMenus();
    moveToSpot(targetSpot, getNavigationOptions());
  }

  function handleGalleryClick(event) {
    const button = event.target.closest("button[data-gallery-direction]");
    if (!button) {
      return;
    }

    const gallery = button.closest("[data-gallery-spot]");
    const spotId = gallery ? gallery.dataset.gallerySpot : null;
    const images = getSpotImages(spotId);
    if (!spotId || !images.length) {
      return;
    }

    const direction = Number(button.dataset.galleryDirection);
    if (!Number.isFinite(direction) || direction === 0) {
      return;
    }

    const currentIndex = getGalleryIndex(spotId);
    const nextIndex = Math.max(0, Math.min(currentIndex + direction, images.length - 1));
    if (nextIndex === currentIndex) {
      return;
    }

    state.galleries[spotId] = nextIndex;

    // Gallery state is isolated from URL, active-spot, language, and audio state.
    updateGalleryView(spotId);
  }

  function handleCopyToggle(event) {
    const button = event.target.closest("button[data-copy-toggle]");
    if (!button) {
      return;
    }

    const copyWrap = button.closest(".guide-copy-wrap");
    const copyPanel = copyWrap ? copyWrap.querySelector("[data-copy-panel]") : null;
    if (!copyWrap || !copyPanel) {
      return;
    }

    const isExpanded = button.getAttribute("aria-expanded") === "true";
    const nextExpanded = !isExpanded;
    const readMoreLabel = button.dataset.readMore || "Read more";
    const readLessLabel = button.dataset.readLess || "Read less";

    copyWrap.classList.toggle("is-collapsed", !nextExpanded);
    copyWrap.classList.toggle("is-expanded", nextExpanded);
    copyPanel.dataset.expanded = String(nextExpanded);
    button.setAttribute("aria-expanded", String(nextExpanded));
    button.textContent = nextExpanded ? readLessLabel : readMoreLabel;
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

  function showFatalError(error) {
    console.error(error);
    elements.main.innerHTML =
      '<div class="guide-load-error" role="alert">' +
      "<strong>Unable to load guide content.</strong>" +
      "<span>Please serve this folder as a static website and reload the page.</span>" +
      "</div>";
  }

  async function init() {
    await i18n.loadContent();

    // State flow starts from URL params, then the render pipeline builds the page from metadata/content JSON.
    applyLocation();
    renderGuide();
    syncActiveState();

    if (state.shouldNormalizeUrl) {
      updateUrl();
      state.shouldNormalizeUrl = false;
    }

    elements.languageSwitcher.addEventListener("click", handleLanguageClick);
    elements.spotSwitcher.addEventListener("click", handleSpotClick);
    elements.main.addEventListener("click", handleMiniMapClick);
    elements.main.addEventListener("click", handleGalleryClick);
    elements.main.addEventListener("click", handleCopyToggle);
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

  init().catch(showFatalError);
})();
