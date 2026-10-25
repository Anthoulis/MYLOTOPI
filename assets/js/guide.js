// The few live parts of a language page. Everything readable is already in the HTML;
// this follows the current stop, runs the player at the bottom, and opens the map.

const header = document.querySelector(".site-header");
const stops = Array.from(document.querySelectorAll("[data-stop]"));
const firstStop = stops[0];
const menus = Array.from(document.querySelectorAll("[data-menu]"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeId = firstStop.id;

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
  // The stop whose narration is loaded; null at rest, when the player is not on screen.
  loadedStop: null,
  // A position chosen on the seek bar before the narration knew its length.
  pendingSeek: null,
  // Paused and scrolled away: the player leaves the screen but keeps its place, and the stop's
  // Listen button resumes from there (the owner, 25/10/2026).
  dismissed: false,
  pausedAtScroll: null,
};

// How far the visitor scrolls after a pause before the player steps aside.
const DISMISS_AFTER_PX = 48;

function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// Time and position change many times a second; only they are redrawn on timeupdate.
function renderTime() {
  const stop = player.loadedStop;
  if (!stop) {
    return;
  }

  const text = `${formatTime(player.audio.currentTime)} / ${stop.dataset.duration}`;
  player.time.textContent = text;
  player.seek.setAttribute("aria-valuetext", text);
  if (player.audio.duration && player.pendingSeek === null) {
    player.seek.value = String(Math.floor(player.audio.currentTime));
  }
}

// The player slides up from the bottom when a narration starts and down when it is over.
function showPlayer(open) {
  if (open === !player.root.hidden && open === player.root.classList.contains("is-open")) {
    return;
  }

  if (open) {
    player.root.hidden = false;
    // One frame on screen in the closed position, so the slide has a start.
    window.requestAnimationFrame(() => player.root.classList.add("is-open"));
  } else {
    player.root.classList.remove("is-open");
    const hide = () => {
      if (!player.root.classList.contains("is-open")) {
        player.root.hidden = true;
        syncBars();
      }
    };
    if (reducedMotion.matches) {
      hide();
    } else {
      player.root.addEventListener("transitionend", hide, { once: true });
      window.setTimeout(hide, 400); // In case the transition never runs.
    }
  }
  syncBars();
}

function renderPlayer() {
  const stop = player.loadedStop;
  const playing = Boolean(stop) && !player.audio.paused;

  showPlayer(Boolean(stop) && !player.dismissed);
  if (stop) {
    player.number.textContent = stop.dataset.number;
    player.title.textContent = titleOf(stop);
  }
  player.toggle.classList.toggle("is-playing", playing);
  player.toggle.setAttribute("aria-label", playing ? player.toggle.dataset.labelPause : player.toggle.dataset.labelPlay);

  stops.forEach((candidate) => {
    const listen = listenOf(candidate);
    if (listen) {
      const pressed = candidate === player.loadedStop && !player.audio.paused;
      listen.classList.toggle("is-playing", pressed);
      listen.setAttribute("aria-pressed", String(pressed));
    }
  });
  renderTime();
}

function load(stop) {
  player.loadedStop = stop;
  player.pendingSeek = null;
  player.dismissed = false;
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

// Back to rest, and the player leaves the screen: after the end of a narration, or when one cannot
// play (without signal, a narration never played was never kept). Never stuck on "playing" in silence.
function rest() {
  player.loadedStop = null;
  player.pendingSeek = null;
  player.dismissed = false;
  player.audio.removeAttribute("src");
  player.audio.load();
  player.toggle.classList.remove("is-waiting");
  renderPlayer();
}

function begin(stop) {
  player.audio.play().catch((error) => {
    if (error.name === "AbortError" || player.loadedStop !== stop) {
      return; // Another narration was chosen meanwhile.
    }
    rest();
  });
}

// Plays the given stop, or pauses it if it is the one playing.
function playStop(stop) {
  if (!stop || !listenOf(stop)) {
    return;
  }

  if (stop === player.loadedStop) {
    if (player.audio.paused) {
      begin(stop);
    } else {
      player.audio.pause();
    }
    return;
  }

  load(stop);
  begin(stop);
  renderPlayer();
}

// The seek bar counts seconds. Before the narration knows its length, the choice waits for it.
function seek() {
  const seconds = Number(player.seek.value);
  if (player.audio.duration) {
    player.audio.currentTime = seconds;
  } else {
    player.pendingSeek = seconds;
  }
}

function onMetadata() {
  player.seek.max = String(Math.floor(player.audio.duration));
  if (player.pendingSeek !== null) {
    player.audio.currentTime = player.pendingSeek;
    player.pendingSeek = null;
  }
  renderTime();
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
  rememberStop();
}

// The address remembers the stop, so a reload or a language change returns to it.
// The first stop has no "#": the page then opens at its top, with the title.
function rememberStop() {
  const hash = activeId === firstStop.id ? "" : `#${activeId}`;
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

// While a link scrolls to a stop, the stops it passes are not "current".
const navigation = { targetId: null, timer: 0 };

// A paused player steps aside once the visitor scrolls on; Listen brings it back where it was.
function dismissPausedPlayer() {
  const paused = player.loadedStop && player.audio.paused && player.pausedAtScroll !== null;
  if (paused && !player.dismissed && Math.abs(window.scrollY - player.pausedAtScroll) > DISMISS_AFTER_PX) {
    player.dismissed = true;
    renderPlayer();
  }
}

let scrollFrame = 0;
function onScroll() {
  if (scrollFrame) {
    return;
  }

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    dismissPausedPlayer();
    if (navigation.targetId) {
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
  // A closed player takes no room.
  const playerHeight = player.root.hidden ? 0 : player.root.offsetHeight;
  document.documentElement.style.setProperty("--player-height", `${playerHeight}px`);
}

// ---------------------------------------------------------------- menus

function closeMenus({ restoreFocus = false } = {}) {
  menus.forEach((menu) => {
    if (menu.open) {
      menu.open = false;
      if (restoreFocus) {
        // preventScroll: the menus live in the fixed bars; focusing them must not move the page.
        menu.querySelector("summary").focus({ preventScroll: true });
      }
    }
  });
}

// ---------------------------------------------------------------- navigation

function releaseNavigation() {
  navigation.targetId = null;
  window.clearTimeout(navigation.timer);
  window.removeEventListener("scrollend", releaseNavigation);
}

function goTo(id) {
  const target = document.getElementById(id);
  const smooth = !reducedMotion.matches;

  closeMenus();
  if (mapDialog.open) {
    mapDialog.dataset.navigating = "true";
    mapDialog.close();
  }
  releaseNavigation();
  if (target.matches("[data-stop]")) {
    setActiveStop(id);
  }

  navigation.targetId = id;
  target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  target.focus({ preventScroll: true });

  window.addEventListener("scrollend", releaseNavigation);
  // Browsers without the scrollend event, or a scroll that never moves.
  navigation.timer = window.setTimeout(releaseNavigation, smooth ? 1200 : 100);
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
  if (languageLink) {
    languageLink.hash = activeId === firstStop.id ? "" : activeId;
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
    return;
  }

  // Links that act as buttons answer Space too, as buttons do.
  if (event.key === " " && event.target.matches("[data-listen], [data-map-open]")) {
    event.preventDefault();
    event.target.click();
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

player.toggle.addEventListener("click", () => playStop(player.loadedStop));
player.seek.addEventListener("input", seek);
player.audio.addEventListener("loadedmetadata", onMetadata);
player.audio.addEventListener("timeupdate", renderTime);
player.audio.addEventListener("pause", () => {
  player.pausedAtScroll = window.scrollY;
});
player.audio.addEventListener("play", () => {
  player.pausedAtScroll = null;
  player.dismissed = false;
});
["play", "pause"].forEach((type) => player.audio.addEventListener(type, renderPlayer));
// "waiting" is the narration buffering; "playing" is sound again.
player.audio.addEventListener("waiting", () => player.toggle.classList.add("is-waiting"));
["playing", "pause"].forEach((type) => player.audio.addEventListener(type, () => player.toggle.classList.remove("is-waiting")));
// A finished narration does not start the next one.
player.audio.addEventListener("ended", rest);
// A narration that cannot load (no signal, never kept) must not leave the player "playing".
player.audio.addEventListener("error", () => {
  if (player.loadedStop) {
    rest();
  }
});

mapDialog.addEventListener("close", () => {
  document.body.classList.remove("is-map-modal-open");
  // A stop chosen in the map's list takes the focus itself.
  if (mapDialog.dataset.navigating) {
    delete mapDialog.dataset.navigating;
    return;
  }
  mapOpener.focus({ preventScroll: true });
});

document.querySelectorAll("[data-gallery]").forEach(setupGallery);
document.querySelectorAll("[data-listen]").forEach((link) => link.setAttribute("role", "button"));
mapOpener.setAttribute("role", "button");
mapOpener.setAttribute("aria-haspopup", "dialog");

// iOS Safari shows :active (the press feedback of the buttons) only when a touch listener exists.
document.addEventListener("touchstart", () => {}, { passive: true });

const bars = new ResizeObserver(syncBars);
bars.observe(header);
bars.observe(player.root);
window.addEventListener("scroll", onScroll, { passive: true });

// ---------------------------------------------------------------- without signal

// The copy of an image this screen needs: the first in its srcset at least as wide as it is drawn.
// The service worker also answers with a kept sibling when the browser picks another width.
function copyFor(image, drawnWidth) {
  const candidates = (image.getAttribute("srcset") || image.dataset.srcset || "")
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/))
    .map(([url, width]) => ({ url, width: parseInt(width, 10) }))
    .filter((candidate) => candidate.url && candidate.width);
  if (!candidates.length) {
    return image.getAttribute("src") || image.dataset.src;
  }
  const needed = drawnWidth * (window.devicePixelRatio || 1);
  return (candidates.find((candidate) => candidate.width >= needed) || candidates.at(-1)).url;
}

// Asks, one at a time, for everything this language needs without signal, so sw.js keeps it:
// this page, the entry pages of the QR codes, the files already loaded, every photo and the map.
// Narration is kept only when played. Nothing extra is fetched when the phone saves data.
async function keepForOffline() {
  if (navigator.connection && navigator.connection.saveData) {
    return;
  }

  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
    });
  }

  // The entry pages and their scripts too: a QR code scanned again without signal must still open.
  const entryFiles = ["../", "../index.html", "../qr-guide.html", "../assets/js/entry.js", "../assets/js/language.mjs"];
  const urls = new Set([window.location.pathname, ...entryFiles].map((url) => new URL(url, window.location.href).href));
  performance.getEntriesByType("resource").forEach((resource) => {
    const url = new URL(resource.name);
    if (url.origin === window.location.origin && !url.pathname.startsWith("/assets/audio/")) {
      urls.add(url.href);
    }
  });
  document.querySelectorAll(".qr-carousel__image").forEach((image) => {
    urls.add(new URL(copyFor(image, image.clientWidth), window.location.href).href);
  });
  const mapImage = mapDialog.querySelector("img");
  urls.add(new URL(copyFor(mapImage, Math.min(736, window.innerWidth - 56)), window.location.href).href);

  for (const url of urls) {
    try {
      await fetch(url, { priority: "low" });
    } catch (error) {
      return; // The signal dropped; the next visit carries on.
    }
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("../sw.js").then(
    () => {
      const whenIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 2000));
      const startKeeping = () => whenIdle(() => keepForOffline());
      if (document.readyState === "complete") {
        startKeeping();
      } else {
        window.addEventListener("load", startKeeping, { once: true });
      }
    },
    (error) => console.warn("The guide will not work without signal:", error),
  );
}

const initialStop = stops.find((stop) => `#${stop.id}` === window.location.hash);
if (initialStop) {
  setActiveStop(initialStop.id);
}
// An address that names the first stop loses its "#", as every other way to that stop does.
if (window.location.hash === `#${firstStop.id}`) {
  rememberStop();
}
renderPlayer();
