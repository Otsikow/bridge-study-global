const de = {
  common: {
    languageNames: {
      en: "Englisch",
      de: "Deutsch",
      fr: "Französisch",
      pt: "Portugiesisch",
      sw: "Suaheli",
      es: "Spanisch",
      zh: "Chinesisch",
      hi: "Hindi",
      ar: "Arabisch",
    },
    labels: {
      language: "Sprache",
      selectLanguage: "Sprache auswählen",
      toggleNavigation: "Navigation umschalten",
      openUserMenu: "Benutzermenü öffnen",
      currentPage: "Aktuelle Seite",
      showRecentPages: "Neueste Seiten anzeigen",
    },
    actions: {
      login: "Anmelden",
      signup: "Registrieren",
      logout: "Abmelden",
      goToLogin: "Zum Login",
      goBack: "Zurück",
      reloadPage: "Seite neu laden",
      retry: "Erneut versuchen",
      save: "Speichern",
      clear: "Zurücksetzen",
      cancel: "Abbrechen",
      submit: "Absenden",
      markAllRead: "Alle als gelesen markieren",
    },
    navigation: {
      home: "Startseite",
      search: "Suche",
      courses: "Studiengänge",
      blog: "Blog",
      contact: "Kontakt",
      dashboard: "Dashboard",
      settings: "Einstellungen",
      helpCenter: "Hilfezentrum",
      faq: "FAQ",
      feedback: "Feedback",
      visaCalculator: "Visa-Rechner",
      privacy: "Datenschutz",
      terms: "Nutzungsbedingungen",
    },
    status: {
      loading: "Lädt...",
      loadingInterface: "Benutzeroberfläche wird geladen...",
    },
    notifications: {
      success: "Erfolg",
      error: "Fehler",
      saved: "Gespeichert",
      deleted: "Gelöscht",
    },
  },
  layout: {
    navbar: {
      brand: {
        short: "GEG",
        full: "Global Education Gateway",
        extended: "GEG — Global Education Gateway",
      },
      links: {
        home: "Startseite",
        search: "Suche",
        courses: "Studiengänge",
        blog: "Blog",
        contact: "Kontakt",
      },
      auth: {
        login: "Anmelden",
        signup: "Registrieren",
        logout: "Abmelden",
      },
      userMenu: {
        open: "Benutzermenü öffnen",
        dashboard: "Dashboard",
        settings: "Einstellungen",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "Wir verbinden internationale Studierende mit erstklassigen Universitäten über verifizierte Agenten und eine transparente Antragsverwaltung.",
      contactEmailLabel: "E-Mail an uns",
      headings: {
        platform: "Plattform",
        support: "Support",
        accountLegal: "Konto & Rechtliches",
      },
      platformLinks: {
        search: "Universitäten suchen",
        blog: "Blog",
        visaCalculator: "Visa-Rechner",
        feedback: "Feedback",
      },
      supportLinks: {
        help: "Hilfezentrum",
        contact: "Kontakt",
        faq: "FAQ",
        dashboard: "Dashboard",
      },
      accountLinks: {
        login: "Anmelden",
        signup: "Jetzt starten",
        privacy: "Datenschutz",
        terms: "Nutzungsbedingungen",
      },
      copyright:
        "© {{year}} GEG — Global Education Gateway. Alle Rechte vorbehalten.",
      questions: "Fragen?",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "Lädt...",
      retry: "Erneut versuchen",
    },
    emptyState: {
      noRecentPages: "Keine zuletzt besuchten Seiten",
      goToFallback: "Zur Ausweichseite",
      clearHistory: "Verlauf löschen",
      currentPage: "Aktuelle Seite",
    },
    contactForm: {
      placeholders: {
        name: "Ihr Name",
        email: "Ihre E-Mail",
        whatsapp: "Ihre WhatsApp-Nummer (optional)",
        message: "Ihre Nachricht",
      },
      submit: {
        default: "Nachricht senden",
        loading: "Wird gesendet...",
      },
      notifications: {
        signInRequiredTitle: "Anmeldung erforderlich",
        signInRequiredDescription:
          "Bitte melden Sie sich an, um uns eine Nachricht zu senden.",
        successTitle: "Nachricht gesendet!",
        successDescription:
          "Vielen Dank für Ihre Kontaktaufnahme. Wir melden uns bald bei Ihnen.",
        validationTitle: "Validierungsfehler",
        errorTitle: "Fehler",
        errorDescription:
          "Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      },
      errors: {
        nameRequired: "Name ist erforderlich",
        nameMax: "Der Name darf maximal 100 Zeichen enthalten",
        emailInvalid: "Ungültige E-Mail-Adresse",
        emailMax: "Die E-Mail darf maximal 255 Zeichen enthalten",
        messageRequired: "Nachricht ist erforderlich",
        messageMax: "Die Nachricht darf maximal 1000 Zeichen enthalten",
        whatsappInvalid:
          "Die WhatsApp-Nummer darf nur Zahlen und Telefonsymbole enthalten",
        whatsappMax: "Die WhatsApp-Nummer darf maximal 30 Zeichen enthalten",
      },
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "Seite konnte nicht geladen werden",
      failedToLoadPageDescription:
        "Die Seite konnte nicht geladen werden. Möglicherweise besteht ein Netzwerkproblem oder die Seite ist vorübergehend nicht verfügbar.",
      chunkReloadMessage:
        "Wir haben die App aktualisiert, um die neuesten Dateien abzurufen. Wenn das weiterhin passiert, löschen Sie bitte den Browser-Cache und versuchen Sie es erneut.",
    },
    loading: "Anwendung wird geladen...",
    errorBoundary: {
      networkTitle: "Verbindungsfehler",
      networkMessage:
        "Die Netzwerkverbindung ist fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      chunkTitle: "Ladefehler",
      chunkMessage:
        "Anwendungsressourcen konnten nicht geladen werden. Dies passiert normalerweise nach einem Update der App.",
      permissionTitle: "Zugriff verweigert",
      permissionMessage: "Sie haben keine Berechtigung für diesen Zugriff.",
      notFoundTitle: "Nicht gefunden",
      notFoundMessage: "Die angeforderte Ressource wurde nicht gefunden.",
      unauthorizedTitle: "Sitzung abgelaufen",
      unauthorizedMessage:
        "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
      databaseTitle: "Datenbankfehler",
      databaseMessage:
        "Die Datenbankverbindung ist fehlgeschlagen. Bitte versuchen Sie es in Kürze erneut.",
      genericTitle: "Etwas ist schiefgelaufen",
      genericMessage:
        "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      fallbackTitle: "Fehler",
      fallbackMessage: "Es ist ein unerwarteter Fehler aufgetreten",
      technicalDetails: "Technische Details",
      tryAgain: "Erneut versuchen",
      tryAgainCount: "Erneut versuchen ({count} verbleibend)",
      goHome: "Zur Startseite",
      maxRetriesReached:
        "Maximale Anzahl an Wiederholungen erreicht. Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.",
    },
  },
  pages: {
    index: {
      hero: {
        trustBadge: "Von {{count}}+ Studierenden weltweit vertraut",
        title: {
          prefix: "Willkommen bei",
          highlight: "Global Education Gateway (GEG)",
          suffix: "",
        },
        description:
          "Verbinden Sie sich mit führenden Universitäten, verfolgen Sie Bewerbungen in Echtzeit und erhalten Sie fachkundige Unterstützung durch verifizierte Agenten.",
        ctas: {
          students: {
            badge: "Studierende",
            title: "Starten Sie Ihre globale Bewerbung",
            description:
              "Erstellen Sie ein Profil, laden Sie Ihre Dokumente einmal hoch und senden Sie in Minuten professionelle Bewerbungen an Top-Universitäten.",
            action: "Bewerbung starten",
          },
          agents: {
            badge: "Agenten",
            title: "Betreuen Sie Studierende mit smarten Tools",
            description:
              "Greifen Sie auf Dashboards zu, arbeiten Sie in Echtzeit zusammen und verfolgen Sie jeden Meilenstein, während Sie Ihre Agenturmarke ausbauen.",
            action: "Als Agent beitreten",
          },
          universities: {
            badge: "Universitäten",
            title: "Skalieren Sie Partnerschaften, die überzeugen",
            description:
              "Knüpfen Sie Kontakte zu qualifizierten Bewerber:innen, erhalten Sie Marktanalysen und arbeiten Sie weltweit mit verifizierten Berater:innen zusammen.",
            action: "Partner werden",
          },
        },
      },
      features: {
        heading: "Warum GEG wählen?",
        cards: {
          applyEasily: {
            title: "Einfach bewerben",
            description:
              "Ein schlanker Bewerbungsprozess mit Schritt-für-Schritt-Anleitung. Reichen Sie Bewerbungen mühelos bei mehreren Universitäten ein.",
          },
          trackRealtime: {
            title: "In Echtzeit verfolgen",
            description:
              "Verfolgen Sie den Status Ihrer Bewerbung rund um die Uhr mit Live-Updates und sofortigen Benachrichtigungen.",
          },
          connectAgents: {
            title: "Mit verifizierten Agenten verbinden",
            description:
              "Greifen Sie auf zertifizierte Bildungsberater:innen zu, die Sie während Ihres gesamten Weges persönlich unterstützen.",
          },
        },
      },
      journeyRibbon: {
        items: {
          discover: {
            stage: "Entdecken",
            metricValue: "200+",
            metricLabel: "Partneruniversitäten",
            description:
              "KI-gestützte Empfehlungen zeigen Ihnen sofort die bestpassenden Hochschulen, sobald Sie sich anmelden.",
            ctaLabel: "Bewerbung starten",
          },
          plan: {
            stage: "Planen",
            metricValue: "5000+",
            metricLabel: "Personalisierte Pläne erstellt",
            description:
              "Checklisten und intelligente Erinnerungen halten tausende Studierende vom Zeugnis bis zum Motivationsschreiben organisiert.",
            ctaLabel: "",
          },
          collaborate: {
            stage: "Zusammenarbeiten",
            metricValue: "24h",
            metricLabel: "Durchschnittliche Agentenantwort",
            description:
              "Verifizierte Berater überarbeiten Dokumente, beantworten Fragen und stimmen Zeitpläne in Echtzeit über alle Kanäle ab.",
            ctaLabel: "Agenten kennenlernen",
          },
          submit: {
            stage: "Einreichen",
            metricValue: "95%",
            metricLabel: "Erfolgsquote",
            description:
              "Zentralisierte Einreichungen mit proaktiven Hinweisen sorgen dafür, dass Bewerbungen ohne Fristversäumnis vorankommen.",
            ctaLabel: "",
          },
          celebrate: {
            stage: "Feiern",
            metricValue: "50+",
            metricLabel: "Vertretene Länder",
            description:
              "Visa-Checklisten und Abreisevorbereitung führen Studierende mit Zuversicht an Campus weltweit.",
            ctaLabel: "",
          },
        },
      },
      storyboard: {
        heading: "So vereinfacht GEG jeden Schritt",
        subheading:
          "Erleben Sie Schritt für Schritt, wie unsere Plattform und unser Team Ihre Bewerbung von der Idee bis zur Ankunft begleiten.",
        stepLabel: "Schritt {{number}}",
        steps: {
          discover: {
            title: "Finden Sie Ihre passenden Programme",
            description:
              "Nennen Sie Ihre Ziele und Leistungen – GEG kuratiert sofort Universitäten, Programme und Stipendien, die zu Ihnen passen.",
            support:
              "Intelligente Filter und KI-Empfehlungen nehmen das Rätselraten ab, damit Sie in Minuten eine Shortlist erstellen.",
            imageAlt:
              "Studierende überprüft Studienprogramme bei einem Campusbesuch",
          },
          plan: {
            title: "Erstellen Sie einen persönlichen Bewerbungsplan",
            description:
              "Laden Sie Zeugnisse, Testergebnisse und Texte mit geführten Checklisten hoch, die alles in handliche Aufgaben aufteilen.",
            support:
              "Automatische Erinnerungen und Dokumenttipps halten Sie vor jeder Frist auf Kurs.",
            imageAlt:
              "Studierende plant Bewerbungsaufgaben im Freien am Laptop",
          },
          collaborate: {
            title: "Arbeiten Sie mit Ihrem Expert:innen-Agenten zusammen",
            description:
              "Arbeiten Sie mit einem verifizierten GEG-Berater zusammen, um Dokumente zu verfeinern, Zeitpläne abzustimmen und interviewbereit zu bleiben.",
            support:
              "Gemeinsame Arbeitsbereiche, kommentiertes Feedback und Sofortnachrichten sorgen für transparente Entscheidungen.",
            imageAlt:
              "Studierende kommuniziert mit einem Bildungsberater über das Smartphone",
          },
          track: {
            title: "Einreichen & verfolgen ohne Stress",
            description:
              "Bewerben Sie sich gleichzeitig bei mehreren Universitäten und verfolgen Sie jede Rückmeldung und jedes Angebot auf einer Zeitachse.",
            support:
              "Live-Statusanzeigen und proaktive Hinweise zeigen den nächsten Schritt, damit nichts untergeht.",
            imageAlt:
              "Studierende verfolgt den Bewerbungsstatus auf dem Campus",
          },
          celebrate: {
            title: "Feiern & Abreise vorbereiten",
            description:
              "Nehmen Sie Ihr Angebot an, schließen Sie Visa-Schritte ab und erhalten Sie zielgenaue Vorbereitungsressourcen.",
            support:
              "Visa-Checklisten, Wohnungsrat und Einschreibe-Bestätigungen begleiten Sie bis zum Abflug.",
            imageAlt:
              "Studierende feiert die Visa-Genehmigung mit Dokumenten in der Hand",
          },
        },
      },
      featuredUniversities: {
        heading: "Ausgewählte Universitäten",
        description:
          "Institutionen, die internationalen GEG-Studierenden konsequent ein herausragendes Onboarding-Erlebnis bieten.",
        network: {
          label: "Ausgewähltes Netzwerk",
          summary:
            "{{count}} Institutionen, kuratiert von unserem Partnerschaftsteam",
        },
        badges: {
          topPick: "Top-Empfehlung",
          priority: "Priorität #{{position}}",
        },
        actions: {
          visitSite: "Website besuchen",
          scrollLeft: "Ausgewählte Universitäten nach links scrollen",
          scrollRight: "Ausgewählte Universitäten nach rechts scrollen",
        },
        fallback: {
          summary:
            "Engagierte Partner, die Studierende von Global Education Gateway mit maßgeschneiderter Unterstützung begrüßen.",
          highlight: "Engagierter Erfolgspartner für Studierende",
          notice: {
            error:
              "Wir zeigen hervorgehobene Partner, während wir die Auswahlliste wieder verbinden.",
            updating:
              "Wir zeigen hervorgehobene Partner, während unsere Auswahlliste aktualisiert wird.",
          },
        },
        partnerCta: {
          heading: "Partner werden",
          description:
            "Präsentieren Sie Ihre Institution tausenden motivierten Studierenden weltweit.",
          action: "Dem Netzwerk beitreten",
        },
      },
      visa: {
        badge: "Feature-Highlight",
        title: "Verstehen Sie Ihre Visa-Chancen, bevor Sie sich bewerben",
        description:
          "Unser Visa-Eignungsrechner analysiert Ihr Profil sofort, damit Sie sich auf die Länder und Programme konzentrieren können, die Sie am meisten willkommen heißen.",
        cta: "Visa-Rechner entdecken",
      },
      testimonials: {
        heading: "Erfolgsgeschichten",
        items: [
          {
            name: "Sarah Johnson",
            role: "Master-Studentin am MIT",
            country: "USA",
            quote:
              "GEG hat meinen Traum, am MIT zu studieren, wahr gemacht. Die Plattform war intuitiv und mein Agent unglaublich unterstützend.",
            rating: 5,
          },
          {
            name: "Raj Patel",
            role: "MBA-Student an der Universität Oxford",
            country: "UK",
            quote:
              "Die Echtzeitverfolgung gab mir Sicherheit. Ich wusste immer, wo meine Bewerbung stand. GEG ist sehr zu empfehlen!",
            rating: 5,
          },
          {
            name: "Maria Garcia",
            role: "Ingenieurstudentin an der Stanford University",
            country: "USA",
            quote:
              "Von der Programmsuche bis zur Visa-Genehmigung hat mich GEG in jedem Schritt unterstützt. Hervorragender Service!",
            rating: 5,
          },
        ],
      },
      faq: {
        heading: "Häufig gestellte Fragen",
        subtitle: "Schnelle Antworten auf häufige Fragen",
        audienceHeading: "Für {{audience}}",
        sections: [
          {
            audience: "Studierende",
            items: [
              {
                question:
                  "Wie unterstützt mich GEG bei der Bewerbung an Universitäten?",
                answer:
                  "GEG verbindet Sie mit verifizierten Agenten, die Sie in jeder Phase begleiten – von der Hochschulwahl bis zur Dokumenteneinreichung.",
              },
              {
                question: "Kostet die Nutzung der Plattform etwas?",
                answer:
                  "Das Erstellen eines Kontos und das Erkunden von Universitäten ist kostenlos. Agenten können Beratungsgebühren erheben, die vor einer Zusage klar angezeigt werden.",
              },
              {
                question: "Welche Unterlagen brauche ich für die Bewerbung?",
                answer:
                  "Typischerweise werden akademische Zeugnisse, Englischtests (IELTS/TOEFL), Empfehlungsschreiben, Motivationsschreiben und eine Passkopie benötigt.",
              },
            ],
          },
        ],
      },
      contact: {
        heading: "Kontakt aufnehmen",
        subtitle: "Sie haben Fragen? Wir helfen gerne weiter.",
      },
    },
    universitySearch: {
      hero: {
        title: "Finden Sie Ihre ideale Universität",
        subtitle:
          "Durchsuchen Sie Universitäten, Programme und Stipendien weltweit.",
      },
      tabs: {
        search: "Suche",
        recommendations: "KI-Empfehlungen",
        sop: "SOP-Generator",
        interview: "Interviewtraining",
      },
      filters: {
        title: "Suchfilter",
        subtitle: "Verfeinern Sie Ihre Suche unten",
        fields: {
          universityName: {
            label: "Name der Universität",
            placeholder: "Universitäten suchen...",
          },
          country: {
            label: "Land",
            placeholder: "Land auswählen",
            all: "Alle Länder",
          },
          programLevel: {
            label: "Programmniveau",
            placeholder: "Niveau auswählen",
            all: "Alle Niveaus",
          },
          discipline: {
            label: "Fachbereich",
            placeholder: "Fachbereich auswählen",
            all: "Alle Fachbereiche",
          },
          maxFee: {
            label: "Maximale Gebühr (USD)",
            placeholder: "Maximalbetrag eingeben",
          },
          scholarshipsOnly: {
            label: "Nur Universitäten mit Stipendien anzeigen",
          },
        },
      },
      actions: {
        search: "Suchen",
      },
      results: {
        loading: "Suche läuft...",
        found_one: "{{count}} Ergebnis gefunden",
        found_other: "{{count}} Ergebnisse gefunden",
        empty: "Keine Universitäten gefunden. Passen Sie Ihre Filter an.",
        scholarshipBadge_one: "{{count}} Stipendium",
        scholarshipBadge_other: "{{count}} Stipendien",
        programs: {
          heading_one: "Programme ({{count}})",
          heading_other: "Programme ({{count}})",
          apply: "Jetzt bewerben",
          more_one: "+{{count}} weiteres Programm",
          more_other: "+{{count}} weitere Programme",
        },
        scholarships: {
          heading: "Stipendien",
          amountVaries: "Betrag variiert",
          more_one: "+{{count}} weiteres Stipendium",
          more_other: "+{{count}} weitere Stipendien",
        },
        viewDetails: "Details ansehen",
        visitWebsite: "Website besuchen",
      },
    },
    contact: {
      heroTitle: "Kontaktieren Sie uns",
      heroSubtitle: "In der Regel antworten wir innerhalb eines Werktags.",
      emailPrompt: "Lieber per E-Mail?",
      email: "info@globaleducationgateway.com",
      imageAlt: "Professionelle Bildungsberaterin, bereit zu helfen",
      formTitle: "Senden Sie uns eine Nachricht",
    },
    faq: {
      heroTitle: "Häufig gestellte Fragen",
      heroSubtitle:
        "Schnelle Antworten auf die häufigsten Fragen rund um Ihre Bildungskarriere",
      imageAlt: "Studierende, die lernen und recherchieren",
      sections: [
        {
          audience: "Studierende",
          items: [
            {
              question:
                "Wie unterstützt mich GEG bei der Bewerbung an Universitäten?",
              answer:
                "GEG verbindet Sie mit verifizierten Agenten, die Sie in jeder Phase begleiten – von der Hochschulwahl bis zur Dokumenteneinreichung.",
            },
            {
              question: "Kostet die Nutzung der Plattform etwas?",
              answer:
                "Das Erstellen eines Kontos und das Erkunden von Universitäten ist kostenlos. Agenten können Beratungsgebühren erheben, die vor einer Zusage klar angezeigt werden.",
            },
            {
              question: "Welche Unterlagen brauche ich für die Bewerbung?",
              answer:
                "Typischerweise werden akademische Zeugnisse, Englischtests (IELTS/TOEFL), Empfehlungsschreiben, Motivationsschreiben und eine Passkopie benötigt.",
            },
            {
              question:
                "Kann ich mich bei mehreren Universitäten gleichzeitig bewerben?",
              answer:
                "Ja! Sie können sich gleichzeitig bei mehreren Universitäten bewerben und alle Bewerbungen in einem Dashboard nachverfolgen.",
            },
            {
              question:
                "Wie bleibe ich über den Status meiner Bewerbung informiert?",
              answer:
                "Ihr persönliches Dashboard zeigt Echtzeit-Updates, Fristen und nächste Schritte, sodass Sie immer wissen, was als Nächstes zu tun ist.",
            },
          ],
        },
        {
          audience: "Universitäten",
          items: [
            {
              question: "Wie kann unsere Universität mit GEG zusammenarbeiten?",
              answer:
                "Reichen Sie eine Partnerschaftsanfrage über das Universitätsportal ein oder kontaktieren Sie unser Partnermanagement. Wir verifizieren Ihre Institution und starten das Onboarding innerhalb weniger Werktage.",
            },
            {
              question: "Welche Einblicke erhalten Universitäten?",
              answer:
                "Universitäten erhalten Dashboards mit Bewerberpipelines, Konversionskennzahlen und regionalen Interessen, um Rekrutierungskampagnen gezielt zu planen.",
            },
            {
              question:
                "Können wir Angebote direkt auf der Plattform verwalten?",
              answer:
                "Ja. Zulassungsteams können bedingte oder endgültige Angebote erstellen, fehlende Dokumente anfordern und mit Studierenden und Agenten in einem gemeinsamen Arbeitsbereich kommunizieren.",
            },
          ],
        },
        {
          audience: "Agenten",
          items: [
            {
              question: "Welche Unterstützung erhalten Agenten bei GEG?",
              answer:
                "Agenten erhalten ein dediziertes CRM, Marketingmaterialien und bedarfsgerechte Schulungen, um Studierende schnell mit passenden Programmen zu verknüpfen.",
            },
            {
              question: "Wie werden Agentenkommissionen gehandhabt?",
              answer:
                "Provisionsstrukturen sind transparent. Universitäten definieren die Konditionen, und Auszahlungen werden im Agenten-Dashboard zur einfachen Nachverfolgung dokumentiert.",
            },
            {
              question:
                "Können Agenten mit Universitätszulassungsteams zusammenarbeiten?",
              answer:
                "Auf jeden Fall. Gemeinsame Arbeitsbereiche und Nachrichtenthreads halten alle Parteien über Fortschritte, fehlende Dokumente und Interviewtermine auf dem Laufenden.",
            },
          ],
        },
      ],
    },
  },
};

export default de;
