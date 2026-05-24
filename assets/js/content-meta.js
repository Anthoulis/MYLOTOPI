(function () {
  window.MYLOTOPI_GUIDE_META = {
    defaultLanguage: "en",
    contentBasePath: "./assets/content",
    languages: ["en", "el", "de", "fr", "it", "es", "nl", "pl", "ru", "tr"],
    stagedLanguages: [],
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
        accent: "#b9ad45",
        accentSoft: "rgba(185, 173, 69, 0.18)",
        images: [
          {
            src: "./assets/images/stops/01-welcome/01-windmill-sunset.jpg",
            alt: {
              en: "Mylotopi windmill and village terrace at sunset",
              el: "Ο ανεμόμυλος και η αυλή του Μυλοτόπι στο φως του ηλιοβασιλέματος",
              de: "Die Windmühle und Dorfterrasse von Mylotopi im Abendlicht",
            },
            fit: "cover",
            position: "center",
          },
        ],
      },
      "garden-herbs": {
        anchorId: "garden-herbs",
        accent: "#667321",
        accentSoft: "rgba(102, 115, 33, 0.16)",
        images: [
          {
            src: "./assets/images/stops/02-herb-garden/01-garden-canopy.jpg",
            alt: {
              en: "Mylotopi garden and windmill sails seen through warm shade",
              el: "Ο κήπος του Μυλοτόπι και τα πανιά του ανεμόμυλου μέσα από ζεστή σκιά",
              de: "Der Garten von Mylotopi und die Windmühlenflügel im warmen Schatten",
            },
            fit: "cover",
            position: "center",
          },
        ],
      },
      "windmill-base": {
        anchorId: "windmill-base",
        accent: "#8f6b32",
        accentSoft: "rgba(143, 107, 50, 0.18)",
        images: [
          {
            src: "./assets/images/stops/03-windmill-base/01-historic-windmill.jpg",
            alt: {
              en: "Historic Mylotopi windmill before restoration",
              el: "Ο ιστορικός ανεμόμυλος του Μυλοτόπι πριν από την αποκατάσταση",
              de: "Die historische Windmühle von Mylotopi vor der Restaurierung",
            },
            fit: "contain",
            position: "center",
          },
        ],
      },
      "sleeping-area": {
        anchorId: "sleeping-area",
        accent: "#8f6b32",
        accentSoft: "rgba(143, 107, 50, 0.14)",
        images: [],
      },
      machinery: {
        anchorId: "machinery",
        accent: "#8f6b32",
        accentSoft: "rgba(143, 107, 50, 0.12)",
        images: [
          {
            src: "./assets/images/stops/05-machinery/01-machinery-detail.jpg",
            alt: {
              en: "Close view of the restored wooden windmill machinery",
              el: "Κοντινή άποψη του αποκατεστημένου ξύλινου μηχανισμού του ανεμόμυλου",
              de: "Nahansicht der restaurierten hölzernen Windmühlenmechanik",
            },
            fit: "cover",
            position: "center",
          },
        ],
      },
      "threshing-floor-donkeys": {
        anchorId: "threshing-floor-donkeys",
        accent: "#a77733",
        accentSoft: "rgba(167, 119, 51, 0.18)",
        images: [
          {
            src: "./assets/images/stops/06-threshing-floor-donkeys/01-threshing-floor.jpg",
            alt: {
              en: "Traditional threshing floor at Mylotopi",
              el: "Παραδοσιακό αλώνι στο Μυλοτόπι",
              de: "Traditioneller Dreschplatz in Mylotopi",
            },
            fit: "cover",
            position: "center",
          },
        ],
      },
      "cellar-italian-tunnel": {
        anchorId: "cellar-italian-tunnel",
        accent: "#667321",
        accentSoft: "rgba(102, 115, 33, 0.18)",
        images: [
          {
            src: "./assets/images/stops/07-cellar-italian-tunnel/04-official-tunnel.jpg",
            alt: {
              en: "Official Mylotopi view of the Italian tunnel",
              el: "Άποψη του ιταλικού τούνελ στο Μυλοτόπι",
              de: "Blick in den italienischen Tunnel von Mylotopi",
            },
            fit: "contain",
            position: "center",
          },
          {
            src: "./assets/images/stops/07-cellar-italian-tunnel/05-wine-cellar.jpg",
            alt: {
              en: "Wine cellar inside the old Mylotopi tunnel",
              el: "Η κάβα κρασιού μέσα στο παλιό τούνελ του Μυλοτόπι",
              de: "Der Weinkeller im alten Tunnel von Mylotopi",
            },
            fit: "contain",
            position: "center",
          },
        ],
      },
      "traditional-house": {
        anchorId: "traditional-house",
        accent: "#8f6b32",
        accentSoft: "rgba(143, 107, 50, 0.18)",
        images: [
          {
            src: "./assets/images/stops/08-traditional-house/01-traditional-house.jpg",
            alt: {
              en: "Traditional clothing and family objects inside the Mylotopi house",
              el: "Παραδοσιακά ρούχα και οικογενειακά αντικείμενα μέσα στο σπίτι του Μυλοτόπι",
              de: "Traditionelle Kleidung und Familiengegenstände im Haus von Mylotopi",
            },
            fit: "cover",
            position: "center",
          },
        ],
      },
      bakery: {
        anchorId: "bakery",
        accent: "#9b6231",
        accentSoft: "rgba(155, 98, 49, 0.18)",
        images: [
          {
            src: "./assets/images/stops/09-bakery/01-stone-oven.jpg",
            alt: {
              en: "Stone oven inside the Mylotopi bakery",
              el: "Ο πετρόχτιστος φούρνος στο Μυλοτόπι",
              de: "Der Steinofen in Mylotopi",
            },
            fit: "cover",
            position: "center",
          },
          {
            src: "./assets/images/stops/09-bakery/02-bread-oven.jpg",
            alt: {
              en: "Traditional bread baking in the stone oven",
              el: "Παραδοσιακό ψωμί που ψήνεται στον πετρόχτιστο φούρνο",
              de: "Traditionelles Brot beim Backen im Steinofen",
            },
            fit: "cover",
            position: "center",
          },
        ],
      },
    },
  };
})();
