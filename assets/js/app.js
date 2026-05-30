(function () {
  const meta = window.MYLOTOPI_GUIDE_META;
  const i18n = window.MYLOTOPI_GUIDE_I18N;

  if (!meta || !i18n) {
    throw new Error("Mylotopi guide dependencies are missing.");
  }

  const SECTION_ORDER = Array.isArray(meta.sectionOrder) ? meta.sectionOrder.slice() : Object.keys(meta.sections || {});
  const SECTIONS_BY_ID = meta.sections || {};
  const LEGACY_SECTION_IDS = {
    "garden-herbs": "herb-garden",
    "windmill-base": "windmill-first-floor",
    "sleeping-area": "windmill-second-floor",
    machinery: "windmill-third-floor",
  };
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
    currentSectionLabel: "current-stop-label",
    sectionControlLabel: "spot-control-label",
    languageControlLabel: "language-control-label",
    activeSectionLabel: "active-spot-label",
    activeLanguageLabel: "active-language-label",
    sectionMenu: "spot-menu",
    sectionTrigger: "spot-menu-trigger",
    sectionSwitcher: "spot-switcher",
    languageMenu: "language-menu",
    languageTrigger: "language-menu-trigger",
    languageSwitcher: "language-switcher",
    main: "qr-main",
    announcer: "qr-announcer",
  };

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

  function normalizeImageFit(value) {
    return value === "contain" ? "contain" : "cover";
  }

  function normalizeImagePosition(value) {
    const position = value || "center";
    return /^[a-z0-9.%\-\s]+$/i.test(position) ? position : "center";
  }

  function renderFlagIcon(lang) {
    return (
      '<svg class="language-option__flag" viewBox="0 0 24 16" aria-hidden="true" focusable="false">' +
      (FLAG_SVG_MARKUP[lang] || FLAG_FALLBACK_SVG_MARKUP) +
      "</svg>"
    );
  }

  function assertRequiredElements(elements) {
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

  class GuideState {
    constructor(defaultLanguage, defaultSectionId) {
      this.lang = defaultLanguage;
      this.activeSectionId = defaultSectionId;
      this.galleries = {};
      this.shouldNormalizeUrl = false;
      this.shouldScrollToSection = false;
      this.includeSectionInUrl = false;
    }

    getGalleryIndex(sectionId, totalImages) {
      const index = this.galleries[sectionId] || 0;
      return totalImages ? Math.min(index, totalImages - 1) : 0;
    }

    setGalleryIndex(sectionId, index) {
      this.galleries[sectionId] = index;
    }
  }

  class AudioController {
    constructor(rootElement, getSectionElement) {
      this.rootElement = rootElement;
      this.getSectionElement = getSectionElement;
    }

    getPlayers() {
      return Array.from(this.rootElement.querySelectorAll("audio"));
    }

    getPlayerSectionId(player) {
      const section = player.closest(".qr-stop[data-section]");
      return section ? section.dataset.section : null;
    }

    getPlayerForSection(sectionId) {
      const section = this.getSectionElement(sectionId);
      return section ? section.querySelector("audio") : null;
    }

    resetPlayer(player) {
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

    loadMetadata(player) {
      if (!player) {
        return;
      }

      player.preload = "metadata";
      if (player.readyState === HTMLMediaElement.HAVE_NOTHING) {
        player.load();
      }
    }

    stopAll() {
      this.getPlayers().forEach((player) => {
        this.resetPlayer(player);
      });
    }

    stopExcept(sectionId) {
      this.getPlayers().forEach((player) => {
        if (this.getPlayerSectionId(player) !== sectionId) {
          this.resetPlayer(player);
        }
      });
    }

    activate(sectionId) {
      const player = this.getPlayerForSection(sectionId);

      this.stopExcept(sectionId);
      this.resetPlayer(player);
      this.loadMetadata(player);
    }

    bindPlayers() {
      this.getPlayers().forEach((player) => {
        player.addEventListener("play", () => {
          this.stopExcept(this.getPlayerSectionId(player));
        });
      });
    }
  }

  class GuideRenderer {
    constructor(config) {
      this.meta = config.meta;
      this.content = config.content;
      this.state = config.state;
      this.elements = config.elements;
      this.sectionOrder = config.sectionOrder;
      this.sectionsById = config.sectionsById;
    }

    getSectionMeta(sectionId) {
      return this.sectionsById[sectionId] || null;
    }

    getSectionImages(sectionId) {
      const section = this.getSectionMeta(sectionId);
      return section && Array.isArray(section.images) ? section.images : [];
    }

    getGalleryImage(sectionId, index) {
      const images = this.getSectionImages(sectionId);
      const image = images[index];

      if (typeof image === "string") {
        return {
          src: image,
          alt: this.content.getImageAlt(sectionId, this.state.lang),
          fit: "cover",
          position: "center",
        };
      }

      if (!image || !image.src) {
        return null;
      }

      return {
        src: image.src,
        alt: this.content.getImageAlt(sectionId, this.state.lang),
        fit: normalizeImageFit(image.fit),
        position: normalizeImagePosition(image.position),
      };
    }

    renderCopyItem(item) {
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

    renderList(block) {
      if (!block || !Array.isArray(block.items)) {
        return "";
      }

      return '<ul class="qr-copy__list">' + block.items.map((item) => this.renderCopyItem(item)).join("") + "</ul>";
    }

    renderCopyBlock(block) {
      if (typeof block === "string") {
        return "<p>" + escapeHtml(block) + "</p>";
      }

      if (!block || typeof block !== "object") {
        return "";
      }

      if (block.type === "heading" && block.text) {
        return '<h3 class="qr-copy__heading">' + escapeHtml(block.text) + "</h3>";
      }

      if (block.type === "list" && Array.isArray(block.items)) {
        return this.renderList(block);
      }

      if (block.text) {
        return "<p>" + escapeHtml(block.text) + "</p>";
      }

      return "";
    }

    renderCopyBlocks(blocks) {
      return (blocks || [])
        .map((block) => {
          return this.renderCopyBlock(block);
        })
        .join("");
    }

    renderReadMore(sectionId, section, ui) {
      const bodyMarkup = this.renderCopyBlocks(section.details || []);
      if (!bodyMarkup) {
        return "";
      }

      const copyId = "qr-copy-" + sectionId;

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

    renderActivityCard(section, ui) {
      const challenge = section.challenge;
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
        challenge.items.map((item) => this.renderCopyItem(item)).join("") +
        "</ul></aside>"
      );
    }

    renderImageCounter(index, total, ui) {
      return formatTemplate(ui.imageCounter, {
        current: String(index + 1),
        total: String(total),
      });
    }

    renderGallery(sectionId, section, ui) {
      const images = this.getSectionImages(sectionId);
      const index = this.state.getGalleryIndex(sectionId, images.length);
      const image = this.getGalleryImage(sectionId, index);
      const escapedSectionId = escapeHtml(sectionId);

      if (!images.length || !image) {
        return (
          '<div class="qr-carousel" data-gallery-section="' +
          escapedSectionId +
          '">' +
          '<div class="qr-media qr-carousel__frame is-placeholder" role="img" aria-label="' +
          escapeHtml(this.content.getImageAlt(sectionId, this.state.lang)) +
          '"><div class="qr-media__placeholder"><span>' +
          escapeHtml(ui.imagePlaceholderLabel) +
          "</span><strong>" +
          escapeHtml(section.navigationTitle || section.title) +
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
            escapeHtml(this.renderImageCounter(index, images.length, ui)) +
            "</span>" +
            '<button class="qr-carousel__button" type="button" data-gallery-direction="1" aria-label="' +
            escapeHtml(ui.galleryNext) +
            '"' +
            (index === images.length - 1 ? " disabled" : "") +
            '><span aria-hidden="true">&rsaquo;</span></button>' +
            "</figcaption>"
          : "";

      return (
        '<figure class="qr-carousel" data-gallery-section="' +
        escapedSectionId +
        '">' +
        '<div class="qr-media qr-carousel__frame" data-image-fit="' +
        escapeHtml(image.fit) +
        '"><img class="qr-carousel__image" src="' +
        escapeHtml(image.src) +
        '" alt="' +
        escapeHtml(image.alt) +
        '" loading="' +
        (sectionId === this.state.activeSectionId ? "eager" : "lazy") +
        '" decoding="async" style="--image-fit:' +
        escapeHtml(image.fit) +
        ";--image-position:" +
        escapeHtml(image.position) +
        '"></div>' +
        controlsMarkup +
        "</figure>"
      );
    }

    updateGalleryView(sectionId) {
      const gallery = this.elements.main.querySelector('[data-gallery-section="' + sectionId + '"]');
      const images = this.getSectionImages(sectionId);
      const image = this.getGalleryImage(sectionId, this.state.getGalleryIndex(sectionId, images.length));

      if (!gallery || !images.length || !image) {
        return;
      }

      const frame = gallery.querySelector(".qr-carousel__frame");
      const imageElement = gallery.querySelector(".qr-carousel__image");
      const count = gallery.querySelector(".qr-carousel__counter");
      const previousButton = gallery.querySelector('button[data-gallery-direction="-1"]');
      const nextButton = gallery.querySelector('button[data-gallery-direction="1"]');
      const index = this.state.getGalleryIndex(sectionId, images.length);

      if (!frame || !imageElement || (images.length > 1 && (!count || !previousButton || !nextButton))) {
        const section = this.content.getSection(sectionId, this.state.lang);
        gallery.outerHTML = this.renderGallery(sectionId, section, this.content.getUi(this.state.lang));
        return;
      }

      frame.dataset.imageFit = image.fit;
      imageElement.src = image.src;
      imageElement.alt = image.alt;
      imageElement.style.setProperty("--image-fit", image.fit);
      imageElement.style.setProperty("--image-position", image.position);

      if (count && previousButton && nextButton) {
        count.textContent = this.renderImageCounter(index, images.length, this.content.getUi(this.state.lang));
        previousButton.disabled = index === 0;
        nextButton.disabled = index === images.length - 1;
      }
    }

    renderAudioBlock(audio, section, ui) {
      const audioLabel = formatTemplate(ui.audioAriaLabel, {
        label: ui.audioHeading,
        title: section.title,
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
        '</p><p class="qr-audio__title"><span>' +
        escapeHtml(ui.audioTitleLabel) +
        "</span><strong>" +
        escapeHtml(section.title) +
        "</strong></p></div>" +
        (audio.caption ? '<p class="qr-audio__caption">' + escapeHtml(audio.caption) + "</p>" : "") +
        audioMarkup +
        "</section>"
      );
    }

    renderSectionNavButton(direction, targetSectionId, ui) {
      const isPrevious = direction < 0;
      const label = isPrevious ? ui.previousSection : ui.nextSection;
      const ariaTemplate = isPrevious ? ui.previousSectionAria : ui.nextSectionAria;
      const targetTitle = targetSectionId ? this.content.getSectionLabel(targetSectionId, this.state.lang) : "";

      return (
        '<button class="qr-stop-nav__button' +
        (isPrevious ? " qr-stop-nav__button--previous" : " qr-stop-nav__button--next") +
        '" type="button" data-tour-nav="' +
        String(direction) +
        '"' +
        (targetSectionId
          ? ' data-target-section="' +
            escapeHtml(targetSectionId) +
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

    renderSectionNavigation(sectionId, ui) {
      const previousSectionId = this.getAdjacentSection(sectionId, -1);
      const nextSectionId = this.getAdjacentSection(sectionId, 1);

      return (
        '<nav class="qr-stop-nav" aria-label="' +
        escapeHtml(ui.sectionsLabel) +
        '">' +
        this.renderSectionNavButton(-1, previousSectionId, ui) +
        this.renderSectionNavButton(1, nextSectionId, ui) +
        "</nav>"
      );
    }

    getAdjacentSection(sectionId, direction) {
      const nextIndex = this.sectionOrder.indexOf(sectionId) + direction;
      return nextIndex >= 0 && nextIndex < this.sectionOrder.length ? this.sectionOrder[nextIndex] : null;
    }

    renderLanguageOptionLabel(lang) {
      return (
        renderFlagIcon(lang) +
        '<span class="language-option__name">' +
        escapeHtml(this.content.getLanguageName(lang)) +
        "</span>"
      );
    }

    renderLanguageButtons() {
      const ui = this.content.getUi(this.state.lang);
      const activeLanguageName = this.content.getLanguageName(this.state.lang);

      this.elements.activeLanguageLabel.innerHTML = this.renderLanguageOptionLabel(this.state.lang);
      this.elements.languageTrigger.setAttribute("aria-label", ui.languageLabel + ": " + activeLanguageName);
      this.elements.languageMenu.setAttribute("aria-label", ui.languageLabel);
      this.elements.languageSwitcher.setAttribute("aria-label", ui.languageLabel);

      this.elements.languageSwitcher.innerHTML = this.content.supportedLanguages
        .map((langKey) => {
          const pressed = langKey === this.state.lang;
          const languageName = this.content.getLanguageName(langKey);

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
            this.renderLanguageOptionLabel(langKey) +
            "</button>"
          );
        })
        .join("");
    }

    renderSectionButtons() {
      const ui = this.content.getUi(this.state.lang);
      const activeLabel = this.state.activeSectionId
        ? this.content.getSectionLabel(this.state.activeSectionId, this.state.lang)
        : ui.sectionSelectorPlaceholder;
      const triggerLabel = ui.sectionSelectorLabel || ui.sectionsLabel;

      this.elements.activeSectionLabel.textContent = activeLabel;
      this.elements.sectionControlLabel.textContent = triggerLabel;
      this.elements.sectionTrigger.setAttribute("aria-label", triggerLabel + ": " + activeLabel);
      this.elements.sectionMenu.setAttribute("aria-label", ui.sectionsLabel);
      this.elements.sectionSwitcher.setAttribute("aria-label", ui.sectionsLabel);

      this.elements.sectionSwitcher.innerHTML = this.sectionOrder
        .map((sectionId, index) => {
          const isActive = sectionId === this.state.activeSectionId;
          const sectionNumber = String(index + 1).padStart(2, "0");

          return (
            '<button class="selector__option selector__option--stop" type="button" data-section="' +
            escapeHtml(sectionId) +
            '" aria-current="' +
            (isActive ? "true" : "false") +
            '">' +
            '<span class="selector__option-number">' +
            sectionNumber +
            "</span><span>" +
            escapeHtml(this.content.getSectionLabel(sectionId, this.state.lang)) +
            "</span></button>"
          );
        })
        .join("");
    }

    renderMiniMap(ui) {
      const miniMap = this.content.getMiniMap(this.state.lang);
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

    renderSections() {
      const ui = this.content.getUi(this.state.lang);

      const sectionsMarkup = this.sectionOrder
        .map((sectionId, index) => {
          const sectionMeta = this.getSectionMeta(sectionId);
          const section = this.content.getSection(sectionId, this.state.lang);
          if (!sectionMeta || !section) {
            return "";
          }

          const audio = this.content.getAudio(sectionId, this.state.lang);
          const isActive = this.state.activeSectionId === sectionId;
          const sectionIndex = String(index + 1).padStart(2, "0");
          const sectionLabel =
            sectionIndex + ui.sectionLabelSeparator + (section.navigationTitle || section.title || this.content.getSectionLabel(sectionId, this.state.lang));

          return (
            '<article class="qr-stop' +
            (isActive ? " is-active" : "") +
            '" id="' +
            escapeHtml(sectionId) +
            '" data-section="' +
            escapeHtml(sectionId) +
            '" tabindex="-1" style="--stop-accent:' +
            escapeHtml(sectionMeta.accent) +
            ";--stop-accent-soft:" +
            escapeHtml(sectionMeta.accentSoft) +
            ';">' +
            '<header class="qr-stop__header">' +
            '<p class="qr-stop__eyebrow">' +
            escapeHtml(sectionLabel) +
            "</p>" +
            '<h2 class="qr-stop__title">' +
            escapeHtml(section.title) +
            "</h2>" +
            (isActive ? '<span class="qr-stop__badge">' + escapeHtml(ui.selectedBadge) + "</span>" : "") +
            "</header>" +
            this.renderGallery(sectionId, section, ui) +
            this.renderAudioBlock(audio, section, ui) +
            '<p class="qr-stop__preview">' +
            escapeHtml(section.preview) +
            "</p>" +
            this.renderReadMore(sectionId, section, ui) +
            this.renderActivityCard(section, ui) +
            this.renderSectionNavigation(sectionId, ui) +
            "</article>"
          );
        })
        .join("");

      this.elements.main.innerHTML = this.renderMiniMap(ui) + sectionsMarkup;
    }

    syncHeroCurrentSection() {
      const ui = this.content.getUi(this.state.lang);
      const label = this.state.activeSectionId
        ? this.content.getSectionLabel(this.state.activeSectionId, this.state.lang)
        : ui.sectionSelectorPlaceholder;
      this.elements.currentSectionLabel.textContent = ui.currentSectionLabel + ": " + label;
    }

    syncActiveState() {
      const ui = this.content.getUi(this.state.lang);

      this.elements.main.querySelectorAll(".qr-stop").forEach((section) => {
        const isActive = section.dataset.section === this.state.activeSectionId;
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

      this.syncHeroCurrentSection();
      this.renderSectionButtons();
    }

    renderGuide() {
      const ui = this.content.getUi(this.state.lang);
      const heroTitle = ui.heroTitle || ui.pageTitle;

      document.documentElement.lang = this.state.lang;
      document.title = heroTitle + " | Mylotopi";
      document.body.classList.remove("is-map-modal-open");
      this.elements.nav.setAttribute("aria-label", ui.navigationLabel);
      this.elements.sectionControlLabel.textContent = ui.sectionSelectorLabel || ui.sectionsLabel;
      this.elements.languageControlLabel.textContent = ui.languageLabel;
      this.elements.kicker.textContent = ui.kicker;
      this.elements.title.textContent = heroTitle;

      this.renderLanguageButtons();
      this.renderSections();
      this.renderSectionButtons();
      this.syncHeroCurrentSection();
    }
  }

  class GuideApp {
    constructor(config) {
      this.meta = config.meta;
      this.content = config.content;
      this.elements = config.elements;
      this.sectionOrder = SECTION_ORDER;
      this.sectionsById = SECTIONS_BY_ID;
      this.state = new GuideState(this.content.defaultLanguage, this.getDefaultSectionId());
      this.renderer = new GuideRenderer({
        meta: this.meta,
        content: this.content,
        state: this.state,
        elements: this.elements,
        sectionOrder: this.sectionOrder,
        sectionsById: this.sectionsById,
      });
      this.audio = new AudioController(this.elements.main, (sectionId) => this.getSectionElement(sectionId));
    }

    getDefaultSectionId() {
      return (
        this.sectionOrder.find((sectionId) => {
          return Boolean(this.sectionsById[sectionId]);
        }) || null
      );
    }

    getSectionElement(sectionId) {
      return sectionId ? document.getElementById(sectionId) : null;
    }

    normalizeSection(value) {
      if (!value) {
        return null;
      }

      const key = normalizeQueryParam(value);
      const canonicalKey = LEGACY_SECTION_IDS[key] || key;
      return this.sectionOrder.includes(canonicalKey) ? canonicalKey : null;
    }

    getNavigationOptions() {
      return {
        behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
        focus: true,
        updateUrl: true,
      };
    }

    applyLocation() {
      const params = new URLSearchParams(window.location.search);
      const rawLang = params.get("lang");
      const rawSection = params.get("spot");
      const hasLangParam = params.has("lang");
      const hasSectionParam = params.has("spot");
      const canonicalRawLang = hasLangParam ? normalizeQueryParam(rawLang || "") : null;
      const canonicalRawSection = hasSectionParam ? normalizeQueryParam(rawSection || "") : null;
      const normalizedLang = this.content.normalizeLanguage(rawLang) || this.content.defaultLanguage;
      const requestedSectionId = hasSectionParam ? this.normalizeSection(rawSection) : null;
      const normalizedSectionId = requestedSectionId || this.getDefaultSectionId();

      this.state.lang = normalizedLang;
      this.state.activeSectionId = normalizedSectionId;
      this.state.shouldScrollToSection = Boolean(requestedSectionId);
      this.state.includeSectionInUrl = Boolean(requestedSectionId);
      this.state.shouldNormalizeUrl =
        (hasLangParam && canonicalRawLang !== normalizedLang) ||
        (hasSectionParam && (!requestedSectionId || canonicalRawSection !== requestedSectionId));
    }

    updateUrl(options) {
      const settings = Object.assign(
        {
          includeSection: this.state.includeSectionInUrl,
        },
        options || {}
      );
      const url = new URL(window.location.href);

      if (settings.includeSection && this.state.activeSectionId) {
        url.searchParams.set("spot", this.state.activeSectionId);
      } else {
        url.searchParams.delete("spot");
      }

      url.searchParams.set("lang", this.state.lang);
      window.history.replaceState({}, "", url.toString());
    }

    announceActiveSection() {
      if (!this.state.activeSectionId) {
        return;
      }

      const ui = this.content.getUi(this.state.lang);
      const section = this.content.getSection(this.state.activeSectionId, this.state.lang);
      this.elements.announcer.textContent = ui.announcerPrefix + ": " + section.title;
    }

    closeMenus() {
      this.elements.sectionMenu.open = false;
      this.elements.languageMenu.open = false;
    }

    getMapModal() {
      return this.elements.main.querySelector("[data-map-modal]");
    }

    openMapModal() {
      const modal = this.getMapModal();
      if (!modal) {
        return;
      }

      this.closeMenus();
      modal.hidden = false;
      document.body.classList.add("is-map-modal-open");

      const closeButton = modal.querySelector(".minimap-modal__close");
      if (closeButton) {
        closeButton.focus({ preventScroll: true });
      }
    }

    closeMapModal(restoreFocus) {
      const modal = this.getMapModal();
      if (!modal || modal.hidden) {
        return false;
      }

      modal.hidden = true;
      document.body.classList.remove("is-map-modal-open");

      if (restoreFocus) {
        const openButton = this.elements.main.querySelector("[data-map-open]");
        if (openButton) {
          openButton.focus({ preventScroll: true });
        }
      }

      return true;
    }

    moveToSection(sectionId, options) {
      const settings = Object.assign(
        {
          behavior: REDUCED_MOTION_QUERY.matches ? "auto" : "smooth",
          focus: true,
          updateUrl: true,
          includeSectionInUrl: this.state.includeSectionInUrl,
        },
        options || {}
      );
      const nextSectionId = this.normalizeSection(sectionId);
      const previousSectionId = this.state.activeSectionId;

      if (!nextSectionId) {
        return;
      }

      this.state.activeSectionId = nextSectionId;

      if (previousSectionId !== this.state.activeSectionId) {
        this.audio.activate(this.state.activeSectionId);
      }

      this.renderer.syncActiveState();

      if (settings.updateUrl) {
        this.state.includeSectionInUrl = settings.includeSectionInUrl;
        this.updateUrl({
          includeSection: settings.includeSectionInUrl,
        });
      }

      const section = this.getSectionElement(this.state.activeSectionId);
      if (!section) {
        return;
      }

      section.scrollIntoView({
        behavior: settings.behavior,
        block: "start",
      });

      if (settings.focus) {
        window.setTimeout(
          () => {
            section.focus({ preventScroll: true });
          },
          settings.behavior === "smooth" ? 280 : 0
        );
      }

      this.announceActiveSection();
    }

    async changeLanguage(nextLang) {
      const normalizedLang = this.content.normalizeLanguage(nextLang) || this.content.defaultLanguage;
      if (normalizedLang === this.state.lang) {
        this.closeMenus();
        return;
      }

      this.audio.stopAll();
      this.state.lang = normalizedLang;
      await this.content.loadLanguage(normalizedLang);

      this.renderer.renderGuide();
      this.audio.bindPlayers();
      this.audio.loadMetadata(this.audio.getPlayerForSection(this.state.activeSectionId));
      this.updateUrl();
      this.closeMenus();

      if (this.state.activeSectionId) {
        this.moveToSection(this.state.activeSectionId, {
          behavior: "auto",
          focus: false,
          updateUrl: false,
        });
      }
    }

    handleLanguageClick(event) {
      const button = event.target.closest("button[data-lang]");
      if (!button) {
        return Promise.resolve();
      }

      return this.changeLanguage(button.dataset.lang);
    }

    handleSectionClick(event) {
      const button = event.target.closest("button[data-section]");
      if (!button) {
        return;
      }

      this.closeMenus();
      this.moveToSection(button.dataset.section, this.getNavigationOptions());
    }

    handleMiniMapClick(event) {
      const openButton = event.target.closest("[data-map-open]");
      if (openButton) {
        event.preventDefault();
        this.openMapModal();
        return;
      }

      const closeButton = event.target.closest("[data-map-close]");
      if (closeButton) {
        event.preventDefault();
        this.closeMapModal(true);
      }
    }

    handleMiniMapKeydown(event) {
      const openButton = event.target.closest("[data-map-open]");
      const isActivationKey = event.key === "Enter" || event.key === " " || event.key === "Spacebar";

      if (!openButton || !isActivationKey) {
        return;
      }

      event.preventDefault();
      this.openMapModal();
    }

    handleSectionNavClick(event) {
      const button = event.target.closest("button[data-tour-nav]");
      if (!button || button.disabled) {
        return;
      }

      this.moveToSection(button.dataset.targetSection, this.getNavigationOptions());
    }

    handleGalleryClick(event) {
      const button = event.target.closest("button[data-gallery-direction]");
      if (!button) {
        return;
      }

      const gallery = button.closest("[data-gallery-section]");
      const sectionId = gallery ? gallery.dataset.gallerySection : null;
      const images = this.renderer.getSectionImages(sectionId);
      if (!sectionId || !images.length) {
        return;
      }

      const direction = Number(button.dataset.galleryDirection);
      if (!Number.isFinite(direction) || direction === 0) {
        return;
      }

      const currentIndex = this.state.getGalleryIndex(sectionId, images.length);
      const nextIndex = Math.max(0, Math.min(currentIndex + direction, images.length - 1));
      if (nextIndex === currentIndex) {
        return;
      }

      this.state.setGalleryIndex(sectionId, nextIndex);
      this.renderer.updateGalleryView(sectionId);
    }

    handleCopyToggle(event) {
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

    handleDocumentClick(event) {
      if (!this.elements.sectionMenu.contains(event.target)) {
        this.elements.sectionMenu.open = false;
      }

      if (!this.elements.languageMenu.contains(event.target)) {
        this.elements.languageMenu.open = false;
      }
    }

    handleDocumentKeydown(event) {
      if (event.key === "Escape") {
        if (this.closeMapModal(true)) {
          event.preventDefault();
          return;
        }

        this.closeMenus();
      }
    }

    handleMenuToggle(event) {
      if (!event.target.open) {
        return;
      }

      if (event.target === this.elements.sectionMenu) {
        this.elements.languageMenu.open = false;
      }

      if (event.target === this.elements.languageMenu) {
        this.elements.sectionMenu.open = false;
      }
    }

    bindEvents() {
      this.elements.languageSwitcher.addEventListener("click", (event) => {
        this.handleLanguageClick(event).catch((error) => this.showFatalError(error));
      });
      this.elements.sectionSwitcher.addEventListener("click", (event) => this.handleSectionClick(event));
      this.elements.main.addEventListener("click", (event) => this.handleMiniMapClick(event));
      this.elements.main.addEventListener("keydown", (event) => this.handleMiniMapKeydown(event));
      this.elements.main.addEventListener("click", (event) => this.handleSectionNavClick(event));
      this.elements.main.addEventListener("click", (event) => this.handleGalleryClick(event));
      this.elements.main.addEventListener("click", (event) => this.handleCopyToggle(event));
      document.addEventListener("click", (event) => this.handleDocumentClick(event));
      document.addEventListener("keydown", (event) => this.handleDocumentKeydown(event));
      this.elements.sectionMenu.addEventListener("toggle", (event) => this.handleMenuToggle(event));
      this.elements.languageMenu.addEventListener("toggle", (event) => this.handleMenuToggle(event));
    }

    showFatalError(error) {
      const ui = this.content.getUi(this.state.lang);

      console.error(error);
      this.elements.main.innerHTML =
        '<div class="qr-load-error" role="alert">' +
        "<strong>" +
        escapeHtml(ui.loadErrorTitle || "Unable to load guide content.") +
        "</strong>" +
        "<span>" +
        escapeHtml(ui.loadErrorBody || "Please serve this folder as a static website and reload the page.") +
        "</span>" +
        "</div>";
    }

    async init() {
      this.applyLocation();
      await this.content.loadLanguage(this.state.lang);

      this.renderer.renderGuide();
      this.renderer.syncActiveState();
      this.audio.bindPlayers();
      this.audio.loadMetadata(this.audio.getPlayerForSection(this.state.activeSectionId));

      if (this.state.shouldNormalizeUrl) {
        this.updateUrl({
          includeSection: this.state.includeSectionInUrl,
        });
        this.state.shouldNormalizeUrl = false;
      }

      this.bindEvents();

      if (this.state.shouldScrollToSection && this.state.activeSectionId) {
        window.setTimeout(() => {
          this.moveToSection(this.state.activeSectionId, {
            behavior: "auto",
            focus: true,
            updateUrl: false,
          });
        }, 90);
      }
    }
  }

  const elements = Object.keys(DOM_IDS).reduce(function (result, key) {
    result[key] = document.getElementById(DOM_IDS[key]);
    return result;
  }, {});

  assertRequiredElements(elements);

  const app = new GuideApp({
    meta: meta,
    content: i18n,
    elements: elements,
  });

  app.init().catch((error) => app.showFatalError(error));
})();
