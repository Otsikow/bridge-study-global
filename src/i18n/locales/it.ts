import en from "./en";

const it = {
  ...en,
  common: {
    ...en.common,
    languageNames: {
      ...en.common.languageNames,
      en: "Inglese",
      fr: "Francese",
      de: "Tedesco",
      pt: "Portoghese",
      it: "Italiano",
    },
  },
  pages: {
    ...en.pages,
    index: {
      ...(en.pages?.index ?? {}),
        aiDocumentChecker: {
          badge: "AI Document Checker",
          heading: "Let AI review every document in seconds",
          description:
            "Automatically review and approve passports, WAEC/NECO results, transcripts, recommendation letters, and bank statements without manual back-and-forth.",
          tagline: "This saves you HOURS.",
          approvals: {
            heading: "Automatically review & approve",
            description: "Every required file is scored, classified, and approved before it reaches your desk.",
            items: [
              "Passport",
              "WAEC/NECO",
              "Transcripts",
              "Recommendation letters",
              "Bank statements",
            ],
          },
          detections: {
            heading: "AI instantly flags",
            description: "The checker stops risky submissions before they delay a student's visa or offer.",
            items: [
              "Missing pages",
              "Unclear images",
              "Wrong document type",
              "Fraud signs",
            ],
          },
          riskMonitoring: {
            heading: "AI detects fake tutors & fake agents",
            description: "AI flags suspicious behaviour:",
            items: [
              "Same passport used for multiple accounts",
              "Students buying fabricated bank statements",
              "Uploading fake WAEC results",
              "Agents sending unrealistic profiles",
            ],
            footnote: "This protects your reputation.",
          },
          stats: [
            { value: "60s", label: "Average review time" },
            { value: "5 docs", label: "Checked simultaneously" },
            { value: "24/7", label: "Automated monitoring" },
          ],
        },
      aiSearch: {
        badge: "Ricerca università e borse di studio con IA",
        heading: "Trova il programma giusto con un'intelligenza in tempo reale",
        description:
          "Fai domande su università, corsi o finanziamenti in qualsiasi parte del mondo. La nostra IA analizza dati di ammissione, borse di studio e percorsi di visto in linea con i tuoi obiettivi.",
        subheading:
          "Iscriviti per sbloccare consigli personalizzati basati sull'IA su ammissioni, borse di studio e visti.",
        ctaLabel: "Inizia ora",
        stats: [
          { value: "12k+", label: "Approfondimenti IA generati per candidati internazionali" },
          { value: "84%", label: "Studenti abbinati ad almeno tre programmi ideali" },
          { value: "50+", label: "Paesi coperti con dati di ammissione verificati" },
        ],
        panel: {
          title: "Anteprima di Zoe Intelligence",
          subtitle: "Scegli un'area di interesse per scoprire gli insight che otterrai.",
          previewLabel: "Esempio",
          highlightsHeading: "Cosa prepara l'IA per te",
        },
        focusAreas: [
          {
            key: "stem",
            label: "STEM",
            headline: "Percorsi su misura per innovatori tecnici",
            description:
              "Metti in evidenza programmi con laboratori di ricerca, tirocini e finanziamenti dedicati a scienze e ingegneria.",
            highlights: [
              "Borse che privilegiano corsi STEM e risultati di ricerca",
              "Curricula allineati al mercato con stage e programmi co-op",
              "Indicazioni sul visto per ruoli tecnologici e ingegneristici molto richiesti",
            ],
          },
          {
            key: "scholarships",
            label: "Borse di studio",
            headline: "Opportunità di finanziamento in linea con il tuo profilo",
            description:
              "Individua sovvenzioni, borse e assistantship che puoi realisticamente ottenere.",
            highlights: [
              "Elenco selezionato di borse al merito e per necessità con scadenze",
              "Requisiti di idoneità collegati al tuo percorso accademico",
              "Suggerimenti per rafforzare lettere motivazionali e referenze",
            ],
          },
          {
            key: "visa",
            label: "Visti favorevoli",
            headline: "Percorsi di studio con iter migratori scorrevoli",
            description: "Confronta paesi e istituzioni con percorsi di visto vantaggiosi.",
            highlights: [
              "Opzioni di lavoro post-laurea e durata della permanenza riassunte",
              "Checklist documentali adattate alla tua nazionalità",
              "Indicazioni su prove finanziarie, assicurazioni e preparazione ai colloqui",
            ],
          },
          {
            key: "undergraduate",
            label: "Laurea triennale",
            headline: "Percorsi undergraduate per chi si candida per la prima volta",
            description:
              "Comprendi requisiti di ingresso, prerequisiti e servizi di supporto.",
            highlights: [
              "Cronologia passo a passo dalla valutazione dei titoli all'ammissione",
              "Guida nella scelta di corsi di laurea, minor e anni propedeutici",
              "Risorse per alloggio, orientamento e gestione del budget",
            ],
          },
          {
            key: "postgraduate",
            label: "Laurea magistrale",
            headline: "Master e dottorati in linea con i tuoi obiettivi",
            description: "Confronta relatori di ricerca, dimensioni delle classi e modelli di finanziamento.",
            highlights: [
              "Profili dei docenti e temi di ricerca attuali",
              "Disponibilità di assistantship e fellowship con borsa",
              "Preparazione a colloqui e portfolio per ciascun programma",
            ],
          },
          {
            key: "coop",
            label: "Co-op e tirocini",
            headline: "Apprendimento integrato al lavoro con aziende globali",
            description:
              "Trova programmi che combinano studio ed esperienza professionale concreta.",
            highlights: [
              "Tassi di inserimento e partnership con aziende nelle varie regioni",
              "Considerazioni sul visto per tirocini retribuiti e periodi lavorativi",
              "Supporto career service per CV, colloqui e networking",
            ],
          },
        ],
      },
    },
  },
};

export default it;
