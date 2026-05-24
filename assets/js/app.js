(function () {
  const meta = window.MYLOTOPI_GUIDE_META;
  const i18n = window.MYLOTOPI_GUIDE_I18N;

  if (!meta || !i18n) {
    throw new Error("Mylotopi QR guide dependencies are missing.");
  }

  const SPOT_ORDER = Array.isArray(meta.spotOrder) ? meta.spotOrder.slice() : Object.keys(meta.spots || {});
  const SPOTS_BY_ID = meta.spots || {};
  const REDUCED_MOTION_QUERY = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FLAG_SVG_MARKUP = {
    en:
      '<rect width="24" height="16" fill="#012169"></rect><path d="M0 0l24 16M24 0L0 16" stroke="#fff" stroke-width="3.2"></path><path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.7"></path><path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5.2"></path><path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="3"></path>',
    el:
      '<rect width="24" height="16" fill="#0d5eaf"></rect><path d="M0 3h24M0 6h24M0 9h24M0 12h24M0 15h24" stroke="#fff" stroke-width="1"></path><rect width="9.5" height="8.8" fill="#0d5eaf"></rect><path d="M4.75 0v8.8M0 4.4h9.5" stroke="#fff" stroke-width="1.6"></path>',
    de:
      '<rect width="24" height="5.34" fill="#000"></rect><rect y="5.33" width="24" height="5.34" fill="#dd0000"></rect><rect y="10.66" width="24" height="5.34" fill="#ffce00"></rect>',
    fr:
      '<rect width="8" height="16" fill="#0055a4"></rect><rect x="8" width="8" height="16" fill="#fff"></rect><rect x="16" width="8" height="16" fill="#ef4135"></rect>',
    it:
      '<rect width="8" height="16" fill="#009246"></rect><rect x="8" width="8" height="16" fill="#fff"></rect><rect x="16" width="8" height="16" fill="#ce2b37"></rect>',
    es:
      '<rect width="24" height="16" fill="#aa151b"></rect><rect y="4" width="24" height="8" fill="#f1bf00"></rect>',
    nl:
      '<rect width="24" height="5.34" fill="#ae1c28"></rect><rect y="5.33" width="24" height="5.34" fill="#fff"></rect><rect y="10.66" width="24" height="5.34" fill="#21468b"></rect>',
    pl: '<rect width="24" height="8" fill="#fff"></rect><rect y="8" width="24" height="8" fill="#dc143c"></rect>',
    ru:
      '<rect width="24" height="5.34" fill="#fff"></rect><rect y="5.33" width="24" height="5.34" fill="#0039a6"></rect><rect y="10.66" width="24" height="5.34" fill="#d52b1e"></rect>',
    tr:
      '<rect width="24" height="16" fill="#e30a17"></rect><circle cx="10" cy="8" r="4.2" fill="#fff"></circle><circle cx="11.2" cy="8" r="3.35" fill="#e30a17"></circle><path d="M15.1 5.9l.45 1.32h1.42l-1.15.82.44 1.33-1.16-.83-1.14.83.43-1.33-1.15-.82h1.42z" fill="#fff"></path>',
  };
  const FLAG_FALLBACK_SVG_MARKUP =
    '<rect width="24" height="16" fill="#ebe2c9"></rect><circle cx="12" cy="8" r="4.2" fill="none" stroke="#56631f" stroke-width="1.4"></circle><path d="M8 8h8M12 3.8c1.5 1.9 1.5 6.5 0 8.4M12 3.8c-1.5 1.9-1.5 6.5 0 8.4" stroke="#56631f" stroke-width="1.1" fill="none"></path>';
  const DOM_IDS = {
    nav: "qr-nav",
    kicker: "qr-kicker",
    title: "qr-title",
    currentStopLabel: "current-stop-label",
    spotControlLabel: "spot-control-label",
    languageControlLabel: "language-control-label",
    activeSpotLabel: "active-spot-label",
    activeLanguageLabel: "active-language-label",
    spotMenu: "spot-menu",
    spotTrigger: "spot-menu-trigger",
    spotSwitcher: "spot-switcher",
    languageMenu: "language-menu",
    languageTrigger: "language-menu-trigger",
    languageSwitcher: "language-switcher",
    main: "qr-main",
    announcer: "qr-announcer",
  };

  const state = {
    lang: i18n.defaultLanguage,
    activeSpot: null,
    galleries: {},
    shouldNormalizeUrl: false,
    shouldScrollToSpot: false,
  };

  const elements = Object.keys(DOM_IDS).reduce(function (result, key) {
    result[key] = document.getElementById(DOM_IDS[key]);
    return result;
  }, {});

  assertRequiredElements();

  // Shared formatting and normalization helpers.
  function assertRequiredElements() {
    const missingIds = Object.keys(DOM_IDS)
      .filter(function (key) {
        return !elements[key];
      })
      .map(function (key) {
        return "#" + DOM_IDS[key];
      });

    if (missingIds.length) {
      throw new Error("Mylotopi QR guide DOM is missing required elements: " + missingIds.join(", "));
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTemplate(template, values) {
    return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  function normalizeQueryParam(value) {
    return value.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
  }

  function normalizeSpot(value) {
    if (!value) {
      return null;
    }

    const key = normalizeQueryParam(value);
    return SPOT_ORDER.includes(key) ? key : null;
  }

  function getDefaultSpot() {
    return (
      SPOT_ORDER.find(function (spotId) {
        return Boolean(SPOTS_BY_ID[spotId]);
      }) || null
    );
  }

  function getSpotAnchorId(spotId) {
    const spot = SPOTS_BY_ID[spotId];
    return spot && spot.anchorId ? spot.anchorId : spotId;
  }

  function getSpotSection(spotId) {
    return spotId ? document.getElementById(getSpotAnchorId(spotId)) : null;
  }

  function getSpotIndex(spotId) {
    return SPOT_ORDER.indexOf(spotId);
  }

  function getAdjacentSpot(spotId, direction) {
    const nextIndex = getSpotIndex(spotId) + direction;
    return nextIndex >= 0 && nextIndex < SPOT_ORDER.length ? SPOT_ORDER[nextIndex] : null;
  }

  // Audio lifecycle helpers.
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
    const section = player.closest(".qr-stop[data-spot]");
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
    const player = getAudioPlayerForSpot(spotId);

    stopAudioPlayersExcept(spotId);
    resetAudioPlayer(player);
    loadAudioMetadata(player);
  }

  // Structured copy rendering.
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

    return '<ul class="qr-copy__list">' + group.items.map(renderCopyItem).join("") + "</ul>";
  }

  function renderCopyBlock(block, bulletGroupsById) {
    if (typeof block === "string") {
      return "<p>" + escapeHtml(block) + "</p>";
    }

    if (!block || typeof block !== "object") {
      return "";
    }

    if (block.type === "heading" && block.text) {
      return '<h3 class="qr-copy__heading">' + escapeHtml(block.text) + "</h3>";
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

  function renderReadMore(spotId, content, ui) {
    const detailBlocks = content.details || [];
    const bulletGroupsById = getBulletGroupsById(content.bullets);
    const bodyMarkup = renderCopyBlocks(detailBlocks, bulletGroupsById);
    if (!bodyMarkup) {
      return "";
    }

    const copyId = "qr-copy-" + spotId;

    return (
      '<div class="qr-readmore" data-read-more-wrap>' +
      '<div class="qr-readmore__panel" id="' +
      escapeHtml(copyId) +
      '" data-copy-panel data-expanded="false" style="max-height:0px" hidden>' +
      '<div class="qr-copy">' +
      bodyMarkup +
      "</div></div>" +
      '<button class="qr-readmore__button" type="button" data-copy-toggle aria-expanded="false" aria-controls="' +
      escapeHtml(copyId) +
      '" data-read-more="' +
      escapeHtml(ui.readMore) +
      '" data-read-less="' +
      escapeHtml(ui.readLess) +
      '">' +
      '<span data-copy-toggle-label>' +
      escapeHtml(ui.readMore) +
      '</span><span class="qr-readmore__chevron" aria-hidden="true"></span>' +
      "</button></div>"
    );
  }

  function renderActivityCard(content, ui) {
    const challenge = content.challenge;
    if (!challenge || !Array.isArray(challenge.items) || !challenge.items.length) {
      return "";
    }

    const label = challenge.label || ui.challengeLabel;
    const title = challenge.title || ui.challengeTitle;
    const intro = challenge.intro ? '<p class="qr-activity__intro">' + escapeHtml(challenge.intro) + "</p>" : "";

    return (
      '<aside class="qr-activity" aria-label="' +
      escapeHtml(label) +
      '">' +
      '<p class="qr-activity__label">' +
      escapeHtml(label) +
      "</p>" +
      '<h3 class="qr-activity__title">' +
      escapeHtml(title) +
      "</h3>" +
      intro +
      '<ul class="qr-activity__list">' +
      challenge.items.map(renderCopyItem).join("") +
      "</ul></aside>"
    );
  }

  // Gallery rendering and in-place image updates.
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

  function normalizeImageFit(value) {
    return value === "contain" ? "contain" : "cover";
  }

  function normalizeImagePosition(value) {
    const position = value || "center";
    return /^[a-z0-9.%\-\s]+$/i.test(position) ? position : "center";
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

  function getGalleryIndex(spotId) {
    const images = getSpotImages(spotId);
    const index = state.galleries[spotId] || 0;
    return images.length ? Math.min(index, images.length - 1) : 0;
  }

  function renderImageCounter(index, total, ui) {
    return formatTemplate(ui.imageCounter, {
      current: String(index + 1),
      total: String(total),
    });
  }

  function renderGallery(spotId, content, ui) {
    const images = getSpotImages(spotId);
    const index = getGalleryIndex(spotId);
    const image = getGalleryImage(spotId, index);
    const escapedSpotId = escapeHtml(spotId);

    if (!images.length || !image) {
      return (
        '<div class="qr-carousel" data-gallery-spot="' +
        escapedSpotId +
        '">' +
        '<div class="qr-media qr-carousel__frame is-placeholder" role="img" aria-label="' +
        escapeHtml(i18n.getImageAlt(spotId, state.lang)) +
        '"><div class="qr-media__placeholder"><span>' +
        escapeHtml(ui.imagePlaceholderLabel) +
        "</span><strong>" +
        escapeHtml(content.shortTitle || content.title) +
        "</strong><small>" +
        escapeHtml(ui.imagePlaceholderHint) +
        "</small></div></div></div>"
      );
    }

    const controlsMarkup =
      images.length > 1
        ? '<figcaption class="qr-carousel__controls">' +
          '<button class="qr-carousel__button" type="button" data-gallery-direction="-1" aria-label="' +
          escapeHtml(ui.galleryPrevious) +
          '"' +
          (index === 0 ? " disabled" : "") +
          '><span aria-hidden="true">&lsaquo;</span></button>' +
          '<span class="qr-carousel__counter">' +
          escapeHtml(renderImageCounter(index, images.length, ui)) +
          "</span>" +
          '<button class="qr-carousel__button" type="button" data-gallery-direction="1" aria-label="' +
          escapeHtml(ui.galleryNext) +
          '"' +
          (index === images.length - 1 ? " disabled" : "") +
          '><span aria-hidden="true">&rsaquo;</span></button>' +
          "</figcaption>"
        : "";

    return (
      '<figure class="qr-carousel" data-gallery-spot="' +
      escapedSpotId +
      '">' +
      '<div class="qr-media qr-carousel__frame" data-image-fit="' +
      escapeHtml(image.fit) +
      '"><img class="qr-carousel__image" src="' +
      escapeHtml(image.src) +
      '" alt="' +
      escapeHtml(image.alt || i18n.getImageAlt(spotId, state.lang)) +
      '" loading="' +
      (spotId === state.activeSpot ? "eager" : "lazy") +
      '" decoding="async" style="--image-fit:' +
      escapeHtml(image.fit) +
      ";--image-position:" +
      escapeHtml(image.position) +
      '"></div>' +
      controlsMarkup +
      "</figure>"
    );
  }

  function updateGalleryView(spotId) {
    const gallery = elements.main.querySelector('[data-gallery-spot="' + spotId + '"]');
    const images = getSpotImages(spotId);
    const image = getGalleryImage(spotId, getGalleryIndex(spotId));

    if (!gallery || !images.length || !image) {
      return;
    }

    const frame = gallery.querySelector(".qr-carousel__frame");
    const imageElement = gallery.querySelector(".qr-carousel__image");
    const count = gallery.querySelector(".qr-carousel__counter");
    const previousButton = gallery.querySelector('button[data-gallery-direction="-1"]');
    const nextButton = gallery.querySelector('button[data-gallery-direction="1"]');
    const index = getGalleryIndex(spotId);

    if (!frame || !imageElement || (images.length > 1 && (!count || !previousButton || !nextButton))) {
      gallery.outerHTML = renderGallery(spotId, i18n.getSpotText(spotId, state.lang), i18n.getUi(state.lang));
      return;
    }

    frame.dataset.imageFit = image.fit;
    imageElement.src = image.src;
    imageElement.alt = image.alt || i18n.getImageAlt(spotId, state.lang);
    imageElement.style.setProperty("--image-fit", image.fit);
    imageElement.style.setProperty("--image-position", image.position);

    if (count && previousButton && nextButton) {
      count.textContent = renderImageCounter(index, images.length, i18n.getUi(state.lang));
      previousButton.disabled = index === 0;
      nextButton.disabled = index === images.length - 1;
    }
  }

  function renderAudioBlock(audio, content, ui) {
    const audioLabel = formatTemplate(ui.audioAriaLabel, {
      label: ui.audioHeading,
      title: content.title,
    });
    const audioMarkup = audio.path
      ? '<audio class="qr-audio__player" controls preload="metadata" aria-label="' +
        escapeHtml(audioLabel) +
        '"><source src="' +
        escapeHtml(audio.path) +
        '"' +
        (resolveAudioMimeType(audio.path) ? ' type="' + escapeHtml(resolveAudioMimeType(audio.path)) + '"' : "") +
        "></audio>"
      : '<p class="qr-audio__fallback">' + escapeHtml(ui.audioFallback) + "</p>";

    return (
      '<section class="qr-audio" aria-label="' +
      escapeHtml(ui.audioHeading) +
      '">' +
      '<div class="qr-audio__head"><p class="qr-audio__label">' +
      escapeHtml(ui.audioHeading) +
      "</p><p class=\"qr-audio__title\"><span>" +
      escapeHtml(ui.audioTitleLabel) +
      "</span><strong>" +
      escapeHtml(content.title) +
      "</strong></p></div>" +
      (audio.caption ? '<p class="qr-audio__caption">' + escapeHtml(audio.caption) + "</p>" : "") +
      audioMarkup +
      "</section>"
    );
  }

  // Navigation, language, and Mini-map rendering.
  function renderStopNavButton(direction, targetSpot, ui) {
    const isPrevious = direction < 0;
    const label = isPrevious ? ui.previousStop : ui.nextStop;
    const ariaTemplate = isPrevious ? ui.previousStopAria : ui.nextStopAria;
    const targetTitle = targetSpot ? i18n.getSpotLabel(targetSpot, state.lang) : "";

    return (
      '<button class="qr-stop-nav__button' +
      (isPrevious ? " qr-stop-nav__button--previous" : " qr-stop-nav__button--next") +
      '" type="button" data-tour-nav="' +
      String(direction) +
      '"' +
      (targetSpot
        ? ' data-target-spot="' +
          escapeHtml(targetSpot) +
          '" aria-label="' +
          escapeHtml(formatTemplate(ariaTemplate, { title: targetTitle })) +
          '"'
        : " disabled") +
      ">" +
      '<span class="qr-stop-nav__meta">' +
      escapeHtml(label) +
      "</span>" +
      (targetTitle ? '<strong class="qr-stop-nav__title">' + escapeHtml(targetTitle) + "</strong>" : "") +
      "</button>"
    );
  }

  function renderStopNavigation(spotId, ui) {
    const previousSpot = getAdjacentSpot(spotId, -1);
    const nextSpot = getAdjacentSpot(spotId, 1);

    return (
      '<nav class="qr-stop-nav" aria-label="' +
      escapeHtml(ui.spotsLabel) +
      '">' +
      renderStopNavButton(-1, previousSpot, ui) +
      renderStopNavButton(1, nextSpot, ui) +
      "</nav>"
    );
  }

  function renderFlagIcon(lang) {
    const flagMarkup = FLAG_SVG_MARKUP[lang] || FLAG_FALLBACK_SVG_MARKUP;
    return (
      '<svg class="flag-icon" viewBox="0 0 24 16" aria-hidden="true" focusable="false">' +
      flagMarkup +
      "</svg>"
    );
  }

  function renderLanguageOptionLabel(lang) {
    return (
      renderFlagIcon(lang) +
      '<span class="language-option__name">' +
      escapeHtml(i18n.getLanguageName(lang)) +
      "</span>"
    );
  }

  function renderLanguageButtons() {
    const ui = i18n.getUi(state.lang);
    const activeLanguageName = i18n.getLanguageName(state.lang);

    elements.activeLanguageLabel.innerHTML = renderLanguageOptionLabel(state.lang);
    elements.languageTrigger.setAttribute("aria-label", ui.languageLabel + ": " + activeLanguageName);
    elements.languageMenu.setAttribute("aria-label", ui.languageLabel);
    elements.languageSwitcher.setAttribute("aria-label", ui.languageLabel);

    elements.languageSwitcher.innerHTML = i18n.supportedLanguages.map(function (langKey) {
      const pressed = langKey === state.lang;
      const languageName = i18n.getLanguageName(langKey);

      return (
        '<button class="selector__option language-option" type="button" data-lang="' +
        escapeHtml(langKey) +
        '" aria-label="' +
        escapeHtml(ui.languageLabel + ": " + languageName) +
        '" aria-pressed="' +
        String(pressed) +
        '" aria-current="' +
        (pressed ? "true" : "false") +
        '">' +
        renderLanguageOptionLabel(langKey) +
        "</button>"
      );
    }).join("");
  }

  function renderSpotButtons() {
    const ui = i18n.getUi(state.lang);
    const activeLabel = state.activeSpot ? i18n.getSpotLabel(state.activeSpot, state.lang) : ui.stopSelectorPlaceholder;
    const triggerLabel = ui.stopSelectorLabel || ui.spotsLabel;

    elements.activeSpotLabel.textContent = activeLabel;
    elements.spotControlLabel.textContent = triggerLabel;
    elements.spotTrigger.setAttribute("aria-label", triggerLabel + ": " + activeLabel);
    elements.spotMenu.setAttribute("aria-label", ui.spotsLabel);
    elements.spotSwitcher.setAttribute("aria-label", ui.spotsLabel);

    elements.spotSwitcher.innerHTML = SPOT_ORDER.map(function (spotId, index) {
      const isActive = spotId === state.activeSpot;
      const stopNumber = String(index + 1).padStart(2, "0");

      return (
        '<button class="selector__option selector__option--stop" type="button" data-spot="' +
        escapeHtml(spotId) +
        '" aria-current="' +
        (isActive ? "true" : "false") +
        '">' +
        '<span class="selector__option-number">' +
        stopNumber +
        "</span><span>" +
        escapeHtml(i18n.getSpotLabel(spotId, state.lang)) +
        "</span></button>"
      );
    }).join("");
  }

  function renderMiniMap(ui) {
    const miniMap = i18n.getMiniMap(state.lang);
    const modalTitleId = "qr-map-modal-title";
    const openLabel = ui.miniMapOpen || ui.miniMapView || ui.miniMapTitle;
    const tapHint = ui.miniMapTapHint || openLabel;
    const openAriaLabel = openLabel + ": " + (ui.miniMapImageAlt || ui.miniMapTitle);

    if (!miniMap || !miniMap.path) {
      return "";
    }

    return (
      '<section class="minimap-section" aria-labelledby="qr-minimap-title">' +
      '<button class="minimap-card" type="button" data-map-open aria-label="' +
      escapeHtml(openAriaLabel) +
      '">' +
      '<span class="minimap-card__header">' +
      '<span class="minimap-card__label" id="qr-minimap-title">' +
      escapeHtml(ui.miniMapTitle) +
      "</span>" +
      (ui.miniMapDescription ? '<span class="minimap-card__description">' + escapeHtml(ui.miniMapDescription) + "</span>" : "") +
      "</span>" +
      '<span class="minimap-card__figure"><img class="minimap-card__image" src="' +
      escapeHtml(miniMap.path) +
      '" alt="' +
      escapeHtml(ui.miniMapImageAlt) +
      '" loading="lazy" decoding="async"><span class="minimap-card__hint">' +
      escapeHtml(tapHint) +
      "</span></span>" +
      "</button>" +
      '<div class="minimap-modal" data-map-modal role="dialog" aria-modal="true" aria-labelledby="' +
      escapeHtml(modalTitleId) +
      '" hidden>' +
      '<button class="minimap-modal__backdrop" type="button" data-map-close aria-label="' +
      escapeHtml(ui.miniMapModalClose) +
      '"></button>' +
      '<div class="minimap-modal__dialog">' +
      '<div class="minimap-modal__head"><h2 class="minimap-modal__title" id="' +
      escapeHtml(modalTitleId) +
      '">' +
      escapeHtml(ui.miniMapTitle) +
      '</h2><div class="minimap-modal__actions"><a class="minimap-modal__download" href="' +
      escapeHtml(miniMap.path) +
      '" download>' +
      escapeHtml(ui.miniMapDownload) +
      '</a><button class="minimap-modal__close" type="button" data-map-close>' +
      escapeHtml(ui.miniMapModalClose) +
      "</button></div></div>" +
      '<img class="minimap-modal__image" src="' +
      escapeHtml(miniMap.path) +
      '" alt="' +
      escapeHtml(ui.miniMapImageAlt) +
      '" decoding="async">' +
      "</div></div></section>"
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
      const sectionLabel =
        sectionIndex + ui.stopLabelSeparator + (content.shortTitle || content.title || i18n.getSpotLabel(spotId, state.lang));

      return (
        '<article class="qr-stop' +
        (isActive ? " is-active" : "") +
        '" id="' +
        escapeHtml(getSpotAnchorId(spotId)) +
        '" data-spot="' +
        escapeHtml(spotId) +
        '" tabindex="-1" style="--stop-accent:' +
        escapeHtml(spot.accent) +
        ";--stop-accent-soft:" +
        escapeHtml(spot.accentSoft) +
        ';">' +
        '<header class="qr-stop__header">' +
        '<p class="qr-stop__eyebrow">' +
        escapeHtml(sectionLabel) +
        "</p>" +
        '<h2 class="qr-stop__title">' +
        escapeHtml(content.title) +
        "</h2>" +
        (isActive ? '<span class="qr-stop__badge">' + escapeHtml(ui.selectedBadge) + "</span>" : "") +
        "</header>" +
        renderGallery(spotId, content, ui) +
        renderAudioBlock(audio, content, ui) +
        '<p class="qr-stop__preview">' +
        escapeHtml(content.preview || content.shortText) +
        "</p>" +
        renderReadMore(spotId, content, ui) +
        renderActivityCard(content, ui) +
        renderStopNavigation(spotId, ui) +
        "</article>"
      );
    }).join("");

    elements.main.innerHTML = renderMiniMap(ui) + sectionsMarkup;
  }

  function syncHeroCurrentStop() {
    const ui = i18n.getUi(state.lang);
    const label = state.activeSpot ? i18n.getSpotLabel(state.activeSpot, state.lang) : ui.stopSelectorPlaceholder;
    elements.currentStopLabel.textContent = ui.currentStopLabel + ": " + label;
  }

  // Runtime state, URL sync, and focus management.
  function syncActiveState() {
    const ui = i18n.getUi(state.lang);

    elements.main.querySelectorAll(".qr-stop").forEach(function (section) {
      const isActive = section.dataset.spot === state.activeSpot;
      section.classList.toggle("is-active", isActive);

      const badge = section.querySelector(".qr-stop__badge");
      if (isActive && !badge) {
        const badgeElement = document.createElement("span");
        badgeElement.className = "qr-stop__badge";
        badgeElement.textContent = ui.selectedBadge;
        section.querySelector(".qr-stop__header").appendChild(badgeElement);
      }

      if (!isActive && badge) {
        badge.remove();
      }
    });

    syncHeroCurrentStop();
    renderSpotButtons();
  }

  function updateUrl(options) {
    const settings = Object.assign(
      {
        includeSpot: true,
      },
      options || {}
    );
    const url = new URL(window.location.href);

    if (settings.includeSpot && state.activeSpot) {
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

  function getMapModal() {
    return elements.main.querySelector("[data-map-modal]");
  }

  function openMapModal() {
    const modal = getMapModal();
    if (!modal) {
      return;
    }

    closeMenus();
    modal.hidden = false;
    document.body.classList.add("is-map-modal-open");

    const closeButton = modal.querySelector(".minimap-modal__close");
    if (closeButton) {
      closeButton.focus({ preventScroll: true });
    }
  }

  function closeMapModal(restoreFocus) {
    const modal = getMapModal();
    if (!modal || modal.hidden) {
      return false;
    }

    modal.hidden = true;
    document.body.classList.remove("is-map-modal-open");

    if (restoreFocus) {
      const openButton = elements.main.querySelector("[data-map-open]");
      if (openButton) {
        openButton.focus({ preventScroll: true });
      }
    }

    return true;
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

    if (!nextSpot) {
      return;
    }

    state.activeSpot = nextSpot;

    if (previousSpot !== state.activeSpot) {
      activateSpotAudio(state.activeSpot);
    }

    syncActiveState();

    if (settings.updateUrl) {
      updateUrl();
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
      }, settings.behavior === "smooth" ? 280 : 0);
    }

    announceActiveSpot();
  }

  function renderGuide() {
    const ui = i18n.getUi(state.lang);
    const heroTitle = ui.heroTitle || ui.pageTitle;

    document.documentElement.lang = state.lang;
    document.title = heroTitle + " | Mylotopi";
    document.body.classList.remove("is-map-modal-open");
    elements.nav.setAttribute("aria-label", ui.navigationLabel);
    elements.spotControlLabel.textContent = ui.stopSelectorLabel || ui.spotsLabel;
    elements.languageControlLabel.textContent = ui.languageLabel;
    elements.kicker.textContent = ui.kicker;
    elements.title.textContent = heroTitle;

    renderLanguageButtons();
    renderSections();
    renderSpotButtons();
    syncHeroCurrentStop();
    bindAudioPlayers();
    loadAudioMetadata(getAudioPlayerForSpot(state.activeSpot));
  }

  function bindAudioPlayers() {
    getAudioPlayers().forEach(function (player) {
      player.addEventListener("play", function () {
        stopAudioPlayersExcept(getAudioPlayerSpot(player));
      });
    });
  }

  // Event handlers.
  function applyLocation() {
    const params = new URLSearchParams(window.location.search);
    const rawLang = params.get("lang");
    const rawSpot = params.get("spot");
    const hasLangParam = params.has("lang");
    const hasSpotParam = params.has("spot");
    const canonicalRawLang = hasLangParam ? normalizeQueryParam(rawLang || "") : null;
    const canonicalRawSpot = hasSpotParam ? normalizeQueryParam(rawSpot || "") : null;
    const normalizedLang = i18n.normalizeLanguage(rawLang) || i18n.defaultLanguage;
    const requestedSpot = hasSpotParam ? normalizeSpot(rawSpot) : null;
    const normalizedSpot = requestedSpot || getDefaultSpot();

    state.lang = normalizedLang;
    state.activeSpot = normalizedSpot;
    state.shouldScrollToSpot = Boolean(requestedSpot);
    state.shouldNormalizeUrl =
      (hasLangParam && canonicalRawLang !== normalizedLang) ||
      (hasSpotParam && (!requestedSpot || canonicalRawSpot !== requestedSpot));
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

    closeMenus();
    moveToSpot(button.dataset.spot, getNavigationOptions());
  }

  function handleMiniMapClick(event) {
    const openButton = event.target.closest("[data-map-open]");
    if (openButton) {
      event.preventDefault();
      openMapModal();
      return;
    }

    const closeButton = event.target.closest("[data-map-close]");
    if (closeButton) {
      event.preventDefault();
      closeMapModal(true);
    }
  }

  function handleMiniMapKeydown(event) {
    const openButton = event.target.closest("[data-map-open]");
    const isActivationKey = event.key === "Enter" || event.key === " " || event.key === "Spacebar";

    if (!openButton || !isActivationKey) {
      return;
    }

    event.preventDefault();
    openMapModal();
  }

  function handleStopNavClick(event) {
    const button = event.target.closest("button[data-tour-nav]");
    if (!button || button.disabled) {
      return;
    }

    moveToSpot(button.dataset.targetSpot, getNavigationOptions());
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
    updateGalleryView(spotId);
  }

  function handleCopyToggle(event) {
    const button = event.target.closest("button[data-copy-toggle]");
    if (!button) {
      return;
    }

    const copyWrap = button.closest("[data-read-more-wrap]");
    const copyPanel = copyWrap ? copyWrap.querySelector("[data-copy-panel]") : null;
    if (!copyWrap || !copyPanel) {
      return;
    }

    const isExpanded = button.getAttribute("aria-expanded") === "true";
    const nextExpanded = !isExpanded;
    const previousButtonTop = button.getBoundingClientRect().top;
    const readMoreLabel = button.dataset.readMore;
    const readLessLabel = button.dataset.readLess;
    const buttonLabel = button.querySelector("[data-copy-toggle-label]");

    if (nextExpanded) {
      copyPanel.hidden = false;
      copyWrap.classList.add("is-expanded");
      copyPanel.style.maxHeight = "0px";
      window.requestAnimationFrame(function () {
        copyPanel.style.maxHeight = copyPanel.scrollHeight + "px";
      });
    } else {
      copyPanel.style.maxHeight = copyPanel.scrollHeight + "px";
      window.requestAnimationFrame(function () {
        copyWrap.classList.remove("is-expanded");
        copyPanel.style.maxHeight = "0px";
      });
    }

    copyPanel.dataset.expanded = String(nextExpanded);
    button.setAttribute("aria-expanded", String(nextExpanded));
    if (buttonLabel) {
      buttonLabel.textContent = nextExpanded ? readLessLabel : readMoreLabel;
    } else {
      button.textContent = nextExpanded ? readLessLabel : readMoreLabel;
    }

    if (!nextExpanded) {
      window.setTimeout(function () {
        copyPanel.hidden = true;
        const nextButtonTop = button.getBoundingClientRect().top;
        window.scrollBy({
          top: nextButtonTop - previousButtonTop,
          behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
        });
      }, 220);
    }
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
      if (closeMapModal(true)) {
        event.preventDefault();
        return;
      }

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
    const ui = i18n.getUi(state.lang);

    console.error(error);
    elements.main.innerHTML =
      '<div class="qr-load-error" role="alert">' +
      "<strong>" +
      escapeHtml(ui.loadErrorTitle) +
      "</strong>" +
      "<span>" +
      escapeHtml(ui.loadErrorBody) +
      "</span>" +
      "</div>";
  }

  async function init() {
    await i18n.loadContent();

    applyLocation();
    renderGuide();
    syncActiveState();

    if (state.shouldNormalizeUrl) {
      updateUrl({
        includeSpot: state.shouldScrollToSpot,
      });
      state.shouldNormalizeUrl = false;
    }

    elements.languageSwitcher.addEventListener("click", handleLanguageClick);
    elements.spotSwitcher.addEventListener("click", handleSpotClick);
    elements.main.addEventListener("click", handleMiniMapClick);
    elements.main.addEventListener("keydown", handleMiniMapKeydown);
    elements.main.addEventListener("click", handleStopNavClick);
    elements.main.addEventListener("click", handleGalleryClick);
    elements.main.addEventListener("click", handleCopyToggle);
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeydown);
    elements.spotMenu.addEventListener("toggle", handleMenuToggle);
    elements.languageMenu.addEventListener("toggle", handleMenuToggle);

    if (state.shouldScrollToSpot && state.activeSpot) {
      window.setTimeout(function () {
        moveToSpot(state.activeSpot, {
          behavior: "auto",
          focus: true,
          updateUrl: false,
        });
      }, 90);
    }
  }

  init().catch(showFatalError);
})();
