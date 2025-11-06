const en = {
  common: {
    languageNames: {
      en: "English",
      de: "German",
      fr: "French",
      pt: "Portuguese",
      sw: "Swahili",
      es: "Spanish",
      zh: "Chinese",
      hi: "Hindi",
      ar: "Arabic",
    },
    labels: {
      language: "Language",
      selectLanguage: "Select language",
      toggleNavigation: "Toggle navigation",
      openUserMenu: "Open user menu",
      currentPage: "Current page",
      showRecentPages: "Show recent pages",
    },
    actions: {
      login: "Log in",
      signup: "Sign up",
      logout: "Log out",
      goToLogin: "Go to login",
      goBack: "Go back",
      reloadPage: "Reload page",
      retry: "Retry",
      save: "Save",
      clear: "Clear",
      cancel: "Cancel",
      submit: "Submit",
      markAllRead: "Mark all read",
    },
    navigation: {
      home: "Home",
      search: "Search",
      courses: "Courses",
      blog: "Blog",
      contact: "Contact",
      dashboard: "Dashboard",
      settings: "Settings",
      helpCenter: "Help Center",
      faq: "FAQ",
      feedback: "Feedback",
      visaCalculator: "Visa Calculator",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
    status: {
      loading: "Loading...",
      loadingInterface: "Loading interface...",
    },
    notifications: {
      success: "Success",
      error: "Error",
      saved: "Saved",
      deleted: "Deleted",
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
        home: "Home",
        search: "Search",
        courses: "Courses",
        blog: "Blog",
        contact: "Contact",
      },
      auth: {
        login: "Log in",
        signup: "Sign up",
        logout: "Log out",
      },
      userMenu: {
        open: "Open user menu",
        dashboard: "Dashboard",
        settings: "Settings",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "Connecting international students with world-class universities through verified agents and transparent application management.",
      contactEmailLabel: "Email us",
      headings: {
        platform: "Platform",
        support: "Support",
        accountLegal: "Account & Legal",
      },
      platformLinks: {
        search: "Search Universities",
        blog: "Blog",
        visaCalculator: "Visa Calculator",
        feedback: "Feedback",
      },
      supportLinks: {
        help: "Help Center",
        contact: "Contact Us",
        faq: "FAQ",
        dashboard: "Dashboard",
      },
      accountLinks: {
        login: "Sign In",
        signup: "Get Started",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
      },
      copyright: "© {{year}} GEG — Global Education Gateway. All rights reserved.",
      questions: "Questions?",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "Loading...",
      retry: "Retry",
    },
    emptyState: {
      noRecentPages: "No recent pages",
      goToFallback: "Go to fallback",
      clearHistory: "Clear history",
      currentPage: "Current page",
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "Failed to Load Page",
      failedToLoadPageDescription:
        "The page could not be loaded. This might be due to a network issue or the page being temporarily unavailable.",
      chunkReloadMessage:
        "We refreshed the app to fetch the latest files. If this keeps happening, please clear your browser cache and try again.",
    },
    loading: "Loading application...",
    errorBoundary: {
      networkTitle: "Connection Error",
      networkMessage: "Network connection failed. Please check your internet connection and try again.",
      chunkTitle: "Loading Error",
      chunkMessage: "Failed to load application resources. This usually happens when the app has been updated.",
      permissionTitle: "Access Denied",
      permissionMessage: "You do not have permission to access this resource.",
      notFoundTitle: "Not Found",
      notFoundMessage: "The requested resource was not found.",
      unauthorizedTitle: "Session Expired",
      unauthorizedMessage: "Your session has expired. Please log in again.",
      databaseTitle: "Database Error",
      databaseMessage: "Database connection failed. Please try again in a moment.",
      genericTitle: "Something went wrong",
      genericMessage: "An unexpected error occurred. Please try again.",
      fallbackTitle: "Error",
      fallbackMessage: "An unexpected error occurred",
      technicalDetails: "Technical Details",
      tryAgain: "Try Again",
      tryAgainCount: "Try Again ({count} left)",
      goHome: "Go Home",
      maxRetriesReached: "Maximum retry attempts reached. Please refresh the page or contact support.",
    },
  },
    pages: {
      index: {
        hero: {
          trustBadge: "Trusted by {{count}}+ students worldwide",
          title: {
            prefix: "Your Gateway to",
            highlight: "Global Education",
            suffix: "",
          },
          description:
            "Connect with top universities, track applications in real-time, and receive expert guidance from verified agents.",
          ctas: {
            students: {
              badge: "Students",
              title: "Launch your global application",
              description:
                "Create a profile, upload documents once, and send polished applications to top universities in minutes.",
              action: "Start Application",
            },
            agents: {
              badge: "Agents",
              title: "Serve students with smart tools",
              description:
                "Access dashboards, collaborate in real time, and track every milestone while growing your agency brand.",
              action: "Join as Agent",
            },
            universities: {
              badge: "Universities",
              title: "Scale partnerships that convert",
              description:
                "Connect with qualified applicants, get market insights, and collaborate with vetted advisors worldwide.",
              action: "Partner with Us",
            },
          },
        },
        features: {
          heading: "Why Choose GEG?",
          cards: {
            applyEasily: {
              title: "Apply Easily",
              description:
                "Streamlined application process with step-by-step guidance. Submit applications to multiple universities effortlessly.",
            },
            trackRealtime: {
              title: "Track in Real-Time",
              description: "Monitor your application status 24/7 with live updates and instant notifications.",
            },
            connectAgents: {
              title: "Connect with Verified Agents",
              description: "Access certified education agents who provide personalized support throughout your journey.",
            },
          },
        },
        visa: {
          badge: "Feature Spotlight",
          title: "Understand your visa eligibility before you apply",
          description:
            "Our Visa Eligibility Calculator analyses your profile instantly so you can focus on the countries and programs that welcome you the most.",
          cta: "Explore the Visa Calculator",
        },
        testimonials: {
          heading: "Success Stories",
          items: [
            {
              name: "Sarah Johnson",
              role: "Master's Student at MIT",
              country: "USA",
              quote:
                "GEG made my dream of studying at MIT a reality. The platform was intuitive, and my agent was incredibly supportive.",
              rating: 5,
            },
            {
              name: "Raj Patel",
              role: "MBA Student at Oxford",
              country: "UK",
              quote:
                "The real-time tracking feature gave me peace of mind. I always knew where my application stood. Highly recommend GEG!",
              rating: 5,
            },
            {
              name: "Maria Garcia",
              role: "Engineering Student at Stanford",
              country: "USA",
              quote:
                "From finding the right program to visa approval, GEG supported me every step of the way. Outstanding service!",
              rating: 5,
            },
          ],
        },
        faq: {
          heading: "Frequently Asked Questions",
          subtitle: "Quick answers to common questions",
          audienceHeading: "For {{audience}}",
          sections: [
            {
              audience: "Students",
              items: [
                {
                  question: "How does GEG help me apply to universities?",
                  answer:
                    "GEG connects you with verified agents who guide you through every stage — from selecting universities to submitting documents.",
                },
                {
                  question: "Is there a fee to use the platform?",
                  answer:
                    "Creating an account and exploring universities is free. Agents may charge consulting fees, clearly shown before commitment.",
                },
                {
                  question: "What documents do I need to apply?",
                  answer:
                    "Academic transcripts, English test scores (IELTS/TOEFL), recommendations, personal statement, and passport copy are typically required.",
                },
              ],
            },
          ],
        },
        contact: {
          heading: "Get in Touch",
          subtitle: "Have questions? We’d love to help.",
        },
      },
      universitySearch: {
        hero: {
          title: "Find Your Perfect University",
          subtitle: "Search through universities, programs, and scholarships worldwide.",
        },
        tabs: {
          search: "Search",
          recommendations: "AI Recommendations",
          sop: "SOP Generator",
          interview: "Interview Practice",
        },
        filters: {
          title: "Search Filters",
          subtitle: "Refine your search below",
          fields: {
            universityName: {
              label: "University Name",
              placeholder: "Search universities...",
            },
            country: {
              label: "Country",
              placeholder: "Select country",
              all: "All Countries",
            },
            programLevel: {
              label: "Program Level",
              placeholder: "Select level",
              all: "All Levels",
            },
            discipline: {
              label: "Discipline",
              placeholder: "Select discipline",
              all: "All Disciplines",
            },
            maxFee: {
              label: "Maximum Fee (USD)",
              placeholder: "Enter max fee",
            },
            scholarshipsOnly: {
              label: "Only show universities with scholarships",
            },
          },
        },
        actions: {
          search: "Search",
        },
        results: {
          loading: "Searching...",
          found_one: "Found {{count}} result",
          found_other: "Found {{count}} results",
          empty: "No universities found. Try adjusting your filters.",
          scholarshipBadge_one: "{{count}} Scholarship",
          scholarshipBadge_other: "{{count}} Scholarships",
          programs: {
            heading_one: "Programs ({{count}})",
            heading_other: "Programs ({{count}})",
            apply: "Apply Now",
            more_one: "+{{count}} more program",
            more_other: "+{{count}} more programs",
          },
          scholarships: {
            heading: "Scholarships",
            amountVaries: "Amount varies",
            more_one: "+{{count}} more scholarship",
            more_other: "+{{count}} more scholarships",
          },
          viewDetails: "View Details",
          visitWebsite: "Visit Website",
        },
      },
    contact: {
      heroTitle: "Contact Us",
      heroSubtitle: "We typically respond within one business day.",
      emailPrompt: "Prefer email?",
      email: "info@globaleducationgateway.com",
      imageAlt: "Professional education consultant ready to help",
      formTitle: "Send us a message",
    },
    faq: {
      heroTitle: "Frequently Asked Questions",
      heroSubtitle: "Quick answers to the most common questions about your education journey",
      imageAlt: "Student learning and researching",
      sections: [
        {
          audience: "Students",
          items: [
            {
              question: "How does GEG help me apply to universities?",
              answer:
                "GEG connects you with verified agents who guide you through every stage — from selecting universities to submitting documents.",
            },
            {
              question: "Is there a fee to use the platform?",
              answer:
                "Creating an account and exploring universities is free. Agents may charge consulting fees, clearly shown before commitment.",
            },
            {
              question: "What documents do I need to apply?",
              answer:
                "Academic transcripts, English test scores (IELTS/TOEFL), recommendations, personal statement, and passport copy are typically required.",
            },
            {
              question: "Can I apply to multiple universities?",
              answer:
                "Yes! You can apply to multiple universities at once and track all applications in one dashboard.",
            },
            {
              question: "How do I stay informed about my application status?",
              answer:
                "Your personalized dashboard shows real-time updates, deadlines, and next steps so you always know what to do next.",
            },
          ],
        },
        {
          audience: "Universities",
          items: [
            {
              question: "How can our university partner with GEG?",
              answer:
                "Submit a partnership request through the University Portal or contact our partnerships team. We'll verify your institution and set up onboarding within a few business days.",
            },
            {
              question: "What insights do universities receive?",
              answer:
                "Universities gain access to dashboards showing applicant pipelines, conversion metrics, and regional interest so you can plan recruitment campaigns with confidence.",
            },
            {
              question: "Can we manage offers directly on the platform?",
              answer:
                "Yes. Admissions teams can issue conditional or unconditional offers, request missing documents, and communicate with students and agents from a single workspace.",
            },
          ],
        },
        {
          audience: "Agents",
          items: [
            {
              question: "What support do agents receive on GEG?",
              answer:
                "Agents receive a dedicated CRM, marketing collateral, and on-demand training to help match students with suitable programs quickly.",
            },
            {
              question: "How are agent commissions handled?",
              answer:
                "Commission structures are transparent. Universities define the terms, and payouts are tracked within the agent dashboard for easy reconciliation.",
            },
            {
              question: "Can agents collaborate with university admissions teams?",
              answer:
                "Absolutely. Shared workspaces and messaging threads keep all parties aligned on student progress, missing documents, and interview scheduling.",
            },
          ],
        },
      ],
    },
  },
};

export default en;
