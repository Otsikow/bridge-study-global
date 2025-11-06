const fr = {
  common: {
    languageNames: {
      en: "Anglais",
      de: "Allemand",
      fr: "Français",
      pt: "Portugais",
      sw: "Swahili",
      es: "Espagnol",
      zh: "Chinois",
      hi: "Hindi",
      ar: "Arabe",
    },
    labels: {
      language: "Langue",
      selectLanguage: "Choisir la langue",
      toggleNavigation: "Basculer la navigation",
      openUserMenu: "Ouvrir le menu utilisateur",
      currentPage: "Page actuelle",
      showRecentPages: "Afficher les pages récentes",
    },
    actions: {
      login: "Se connecter",
      signup: "S'inscrire",
      logout: "Se déconnecter",
      goToLogin: "Aller à la connexion",
      goBack: "Retour",
      reloadPage: "Recharger la page",
      retry: "Réessayer",
      save: "Enregistrer",
      clear: "Effacer",
      cancel: "Annuler",
      submit: "Soumettre",
      markAllRead: "Marquer tout comme lu",
    },
    navigation: {
      home: "Accueil",
      search: "Recherche",
      courses: "Formations",
      blog: "Blog",
      contact: "Contact",
      dashboard: "Tableau de bord",
      settings: "Paramètres",
      helpCenter: "Centre d'aide",
      faq: "FAQ",
      feedback: "Retour",
      visaCalculator: "Calculateur de visa",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
    },
    status: {
      loading: "Chargement...",
      loadingInterface: "Chargement de l'interface...",
    },
    notifications: {
      success: "Succès",
      error: "Erreur",
      saved: "Enregistré",
      deleted: "Supprimé",
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
        home: "Accueil",
        search: "Recherche",
        courses: "Formations",
        blog: "Blog",
        contact: "Contact",
      },
      auth: {
        login: "Se connecter",
        signup: "S'inscrire",
        logout: "Se déconnecter",
      },
      userMenu: {
        open: "Ouvrir le menu utilisateur",
        dashboard: "Tableau de bord",
        settings: "Paramètres",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "Nous connectons les étudiants internationaux aux universités de renommée mondiale grâce à des agents vérifiés et une gestion transparente des candidatures.",
      contactEmailLabel: "Nous écrire",
      headings: {
        platform: "Plateforme",
        support: "Support",
        accountLegal: "Compte & Légal",
      },
      platformLinks: {
        search: "Rechercher des universités",
        blog: "Blog",
        visaCalculator: "Calculateur de visa",
        feedback: "Retour",
      },
      supportLinks: {
        help: "Centre d'aide",
        contact: "Contactez-nous",
        faq: "FAQ",
        dashboard: "Tableau de bord",
      },
      accountLinks: {
        login: "Se connecter",
        signup: "Commencer",
        privacy: "Politique de confidentialité",
        terms: "Conditions d'utilisation",
      },
      copyright: "© {{year}} GEG — Global Education Gateway. Tous droits réservés.",
      questions: "Des questions ?",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "Chargement...",
      retry: "Réessayer",
    },
    emptyState: {
      noRecentPages: "Aucune page récente",
      goToFallback: "Aller vers la page alternative",
      clearHistory: "Effacer l'historique",
      currentPage: "Page actuelle",
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "Impossible de charger la page",
      failedToLoadPageDescription:
        "La page n'a pas pu être chargée. Cela peut être dû à un problème de réseau ou à une indisponibilité temporaire.",
      chunkReloadMessage:
        "Nous avons actualisé l'application pour récupérer les derniers fichiers. Si cela persiste, veuillez vider le cache de votre navigateur et réessayer.",
    },
    loading: "Chargement de l'application...",
    errorBoundary: {
      networkTitle: "Erreur de connexion",
      networkMessage: "La connexion réseau a échoué. Veuillez vérifier votre connexion Internet et réessayer.",
      chunkTitle: "Erreur de chargement",
      chunkMessage: "Impossible de charger les ressources de l'application. Cela se produit généralement après une mise à jour.",
      permissionTitle: "Accès refusé",
      permissionMessage: "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
      notFoundTitle: "Introuvable",
      notFoundMessage: "La ressource demandée est introuvable.",
      unauthorizedTitle: "Session expirée",
      unauthorizedMessage: "Votre session a expiré. Veuillez vous reconnecter.",
      databaseTitle: "Erreur de base de données",
      databaseMessage: "La connexion à la base de données a échoué. Veuillez réessayer dans un instant.",
      genericTitle: "Une erreur est survenue",
      genericMessage: "Une erreur inattendue s'est produite. Veuillez réessayer.",
      fallbackTitle: "Erreur",
      fallbackMessage: "Une erreur inattendue s'est produite",
      technicalDetails: "Détails techniques",
      tryAgain: "Réessayer",
      tryAgainCount: "Réessayer (il reste {count})",
      goHome: "Retour à l'accueil",
      maxRetriesReached: "Nombre maximal de tentatives atteint. Veuillez rafraîchir la page ou contacter le support.",
    },
  },
  pages: {
    contact: {
      heroTitle: "Contactez-nous",
      heroSubtitle: "Nous répondons généralement sous un jour ouvrable.",
      emailPrompt: "Vous préférez l'e-mail ?",
      email: "info@globaleducationgateway.com",
      imageAlt: "Conseiller en éducation prêt à aider",
      formTitle: "Envoyez-nous un message",
    },
    faq: {
      heroTitle: "Questions fréquentes",
      heroSubtitle: "Des réponses rapides aux questions les plus courantes sur votre parcours éducatif",
      imageAlt: "Étudiant en train d'étudier et de faire des recherches",
      sections: [
        {
          audience: "Étudiants",
          items: [
            {
              question: "Comment GEG m'aide-t-il à postuler dans les universités ?",
              answer:
                "GEG vous met en relation avec des agents vérifiés qui vous accompagnent à chaque étape – de la sélection des universités à la soumission des documents.",
            },
            {
              question: "L'utilisation de la plateforme est-elle payante ?",
              answer:
                "Créer un compte et explorer les universités est gratuit. Les agents peuvent facturer des honoraires de conseil, clairement indiqués avant tout engagement.",
            },
            {
              question: "Quels documents dois-je fournir pour postuler ?",
              answer:
                "Vous aurez généralement besoin de relevés de notes, de résultats de tests d'anglais (IELTS/TOEFL), de lettres de recommandation, d'une lettre de motivation et d'une copie de votre passeport.",
            },
            {
              question: "Puis-je postuler à plusieurs universités ?",
              answer:
                "Oui ! Vous pouvez postuler à plusieurs universités en même temps et suivre toutes vos candidatures depuis un seul tableau de bord.",
            },
            {
              question: "Comment rester informé de l'avancement de ma candidature ?",
              answer:
                "Votre tableau de bord personnalisé affiche des mises à jour en temps réel, des échéances et les prochaines étapes afin que vous sachiez toujours quoi faire ensuite.",
            },
          ],
        },
        {
          audience: "Universités",
          items: [
            {
              question: "Comment notre université peut-elle devenir partenaire de GEG ?",
              answer:
                "Soumettez une demande de partenariat via le portail universitaire ou contactez notre équipe. Nous vérifions votre établissement et organisons l'onboarding en quelques jours ouvrés.",
            },
            {
              question: "Quelles informations les universités reçoivent-elles ?",
              answer:
                "Les universités accèdent à des tableaux de bord présentant les pipelines de candidats, les taux de conversion et l'intérêt par région pour planifier leurs campagnes de recrutement.",
            },
            {
              question: "Pouvons-nous gérer les offres directement sur la plateforme ?",
              answer:
                "Oui. Les équipes d'admission peuvent émettre des offres conditionnelles ou définitives, demander des documents manquants et communiquer avec les étudiants et agents depuis un espace partagé.",
            },
          ],
        },
        {
          audience: "Agents",
          items: [
            {
              question: "Quel soutien les agents reçoivent-ils sur GEG ?",
              answer:
                "Les agents disposent d'un CRM dédié, de supports marketing et de formations à la demande pour aider les étudiants à trouver rapidement les bons programmes.",
            },
            {
              question: "Comment sont gérées les commissions des agents ?",
              answer:
                "Les structures de commissions sont transparentes. Les universités définissent les conditions et les paiements sont suivis dans le tableau de bord agent pour un rapprochement facile.",
            },
            {
              question: "Les agents peuvent-ils collaborer avec les équipes d'admission des universités ?",
              answer:
                "Absolument. Des espaces de travail partagés et des conversations dédiées maintiennent toutes les parties informées des progrès, des documents manquants et de la planification des entretiens.",
            },
          ],
        },
      ],
    },
  },
};

export default fr;
