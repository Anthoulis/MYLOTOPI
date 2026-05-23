(function () {
  window.MYLOTOPI_GUIDE_META = {
    defaultLanguage: "en",
    contentBasePath: "./assets/content",
    languages: ["en", "el", "de", "fr", "it", "es", "nl", "pl", "ru", "tr"],
    spotOrder: [
      "welcome",
      "garden-herbs",
      "windmill-base",
      "sleeping-area",
      "machinery",
      "threshing-floor-donkeys",
      "cellar-italian-tunnel",
      "traditional-house",
      "bakery",
    ],
    spots: {
      welcome: {
        anchorId: "welcome",
        accent: "#8b6d3d",
        accentSoft: "rgba(139, 109, 61, 0.16)",
        images: [],
      },
      "garden-herbs": {
        anchorId: "garden-herbs",
        accent: "#6f7d3d",
        accentSoft: "rgba(111, 125, 61, 0.16)",
        images: [],
      },
      "windmill-base": {
        anchorId: "windmill-base",
        accent: "#58708a",
        accentSoft: "rgba(88, 112, 138, 0.18)",
        images: [],
      },
      "sleeping-area": {
        anchorId: "sleeping-area",
        accent: "#58708a",
        accentSoft: "rgba(88, 112, 138, 0.14)",
        images: [],
      },
      machinery: {
        anchorId: "machinery",
        accent: "#58708a",
        accentSoft: "rgba(88, 112, 138, 0.12)",
        images: [],
      },
      "threshing-floor-donkeys": {
        anchorId: "threshing-floor-donkeys",
        accent: "#a77733",
        accentSoft: "rgba(167, 119, 51, 0.18)",
        images: [],
      },
      "cellar-italian-tunnel": {
        anchorId: "cellar-italian-tunnel",
        accent: "#5f7260",
        accentSoft: "rgba(95, 114, 96, 0.18)",
        images: [
          {
            src: "./assets/images/stops/07-cellar-italian-tunnel/01-tunnel-entrance.jpeg",
            alt: "Tunnel entrance and stone passage at Mylotopi",
            fit: "contain",
            position: "center",
          },
          {
            src: "./assets/images/stops/07-cellar-italian-tunnel/02-tunnel-interior.jpeg",
            alt: "Interior view of the Mylotopi tunnel",
            fit: "contain",
            position: "center",
          },
          {
            src: "./assets/images/stops/07-cellar-italian-tunnel/03-tunnel-stone-detail.jpeg",
            alt: "Stone tunnel detail at Mylotopi",
            fit: "contain",
            position: "center",
          },
        ],
      },
      "traditional-house": {
        anchorId: "traditional-house",
        accent: "#7b5d7c",
        accentSoft: "rgba(123, 93, 124, 0.18)",
        images: [],
      },
      bakery: {
        anchorId: "bakery",
        accent: "#b56840",
        accentSoft: "rgba(181, 104, 64, 0.18)",
        images: [],
      },
    },
  };
})();
