// The few live parts of a language page. Everything readable is already in the HTML;
// this follows the current stop, runs the player at the bottom, and opens the map.

const header = document.querySelector(".site-header");
const stops = Array.from(document.querySelectorAll("[data-stop]"));
const menus = Array.from(document.querySelectorAll("[data-menu]"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeId = stops[0].id;
let navigationTargetId = null;

const titleOf = (stop) => stop.querySelector(".qr-stop__name").textContent;
const listenOf = (stop) => stop.querySelector("[data-listen]");

// ---------------------------------------------------------------- player

const player = {
  root: document.querySelector("[data-player]"),
  audio: document.querySelector("[data-player-audio]"),
  toggle: document.querySelector("[data-player-toggle]"),
  number: document.querySelector("[data-player-number]"),
  title: document.querySelector("[data-player-title]"),
  time: document.querySelector("[data-player-time]"),
  seek: document.querySelector("[data-player-seek]"),
  // The stop whose narration is loaded; null while nothing has been started.
  loadedStop: null,
  // The stop the player shows: the loaded one, or the one on screen.
  shownStop: stops[0],
};

function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function isPlaying() {
  return player.loadedStop !== null && !player.audio.paused;
}

function renderPlayer() {
  const stop = player.shownStop;
  const isLoaded = stop === player.loadedStop;
  const playing = isLoaded && !player.audio.paused;

  player.number.textContent = stop.dataset.number;
  player.title.textContent = titleOf(stop);
  player.time.textContent = isLoaded
    ? `${formatTime(player.audio.currentTime)} / ${stop.dataset.duration}`
    : stop.dataset.duration;
  player.toggle.classList.toggle("is-playing", playing);
  player.toggle.setAttribute("aria-label", playing ? player.toggle.dataset.labelPause : player.toggle.dataset.labelPlay);
  player.root.classList.toggle("is-loaded", isLoaded);

  if (isLoaded && player.audio.duration) {
    player.seek.value = String(Math.round((player.audio.currentTime / player.audio.duration) * 1000));
  } else if (!isLoaded) {
    player.seek.value = "0";
  }

  stops.forEach((candidate) => {
    const listen = listenOf(candidate);
    if (listen) {
      listen.classList.toggle("is-playing", candidate === player.loadedStop && !player.audio.paused);
      listen.setAttribute("aria-pressed", String(candidate === player.loadedStop && !player.audio.paused));
    }
  });
}

function load(stop) {
  player.loadedStop = stop;
  player.shownStop = stop;
  player.audio.src = listenOf(stop).href;

  // Lock-screen and headphone controls show what is playing.
  if ("mediaSession" in navigator) {
    const image = stop.querySelector("img");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${stop.dataset.number}. ${titleOf(stop)}`,
      artist: "Mylotopi",
      album: document.querySelector(".qr-hero__title").textContent,
      artwork: image ? [{ src: image.currentSrc || image.src }] : [],
    });
  }
}

// Plays the given stop, or pauses it if it is the one playing.
function playStop(stop) {
  if (stop === player.loadedStop) {
    if (player.audio.paused) {
      player.audio.play();
    } else {
      player.audio.pause();
    }
    return;
  }

  load(stop);
  player.audio.play();
  renderPlayer();
}

// When nothing plays, the player follows the stop on screen.
function followStop(stop) {
  if (isPlaying() || (player.loadedStop && player.audio.currentTime > 0)) {
    return;
  }
  player.shownStop = stop;
  renderPlayer();
}

// ---------------------------------------------------------------- current stop

function setActiveStop(id) {
  if (id === activeId) {
    return;
  }

  activeId = id;
  const stop = document.getElementById(id);
  stops.forEach((candidate) => candidate.classList.toggle("is-active", candidate === stop));
  document.querySelectorAll(".selector__option--stop").forEach((link) => {
    link.setAttribute("aria-current", String(link.hash === `#${id}`));
  });
  followStop(stop);

  // The address remembers the stop, so a reload or a language change returns to it.
  const hash = id === stops[0].id ? "" : `#${id}`;
  history.replaceState(null, "", window.location.pathname + hash);
}

// The stop that crosses a line a quarter of the way down the visible area is the current one.
function findStopInView() {
  const top = header.offsetHeight;
  const bottom = window.innerHeight - player.root.offsetHeight;
  const line = top + Math.max(72, (bottom - top) * 0.24);
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

  if (atBottom) {
    return stops[stops.length - 1].id;
  }

  const stop = stops.find((candidate) => {
    const rect = candidate.getBoundingClientRect();
    return rect.top <= line && rect.bottom > line;
  });
  return stop ? stop.id : null;
}

let scrollFrame = 0;
function onScroll() {
  if (scrollFrame) {
    return;
  }

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    // While a link scrolls to a stop, the stops it passes are not "current".
    if (navigationTargetId) {
      return;
    }
    const id = findStopInView();
    if (id) {
      setActiveStop(id);
    }
  });
}

// Sticky header and player sizes feed the CSS, so a stop never hides behind either.
function syncBars() {
  document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
  document.documentElement.style.setProperty("--player-height", `${player.root.offsetHeight}px`);
}

// ---------------------------------------------------------------- menus

function closeMenus({ restoreFocus = false } = {}) {
  menus.forEach((menu) => {
    if (menu.open) {
      menu.open = false;
      if (restoreFocus) {
        menu.querySelector("summary").focus();
      }
    }
  });
}

// ---------------------------------------------------------------- navigation

function goTo(id) {
  const target = document.getElementById(id);
  const smooth = !reducedMotion.matches;

  closeMenus();
  if (target.matches("[data-stop]")) {
    setActiveStop(id);
  }

  navigationTargetId = id;
  target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  target.focus({ preventScroll: true });

  const release = () => {
    navigationTargetId = null;
    window.removeEventListener("scrollend", release);
  };
  window.addEventListener("scrollend", release);
  // Browsers without the scrollend event, or a scroll that never moves.
  window.setTimeout(release, smooth ? 1200 : 100);
}

// ---------------------------------------------------------------- map

const mapDialog = document.querySelector("[data-map-modal]");
const mapOpener = document.querySelector("[data-map-open]");

function openMap() {
  const image = mapDialog.querySelector("img[data-src]");
  // The large map image loads only when someone asks for it.
  if (!image.getAttribute("src")) {
    image.srcset = image.dataset.srcset;
    image.src = image.dataset.src;
  }

  closeMenus();
  mapDialog.showModal();
  document.body.classList.add("is-map-modal-open");
  mapDialog.querySelector("[data-map-close]").focus();
}

// ---------------------------------------------------------------- gallery

function setupGallery(gallery) {
  const track = gallery.querySelector("[data-gallery-track]");
  const controls = gallery.querySelector(".qr-carousel__controls");
  if (!controls) {
    return;
  }

  const counter = controls.querySelector("[data-gallery-counter]");
  const [previous, next] = controls.querySelectorAll("[data-gallery-step]");
  const total = track.children.length;

  function update() {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    counter.textContent = counter.dataset.template.replace("{current}", String(index + 1)).replace("{total}", String(total));
    // aria-disabled instead of disabled, so the focused button keeps focus at either end.
    previous.setAttribute("aria-disabled", String(index === 0));
    next.setAttribute("aria-disabled", String(index === total - 1));
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-step]");
    if (!button || button.getAttribute("aria-disabled") === "true") {
      return;
    }
    const left = Number(button.dataset.galleryStep) * track.clientWidth;
    track.scrollBy({ left, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  track.addEventListener("scroll", update, { passive: true });

  controls.hidden = false;
  update();
}

// ---------------------------------------------------------------- wiring

document.addEventListener("click", (event) => {
  const listen = event.target.closest("[data-listen]");
  if (listen) {
    event.preventDefault();
    playStop(listen.closest("[data-stop]"));
    return;
  }

  const stopLink = event.target.closest("[data-stop-link]");
  if (stopLink) {
    event.preventDefault();
    goTo(stopLink.hash.slice(1));
    return;
  }

  const languageLink = event.target.closest("[data-language-link]");
  if (languageLink && activeId !== stops[0].id) {
    languageLink.hash = activeId;
  }

  if (event.target.closest("[data-map-open]")) {
    event.preventDefault();
    openMap();
    return;
  }

  // A click on the dialog itself, not its content, is a click on the backdrop.
  if (event.target.closest("[data-map-close]") || event.target === mapDialog) {
    mapDialog.close();
    return;
  }

  menus.forEach((menu) => {
    if (menu.open && !menu.contains(event.target)) {
      menu.open = false;
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menus.some((menu) => menu.open)) {
    closeMenus({ restoreFocus: true });
  }
});

menus.forEach((menu) => {
  menu.addEventListener("toggle", () => {
    if (menu.open) {
      menus.forEach((other) => {
        if (other !== menu) {
          other.open = false;
        }
      });
    }
  });
});

player.toggle.addEventListener("click", () => playStop(player.shownStop));
player.seek.addEventListener("input", () => {
  if (player.shownStop !== player.loadedStop) {
    load(player.shownStop);
  }
  const apply = () => (player.audio.currentTime = (Number(player.seek.value) / 1000) * player.audio.duration);
  if (player.audio.duration) {
    apply();
  } else {
    player.audio.addEventListener("loadedmetadata", apply, { once: true });
    player.audio.load();
  }
});
["play", "pause", "timeupdate", "loadedmetadata"].forEach((type) => player.audio.addEventListener(type, renderPlayer));
player.audio.addEventListener("ended", () => {
  // A finished narration does not start the next one; the player returns to the stop on screen.
  player.loadedStop = null;
  player.shownStop = document.getElementById(activeId);
  renderPlayer();
});

mapDialog.addEventListener("close", () => {
  document.body.classList.remove("is-map-modal-open");
  mapOpener.focus({ preventScroll: true });
});

document.querySelectorAll("[data-gallery]").forEach(setupGallery);
document.querySelectorAll("[data-listen]").forEach((link) => link.setAttribute("role", "button"));

player.root.hidden = false;
document.body.classList.add("has-player");
const bars = new ResizeObserver(syncBars);
bars.observe(header);
bars.observe(player.root);
window.addEventListener("scroll", onScroll, { passive: true });

const initialStop = stops.find((stop) => `#${stop.id}` === window.location.hash);
if (initialStop) {
  setActiveStop(initialStop.id);
}
renderPlayer();
