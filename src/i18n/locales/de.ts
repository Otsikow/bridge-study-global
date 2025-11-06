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
      copyright: "© {{year}} GEG — Global Education Gateway. Alle Rechte vorbehalten.",
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
      networkMessage: "Die Netzwerkverbindung ist fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      chunkTitle: "Ladefehler",
      chunkMessage: "Anwendungsressourcen konnten nicht geladen werden. Dies passiert normalerweise nach einem Update der App.",
      permissionTitle: "Zugriff verweigert",
      permissionMessage: "Sie haben keine Berechtigung für diesen Zugriff.",
      notFoundTitle: "Nicht gefunden",
      notFoundMessage: "Die angeforderte Ressource wurde nicht gefunden.",
      unauthorizedTitle: "Sitzung abgelaufen",
      unauthorizedMessage: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
      databaseTitle: "Datenbankfehler",
      databaseMessage: "Die Datenbankverbindung ist fehlgeschlagen. Bitte versuchen Sie es in Kürze erneut.",
      genericTitle: "Etwas ist schiefgelaufen",
      genericMessage: "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      fallbackTitle: "Fehler",
      fallbackMessage: "Es ist ein unerwarteter Fehler aufgetreten",
      technicalDetails: "Technische Details",
      tryAgain: "Erneut versuchen",
      tryAgainCount: "Erneut versuchen ({count} verbleibend)",
      goHome: "Zur Startseite",
      maxRetriesReached: "Maximale Anzahl an Wiederholungen erreicht. Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.",
    },
  },
  pages: {
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
      heroSubtitle: "Schnelle Antworten auf die häufigsten Fragen rund um Ihre Bildungskarriere",
      imageAlt: "Studierende, die lernen und recherchieren",
      sections: [
        {
          audience: "Studierende",
          items: [
            {
              question: "Wie unterstützt mich GEG bei der Bewerbung an Universitäten?",
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
              question: "Kann ich mich bei mehreren Universitäten gleichzeitig bewerben?",
              answer:
                "Ja! Sie können sich gleichzeitig bei mehreren Universitäten bewerben und alle Bewerbungen in einem Dashboard nachverfolgen.",
            },
            {
              question: "Wie bleibe ich über den Status meiner Bewerbung informiert?",
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
              question: "Können wir Angebote direkt auf der Plattform verwalten?",
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
              question: "Können Agenten mit Universitätszulassungsteams zusammenarbeiten?",
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
