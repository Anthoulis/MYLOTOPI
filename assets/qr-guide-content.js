(function () {
  window.MYLOTOPI_QR_GUIDE_CONTENT = {
    defaultLanguage: "el",
    supportedLanguages: ["el", "en", "de", "it"],
    languageAliases: {
      el: "el",
      gr: "el",
      greek: "el",
      "el-gr": "el",
      el_gr: "el",
      en: "en",
      english: "en",
      "en-gb": "en",
      en_gb: "en",
      "en-us": "en",
      en_us: "en",
      de: "de",
      german: "de",
      deutsch: "de",
      "de-de": "de",
      de_de: "de",
      it: "it",
      italian: "it",
      italiano: "it",
      "it-it": "it",
      it_it: "it",
    },
    ui: {
      el: {
        kicker: "Οδηγός QR Μυλοτόπι",
        pageTitle: "Πολιτιστική Διαδρομή",
        intro:
          "Περιηγήσου στα πέντε σημεία του Μυλοτοπιού από το κινητό σου. Επίλεξε γλώσσα, άκουσε τη σύντομη αφήγηση και κύλησε φυσικά από χώρο σε χώρο.",
        languageLabel: "Γλώσσα",
        spotsLabel: "Σημεία διαδρομής",
        audioHeading: "Ηχητική ξενάγηση",
        selectedBadge: "Επιλεγμένο σημείο",
        imagePlaceholderLabel: "Θέση εικόνας",
        imagePlaceholderHint: "Προσθέστε φωτογραφία του χώρου όταν είναι διαθέσιμη.",
        audioFallback: "Το ηχητικό αρχείο δεν είναι διαθέσιμο σε αυτή τη γλώσσα.",
        audioPlaceholderNotice:
          "Προσωρινό ηχητικό δείγμα. Αντικαταστήστε το με την τελική αφήγηση για το συγκεκριμένο σημείο.",
        announcerPrefix: "Ενεργό σημείο",
        languageNames: {
          el: "Ελληνικά",
          en: "English",
          de: "Deutsch",
          it: "Italiano",
        },
      },
      en: {
        kicker: "Mylotopi QR Guide",
        pageTitle: "Heritage Walk",
        intro:
          "Explore the five heritage spots of Mylotopi from your phone. Choose a language, listen to the short narration, and move naturally from one stop to the next.",
        languageLabel: "Language",
        spotsLabel: "Guide stops",
        audioHeading: "Audio guide",
        selectedBadge: "Selected stop",
        imagePlaceholderLabel: "Image slot",
        imagePlaceholderHint: "Add a location image when it becomes available.",
        audioFallback: "The audio file is not available in this language yet.",
        audioPlaceholderNotice:
          "Temporary audio sample. Replace it with the final narration for this stop.",
        announcerPrefix: "Active stop",
        languageNames: {
          el: "Greek",
          en: "English",
          de: "Deutsch",
          it: "Italiano",
        },
      },
      de: {
        kicker: "Mylotopi QR Guide",
        pageTitle: "Kulturrundgang",
        intro:
          "Entdecken Sie die fünf Stationen von Mylotopi auf Ihrem Handy. Wählen Sie eine Sprache, hören Sie die kurze Erzählung und gehen Sie bequem von Ort zu Ort.",
        languageLabel: "Sprache",
        spotsLabel: "Stationen",
        audioHeading: "Audioguide",
        selectedBadge: "Ausgewählte Station",
        imagePlaceholderLabel: "Bildplatzhalter",
        imagePlaceholderHint: "Fügen Sie ein Bild dieses Ortes hinzu, sobald es verfügbar ist.",
        audioFallback: "Für diese Sprache ist noch keine Audiodatei verfügbar.",
        audioPlaceholderNotice:
          "Vorläufige Audiodatei. Ersetzen Sie sie durch die endgültige Aufnahme für diese Station.",
        announcerPrefix: "Aktive Station",
        languageNames: {
          el: "Griechisch",
          en: "English",
          de: "Deutsch",
          it: "Italiano",
        },
      },
      it: {
        kicker: "Guida QR Mylotopi",
        pageTitle: "Percorso del Patrimonio",
        intro:
          "Esplora dal tuo telefono i cinque luoghi di Mylotopi. Scegli una lingua, ascolta il breve racconto e scorri con naturalezza da una tappa all'altra.",
        languageLabel: "Lingua",
        spotsLabel: "Tappe del percorso",
        audioHeading: "Audioguida",
        selectedBadge: "Tappa selezionata",
        imagePlaceholderLabel: "Segnaposto immagine",
        imagePlaceholderHint: "Aggiungi una foto del luogo quando sarà disponibile.",
        audioFallback: "Il file audio non è ancora disponibile in questa lingua.",
        audioPlaceholderNotice:
          "Audio provvisorio. Sostituiscilo con la narrazione finale per questa tappa.",
        announcerPrefix: "Tappa attiva",
        languageNames: {
          el: "Greco",
          en: "English",
          de: "Deutsch",
          it: "Italiano",
        },
      },
    },
    spots: [
      {
        id: "aloni",
        accent: "#a77733",
        accentSoft: "rgba(167, 119, 51, 0.18)",
        imageSrc: "",
        placeholderAudio: true,
        imageAlt: {
          el: "Θέση εικόνας για το Αλώνι",
          en: "Image slot for the Threshing Floor",
          de: "Bildplatzhalter für den Dreschplatz",
          it: "Segnaposto immagine per l'aia",
        },
        translations: {
          el: {
            title: "Το Αλώνι",
            shortTitle: "Αλώνι",
            shortText:
              "Ο πέτρινος χώρος όπου γινόταν το αλώνισμα των σιτηρών και αποτυπωνόταν η πιο σωματική πλευρά της αγροτικής ζωής.",
            audioPath: "./assets/audio/qr-guide/aloni/el.wav",
            audioCaption:
              "Άκουσε μια σύντομη αφήγηση για τον τρόπο αλωνίσματος και τον ρόλο των ανθρώπων και των ζώων στον κύκλο της σοδειάς.",
            body: [
              "Στο αλώνι ξεχώριζαν τον καρπό από το στάχυ με επίμονη κυκλική κίνηση πάνω στην πέτρα. Ο αγωγιάτης καθοδηγούσε τα ζώα, οι θεριστές παρακολουθούσαν τη διαδικασία και το γαϊδούρι ολοκλήρωνε τον επίπονο κύκλο του αλωνίσματος.",
              "Ο ανακατασκευασμένος αυτός χώρος βοηθά τον επισκέπτη να φανταστεί τον ρυθμό της καθημερινής εργασίας στην Κέφαλο, όπου η παραγωγή του σιταριού ήταν δεμένη με συνεργασία, αντοχή και γνώση που περνούσε από γενιά σε γενιά.",
            ],
          },
          en: {
            title: "The Threshing Floor",
            shortTitle: "Aloni",
            shortText:
              "The stone threshing floor where grain was separated from the husk and the physical rhythm of rural life unfolded.",
            audioPath: "./assets/audio/qr-guide/aloni/en.wav",
            audioCaption:
              "Listen to a short narration about the threshing process and the role of both people and animals in the harvest cycle.",
            body: [
              "At the threshing floor, wheat was separated from the husk through repeated circular movement on stone. The muleteer guided the animals, harvesters watched the process, and the donkey completed the demanding cycle of threshing.",
              "This reconstructed stop helps visitors picture the tempo of everyday labor in Kefalos, where grain production depended on cooperation, endurance, and practical knowledge passed from one generation to the next.",
            ],
          },
          de: {
            title: "Tenne",
            shortTitle: "Tenne",
            shortText:
              "Der steinerne Dreschplatz, auf dem das Getreide bearbeitet wurde und der körperliche Rhythmus des ländlichen Lebens sichtbar wurde.",
            audioPath: "./assets/audio/qr-guide/aloni/de.wav",
            audioReady: false,
          },
          it: {
            title: "Aia",
            shortTitle: "Aia",
            shortText:
              "Lo spazio in pietra dove si trebbiava il grano e prendeva forma il ritmo fisico della vita agricola.",
            audioPath: "./assets/audio/qr-guide/aloni/it.wav",
            audioReady: false,
          },
        },
      },
      {
        id: "tunnel",
        accent: "#5f7260",
        accentSoft: "rgba(95, 114, 96, 0.18)",
        imageSrc: "",
        placeholderAudio: true,
        imageAlt: {
          el: "Θέση εικόνας για το Τούνελ",
          en: "Image slot for the Tunnel",
          de: "Bildplatzhalter für den Tunnel",
          it: "Segnaposto immagine per il tunnel",
        },
        translations: {
          el: {
            title: "Το Τούνελ",
            shortTitle: "Τούνελ",
            shortText:
              "Η υπόγεια διαδρομή που ενώνει τις αυλές του Μυλοτοπιού και διατηρεί τη μνήμη της ιταλικής παρουσίας στο νησί.",
            audioPath: "./assets/audio/qr-guide/tunnel/el.wav",
            audioCaption:
              "Άκουσε μια σύντομη αφήγηση για τη στρατιωτική χρήση του τούνελ και τη σημερινή εμπειρία της διάβασης.",
            body: [
              "Το τούνελ διασχίζει τις αυλές του Μυλοτοπιού και θυμίζει την περίοδο της Ιταλοκρατίας στα Δωδεκάνησα. Μέσα στη δροσερή του διαδρομή ο επισκέπτης συναντά το κελάρι και ίχνη από τη στρατιωτική καθημερινότητα των Ιταλών φαντάρων.",
              "Η έξοδός του οδηγεί στο παλιό πολυβολείο, έναν χώρο που έχει αλλάξει χρήση και σήμερα συνδέει τη μνήμη της άμυνας με τη σύγχρονη φιλοξενία και την εμπειρία της περιήγησης.",
            ],
          },
          en: {
            title: "The Tunnel",
            shortTitle: "Tunnel",
            shortText:
              "The underground passage that links the courtyards of Mylotopi and preserves the memory of the Italian presence on the island.",
            audioPath: "./assets/audio/qr-guide/tunnel/en.wav",
            audioCaption:
              "Listen to a short narration about the tunnel's military use and the experience of moving through it today.",
            body: [
              "The tunnel cuts through the courtyards of Mylotopi and recalls the period of Italian rule in the Dodecanese. Along its cool passage, visitors encounter the cellar and traces of the daily military life of Italian soldiers.",
              "Its exit leads to the former outpost, a space whose purpose has changed over time and now links the memory of defense with contemporary hospitality and the visitor journey.",
            ],
          },
          de: {
            title: "Der Tunnel",
            shortTitle: "Tunnel",
            shortText:
              "Der unterirdische Gang verbindet die Höfe von Mylotopi und bewahrt die Erinnerung an die italienische Präsenz auf der Insel.",
            audioPath: "./assets/audio/qr-guide/tunnel/de.wav",
            audioReady: false,
          },
          it: {
            title: "Il Tunnel",
            shortTitle: "Tunnel",
            shortText:
              "Il passaggio sotterraneo collega i cortili di Mylotopi e conserva la memoria della presenza italiana sull'isola.",
            audioPath: "./assets/audio/qr-guide/tunnel/it.wav",
            audioReady: false,
          },
        },
      },
      {
        id: "fournos",
        accent: "#b56840",
        accentSoft: "rgba(181, 104, 64, 0.18)",
        imageSrc: "",
        placeholderAudio: true,
        imageAlt: {
          el: "Θέση εικόνας για τον Φούρνο",
          en: "Image slot for the Stone Oven",
          de: "Bildplatzhalter für den Steinofen",
          it: "Segnaposto immagine per il forno in pietra",
        },
        translations: {
          el: {
            title: "Ο Φούρνος",
            shortTitle: "Φούρνος",
            shortText:
              "Ο πετρόχτιστος παραδοσιακός φούρνος άνω των εκατό ετών που παραμένει λειτουργικός μέχρι σήμερα.",
            audioPath: "./assets/audio/qr-guide/fournos/el.wav",
            audioCaption:
              "Άκουσε μια σύντομη αφήγηση για την κατασκευή του φούρνου, τα τοπικά υλικά και το ψήσιμο του ψωμιού.",
            body: [
              "Ο φούρνος είναι χτισμένος με τις χαρακτηριστικές πέτρες της Κεφάλου, τους λεγόμενους πόρους, που οφείλουν την ιδιαίτερη σύστασή τους στην ηφαιστειακή τέφρα της Νισύρου. Οι χοντροί τοίχοι του κρατούν τη θερμότητα και δείχνουν πόσο προσεκτική ήταν η παραδοσιακή τεχνική κατασκευής.",
              "Ακόμη και σήμερα παραμένει λειτουργικός και συνδέεται με το ψήσιμο του ζυμωτού ψωμιού και των παραδοσιακών φαγητών. Είναι ένας χώρος όπου η τοπική αρχιτεκτονική και η γαστρονομική μνήμη συναντιούνται άμεσα.",
            ],
          },
          en: {
            title: "The Stone Oven",
            shortTitle: "Fournos",
            shortText:
              "The traditional stone oven, more than a century old, that remains fully functional today.",
            audioPath: "./assets/audio/qr-guide/fournos/en.wav",
            audioCaption:
              "Listen to a short narration about the oven's construction, its local materials, and the baking of bread.",
            body: [
              "The oven is built with the distinctive porous stones of Kefalos, shaped by volcanic ash from Nisyros. Its thick masonry walls retain heat and reveal the care and technical understanding behind traditional construction.",
              "It still functions today for baking kneaded bread and local dishes. This stop brings together vernacular architecture and culinary memory in a very direct and tangible way.",
            ],
          },
          de: {
            title: "Der Steinofen",
            shortTitle: "Ofen",
            shortText:
              "Der traditionelle Steinofen ist über hundert Jahre alt und bis heute funktionsfähig.",
            audioPath: "./assets/audio/qr-guide/fournos/de.wav",
            audioReady: false,
          },
          it: {
            title: "Il Forno in Pietra",
            shortTitle: "Forno",
            shortText:
              "Il tradizionale forno in pietra, con più di cento anni di storia, è ancora oggi funzionante.",
            audioPath: "./assets/audio/qr-guide/fournos/it.wav",
            audioReady: false,
          },
        },
      },
      {
        id: "spiti",
        accent: "#7b5d7c",
        accentSoft: "rgba(123, 93, 124, 0.18)",
        imageSrc: "",
        placeholderAudio: true,
        imageAlt: {
          el: "Θέση εικόνας για το Σπίτι",
          en: "Image slot for the House",
          de: "Bildplatzhalter für das Haus",
          it: "Segnaposto immagine per la casa",
        },
        translations: {
          el: {
            title: "Το Σπίτι",
            shortTitle: "Σπίτι",
            shortText:
              "Η αναπαράσταση της ζωής μιας αγροτικής οικογένειας του 19ου αιώνα, με αντικείμενα και συνήθειες της εποχής.",
            audioPath: "./assets/audio/qr-guide/spiti/el.wav",
            audioCaption:
              "Άκουσε μια σύντομη αφήγηση για τον οικιακό χώρο, τα καθημερινά σκεύη και την ευρηματικότητα των ανθρώπων.",
            body: [
              "Το παραδοσιακό σπίτι φέρνει κοντά στον επισκέπτη την καθημερινότητα μιας αγροτικής οικογένειας του 19ου αιώνα. Στα αντικείμενα και στη διάταξη του χώρου διαβάζει κανείς την ανάγκη για οικονομία, πρακτικότητα και πολλαπλές χρήσεις μέσα στο ίδιο δωμάτιο.",
              "Μέσα από τα σκεύη, τα έπιπλα και τον τρόπο οργάνωσης του σπιτιού αναδεικνύεται μια μορφή ευφυΐας που στηριζόταν στην επιδιόρθωση, στην προσαρμογή και στην αξιοποίηση κάθε διαθέσιμου υλικού.",
            ],
          },
          en: {
            title: "The House",
            shortTitle: "Spiti",
            shortText:
              "A reconstruction of the life of a 19th-century rural family through domestic objects, habits, and everyday routines.",
            audioPath: "./assets/audio/qr-guide/spiti/en.wav",
            audioCaption:
              "Listen to a short narration about the household space, daily utensils, and the ingenuity of its inhabitants.",
            body: [
              "The traditional house brings visitors close to the everyday life of a rural family in the 19th century. Through the objects and layout of the interior, one can read the need for economy, practicality, and multiple uses within the same domestic space.",
              "Utensils, furniture, and household organization reveal a form of intelligence rooted in repair, adaptation, and the careful use of every available material.",
            ],
          },
          de: {
            title: "Das Haus",
            shortTitle: "Haus",
            shortText:
              "Eine Rekonstruktion des Lebens einer ländlichen Familie des 19. Jahrhunderts mit Alltagsgegenständen und Gewohnheiten jener Zeit.",
            audioPath: "./assets/audio/qr-guide/spiti/de.wav",
            audioReady: false,
          },
          it: {
            title: "La Casa",
            shortTitle: "Casa",
            shortText:
              "Una ricostruzione della vita di una famiglia rurale del XIX secolo attraverso oggetti domestici e abitudini quotidiane.",
            audioPath: "./assets/audio/qr-guide/spiti/it.wav",
            audioReady: false,
          },
        },
      },
      {
        id: "anemomylos",
        accent: "#58708a",
        accentSoft: "rgba(88, 112, 138, 0.18)",
        imageSrc: "",
        placeholderAudio: true,
        imageAlt: {
          el: "Θέση εικόνας για τον Ανεμόμυλο",
          en: "Image slot for the Windmill",
          de: "Bildplatzhalter für die Windmühle",
          it: "Segnaposto immagine per il mulino a vento",
        },
        translations: {
          el: {
            title: "Ο Ανεμόμυλος",
            shortTitle: "Ανεμόμυλος",
            shortText:
              "Ένας από τους παλαιότερους δωδεκανησιακούς μύλους, μνημείο πολιτιστικής κληρονομιάς και ζωντανή μαρτυρία της άλεσης των σιτηρών.",
            audioPath: "./assets/audio/qr-guide/anemomylos/el.wav",
            audioCaption:
              "Άκουσε μια σύντομη αφήγηση για την ιστορία του μύλου, τα παλιά ξύλα του και την αποκατάστασή του.",
            body: [
              "Ο ανεμόμυλος του Μυλοτοπιού συγκαταλέγεται στους παλαιότερους μύλους των Δωδεκανήσων και μεταφέρει την ιστορία της άλεσης των σιτηρών μέσα από την ίδια τη δομή του. Η παλιά ξυλεία του και ο λιθόκτιστος όγκος του μαρτυρούν τη μακρά συνέχεια της χρήσης του στον χρόνο.",
              "Η αποκατάστασή του κράτησε μήνες και τον επανέφερε σε λειτουργική κατάσταση. Η στέγη του, σχηματισμένη από αναποδογυρισμένο καΐκι, προσθέτει ένα ακόμη στοιχείο τοπικής δεξιοτεχνίας και ναυτικής μνήμης στο σύνολο του μνημείου.",
            ],
          },
          en: {
            title: "The Windmill",
            shortTitle: "Anemomylos",
            shortText:
              "One of the oldest windmills in the Dodecanese, a heritage monument and a living witness to grain milling.",
            audioPath: "./assets/audio/qr-guide/anemomylos/en.wav",
            audioCaption:
              "Listen to a short narration about the windmill's history, its ancient timber, and its restoration.",
            body: [
              "The Mylotopi windmill belongs to the oldest mills in the Dodecanese and carries the history of grain milling within its very structure. Its old timber and heavy stone body testify to the long continuity of its use across the centuries.",
              "Its restoration lasted several months and returned the mill to working condition. The roof, formed from an overturned boat, adds another layer of local craftsmanship and maritime memory to the monument as a whole.",
            ],
          },
          de: {
            title: "Die Windmühle",
            shortTitle: "Windmühle",
            shortText:
              "Eine der ältesten Windmühlen des Dodekanes, ein Denkmal des kulturellen Erbes und lebendiges Zeugnis der Getreidemüllerei.",
            audioPath: "./assets/audio/qr-guide/anemomylos/de.wav",
            audioReady: false,
          },
          it: {
            title: "Il Mulino a Vento",
            shortTitle: "Mulino",
            shortText:
              "Uno dei più antichi mulini a vento del Dodecaneso, monumento del patrimonio culturale e testimonianza viva della macinazione dei cereali.",
            audioPath: "./assets/audio/qr-guide/anemomylos/it.wav",
            audioReady: false,
          },
        },
      },
    ],
  };
})();
