// The service worker (sw.js) that keeps the guide working where the signal drops: inside the mill,
// in the tunnel. The build writes it with a version made from everything it serves, so every change
// is a new version and no phone keeps old files.
//
// - Pages: from the network, or from the phone after NAVIGATION_TIMEOUT_MS without an answer.
// - Everything else under /assets/: from the phone when it has it, otherwise fetched and kept.
// - Narration: the whole MP3 is kept the first time it plays; the player's range requests are then
//   answered from it, so it plays again without signal.
// guide.js asks for the photos and the map in the background, so they are kept before they are seen.

const NAVIGATION_TIMEOUT_MS = 4000;

// Plain JavaScript for the browser, kept in one function so the tests can run it in a sandbox.
function serviceWorkerSource(VERSION, NAVIGATION_TIMEOUT_MS) {
  const CACHE = `mylotopi-${VERSION}`;

  // Answers a "Range: bytes=…" request from a whole file, as the server would (206).
  function rangeResponse(body, rangeHeader, contentType) {
    const size = body.size;
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
    if (!match || (match[1] === "" && match[2] === "")) {
      return new Response(body, { status: 200, headers: { "Content-Type": contentType, "Content-Length": String(size), "Accept-Ranges": "bytes" } });
    }

    let start;
    let end;
    if (match[1] === "") {
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
    }

    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }

    return new Response(body.slice(start, end + 1), {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  async function fromCacheOrNetwork(request) {
    const cache = await caches.open(CACHE);
    const kept = await cache.match(request);
    if (kept) {
      return kept;
    }
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      await cache.put(request, response.clone());
    }
    return response;
  }

  async function page(request) {
    const cache = await caches.open(CACHE);
    const network = fetch(request).then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    });
    const timeout = new Promise((resolve) => setTimeout(resolve, NAVIGATION_TIMEOUT_MS));

    try {
      const response = await Promise.race([network, timeout]);
      if (response) {
        return response;
      }
    } catch (error) {
      // No signal at all: fall through to the kept copy.
    }

    const kept = await cache.match(request, { ignoreSearch: true });
    return kept || network;
  }

  // Narrations being kept right now, so a second request does not download the file again.
  const keeping = new Set();

  async function narration(request) {
    const cache = await caches.open(CACHE);
    const url = request.url;
    const range = request.headers.get("Range");
    const kept = await cache.match(url);
    if (kept) {
      return rangeResponse(await kept.blob(), range, kept.headers.get("Content-Type") || "audio/mpeg");
    }

    // A seek, or a probe such as Safari's "bytes=0-1", before the file is kept: straight to the network.
    const fromStart = !range || /^bytes=0-$/.test(range);
    if (!fromStart || keeping.has(url)) {
      return fetch(request);
    }

    // First play from the start: one download that plays and is kept at the same time.
    const response = await fetch(url);
    const size = response.headers.get("Content-Length");
    if (response.status !== 200 || !size || response.headers.get("Content-Encoding")) {
      return response;
    }

    keeping.add(url);
    cache
      .put(url, response.clone())
      .catch(() => {})
      .finally(() => keeping.delete(url));

    if (!range) {
      return response;
    }
    return new Response(response.body, {
      status: 206,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": size,
        "Content-Range": `bytes 0-${Number(size) - 1}/${size}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  self.addEventListener("install", () => self.skipWaiting());

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(names.filter((name) => name.startsWith("mylotopi-") && name !== CACHE).map((name) => caches.delete(name))))
        .then(() => self.clients.claim()),
    );
  });

  self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin) {
      return;
    }

    // Pages: opened by the visitor, or asked for by guide.js to keep them.
    if (request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html")) {
      event.respondWith(page(request));
    } else if (url.pathname.startsWith("/assets/audio/")) {
      event.respondWith(narration(request));
    } else if (url.pathname.startsWith("/assets/")) {
      event.respondWith(fromCacheOrNetwork(request));
    }
  });

  return { rangeResponse };
}

export function renderServiceWorker(version) {
  return (
    `// Generated by npm run build (scripts/service-worker.mjs). Do not edit.\n` +
    `(${serviceWorkerSource.toString()})(${JSON.stringify(version)}, ${NAVIGATION_TIMEOUT_MS});\n`
  );
}

export { serviceWorkerSource };
