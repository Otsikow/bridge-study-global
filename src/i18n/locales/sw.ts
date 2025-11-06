const sw = {
  common: {
    languageNames: {
      en: "Kiingereza",
      de: "Kijerumani",
      fr: "Kifaransa",
      pt: "Kireno",
      sw: "Kiswahili",
      es: "Kihispania",
      zh: "Kichina",
      hi: "Kihindi",
      ar: "Kiarabu",
    },
    labels: {
      language: "Lugha",
      selectLanguage: "Chagua lugha",
      toggleNavigation: "Badilisha urambazaji",
      openUserMenu: "Fungua menyu ya mtumiaji",
      currentPage: "Ukurasa wa sasa",
      showRecentPages: "Onyesha kurasa za hivi karibuni",
    },
    actions: {
      login: "Ingia",
      signup: "Jisajili",
      logout: "Toka",
      goToLogin: "Nenda kwenye kuingia",
      goBack: "Rudi",
      reloadPage: "Pakua ukurasa upya",
      retry: "Jaribu tena",
      save: "Hifadhi",
      clear: "Futa",
      cancel: "Ghairi",
      submit: "Tuma",
      markAllRead: "Weka zote kama zimesomwa",
    },
    navigation: {
      home: "Nyumbani",
      search: "Tafuta",
      courses: "Kozi",
      blog: "Blogu",
      contact: "Wasiliana",
      dashboard: "Dashibodi",
      settings: "Mipangilio",
      helpCenter: "Kituo cha msaada",
      faq: "Maswali",
      feedback: "Maoni",
      visaCalculator: "Kikokotoo cha viza",
      privacy: "Sera ya faragha",
      terms: "Sheria na masharti",
    },
    status: {
      loading: "Inapakia...",
      loadingInterface: "Inapakia kiolesura...",
    },
    notifications: {
      success: "Mafanikio",
      error: "Hitilafu",
      saved: "Imehifadhiwa",
      deleted: "Imefutwa",
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
        home: "Nyumbani",
        search: "Tafuta",
        courses: "Kozi",
        blog: "Blogu",
        contact: "Wasiliana",
      },
      auth: {
        login: "Ingia",
        signup: "Jisajili",
        logout: "Toka",
      },
      userMenu: {
        open: "Fungua menyu ya mtumiaji",
        dashboard: "Dashibodi",
        settings: "Mipangilio",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "Tunawaunganisha wanafunzi wa kimataifa na vyuo vikuu bora kupitia mawakala waliothibitishwa na usimamizi wa uwazi wa maombi.",
      contactEmailLabel: "Tutumie barua pepe",
      headings: {
        platform: "Jukwaa",
        support: "Msaada",
        accountLegal: "Akaunti & Sheria",
      },
      platformLinks: {
        search: "Tafuta vyuo",
        blog: "Blogu",
        visaCalculator: "Kikokotoo cha viza",
        feedback: "Maoni",
      },
      supportLinks: {
        help: "Kituo cha msaada",
        contact: "Wasiliana nasi",
        faq: "Maswali",
        dashboard: "Dashibodi",
      },
      accountLinks: {
        login: "Ingia",
        signup: "Anza",
        privacy: "Sera ya faragha",
        terms: "Sheria na masharti",
      },
      copyright: "© {{year}} GEG — Global Education Gateway. Haki zote zimehifadhiwa.",
      questions: "Maswali?",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "Inapakia...",
      retry: "Jaribu tena",
    },
    emptyState: {
      noRecentPages: "Hakuna kurasa za karibuni",
      goToFallback: "Nenda kwenye ukurasa mbadala",
      clearHistory: "Futa historia",
      currentPage: "Ukurasa wa sasa",
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "Ukurasa haukupakizwa",
      failedToLoadPageDescription:
        "Ukurasa haukweza kupakizwa. Hii inaweza kutokana na tatizo la mtandao au ukurasa kutopatikana kwa muda.",
      chunkReloadMessage:
        "Tumefanya upya programu ili kupata faili za hivi karibuni. Ikiendelea, tafadhali futa akiba ya kivinjari kisha ujaribu tena.",
    },
    loading: "Inapakia programu...",
    errorBoundary: {
      networkTitle: "Hitilafu ya muunganisho",
      networkMessage: "Muunganisho wa mtandao umeharibika. Hakikisha intaneti yako kisha ujaribu tena.",
      chunkTitle: "Hitilafu ya upakiaji",
      chunkMessage: "Rasilimali za programu hazikuweza kupakizwa. Hii hutokea mara nyingi baada ya masasisho ya programu.",
      permissionTitle: "Ruhusa imekataliwa",
      permissionMessage: "Huna ruhusa ya kufikia rasilimali hii.",
      notFoundTitle: "Haijapatikana",
      notFoundMessage: "Rasilimali uliyotaka haikupatikana.",
      unauthorizedTitle: "Muda wa kikao umeisha",
      unauthorizedMessage: "Kikao chako kimeisha. Tafadhali ingia tena.",
      databaseTitle: "Hitilafu ya hifadhidata",
      databaseMessage: "Muunganisho wa hifadhidata umeharibika. Jaribu tena baada ya muda mfupi.",
      genericTitle: "Kuna tatizo",
      genericMessage: "Hitilafu isiyotarajiwa imetokea. Tafadhali jaribu tena.",
      fallbackTitle: "Hitilafu",
      fallbackMessage: "Hitilafu isiyotarajiwa imetokea",
      technicalDetails: "Maelezo ya kiufundi",
      tryAgain: "Jaribu tena",
      tryAgainCount: "Jaribu tena (zimesalia {count})",
      goHome: "Rudi mwanzo",
      maxRetriesReached: "Idadi ya juu ya majaribio imefikiwa. Pakia upya ukurasa au wasiliana na msaada.",
    },
  },
  pages: {
    contact: {
      heroTitle: "Wasiliana nasi",
      heroSubtitle: "Kwa kawaida tunajibu ndani ya siku moja ya kazi.",
      emailPrompt: "Unapendelea barua pepe?",
      email: "info@globaleducationgateway.com",
      imageAlt: "Mshauri wa elimu aliye tayari kusaidia",
      formTitle: "Tutumie ujumbe",
    },
    faq: {
      heroTitle: "Maswali yanayoulizwa mara kwa mara",
      heroSubtitle: "Majibu ya haraka kwa maswali ya kawaida kuhusu safari yako ya elimu",
      imageAlt: "Mwanafunzi anayejifunza na kufanya utafiti",
      sections: [
        {
          audience: "Wanafunzi",
          items: [
            {
              question: "GEG inanisaidiaje kuomba vyuo vikuu?",
              answer:
                "GEG hukunganisha na mawakala waliothibitishwa wanaokuongoza katika kila hatua – kutoka kuchagua vyuo vikuu hadi kuwasilisha nyaraka.",
            },
            {
              question: "Je, kuna ada ya kutumia jukwaa?",
              answer:
                "Kutengeneza akaunti na kuchunguza vyuo ni bure. Mawakala wanaweza kutoza ada za ushauri, ambazo huonyeshwa wazi kabla ya kuendelea.",
            },
            {
              question: "Nahitaji nyaraka gani kuomba?",
              answer:
                "Kwa kawaida unahitaji vyeti vya masomo, matokeo ya lugha ya Kiingereza (IELTS/TOEFL), barua za mapendekezo, barua ya motisha na nakala ya pasipoti.",
            },
            {
              question: "Je, ninaweza kuomba vyuo zaidi ya kimoja?",
              answer:
                "Ndiyo! Unaweza kuomba vyuo vingi kwa wakati mmoja na kufuatilia maombi yote ndani ya dashibodi moja.",
            },
            {
              question: "Nitajua vipi maendeleo ya maombi yangu?",
              answer:
                "Dashibodi yako binafsi inaonyesha masasisho ya muda halisi, tarehe muhimu na hatua zinazofuata ili ujue hatua inayofuata kila wakati.",
            },
          ],
        },
        {
          audience: "Vyuo vikuu",
          items: [
            {
              question: "Chuo chetu kinawezaje kushirikiana na GEG?",
              answer:
                "Tuma ombi la ushirikiano kupitia Portal ya Chuo Kikuu au wasiliana na timu yetu. Tutathibitisha taasisi yako na kuanza mchakato ndani ya siku chache za kazi.",
            },
            {
              question: "Vyuo hupata taarifa gani?",
              answer:
                "Vyuo hupata dashibodi zinazoonyesha mirija ya waombaji, viwango vya ubadilishaji na maslahi ya kieneo ili kupanga kampeni za uandikishaji kwa ujasiri.",
            },
            {
              question: "Je, tunaweza kusimamia ofa moja kwa moja kwenye jukwaa?",
              answer:
                "Ndiyo. Timu za udahili zinaweza kutoa ofa za masharti au za mwisho, kuomba nyaraka zinazokosekana na kuwasiliana na wanafunzi na mawakala katika eneo moja la kazi.",
            },
          ],
        },
        {
          audience: "Mawakala",
          items: [
            {
              question: "Mawakala wanapata msaada gani kupitia GEG?",
              answer:
                "Mawakala hupata CRM maalum, vifaa vya masoko na mafunzo ya mara kwa mara ili kuwasaidia wanafunzi kupata programu zinazofaa haraka.",
            },
            {
              question: "Kamisheni za mawakala hushughulikiwaje?",
              answer:
                "Miundo ya kamisheni ni wazi. Vyuo huweka masharti na malipo hufuatiliwa kwenye dashibodi ya wakala kwa ufuatiliaji rahisi.",
            },
            {
              question: "Je, mawakala wanaweza kushirikiana na timu za udahili za vyuo?",
              answer:
                "Kabisa. Maeneo ya kazi ya pamoja na mazungumzo huhakikisha kila upande unajua maendeleo ya mwanafunzi, nyaraka zinazokosekana na kupanga mahojiano.",
            },
          ],
        },
      ],
    },
  },
};

export default sw;
