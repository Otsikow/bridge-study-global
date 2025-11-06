const ar = {
  common: {
    languageNames: {
      en: "الإنجليزية",
      de: "الألمانية",
      fr: "الفرنسية",
      pt: "البرتغالية",
      sw: "السواحيلية",
      es: "الإسبانية",
      zh: "الصينية",
      hi: "الهندية",
      ar: "العربية",
    },
    labels: {
      language: "اللغة",
      selectLanguage: "اختر اللغة",
      toggleNavigation: "تبديل التنقل",
      openUserMenu: "فتح قائمة المستخدم",
      currentPage: "الصفحة الحالية",
      showRecentPages: "عرض الصفحات الحديثة",
    },
    actions: {
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      logout: "تسجيل الخروج",
      goToLogin: "الذهاب لصفحة الدخول",
      goBack: "رجوع",
      reloadPage: "إعادة تحميل الصفحة",
      retry: "إعادة المحاولة",
      save: "حفظ",
      clear: "مسح",
      cancel: "إلغاء",
      submit: "إرسال",
      markAllRead: "تعيين الكل كمقروء",
    },
    navigation: {
      home: "الرئيسية",
      search: "بحث",
      courses: "الدورات",
      blog: "المدونة",
      contact: "اتصل بنا",
      dashboard: "لوحة التحكم",
      settings: "الإعدادات",
      helpCenter: "مركز المساعدة",
      faq: "الأسئلة الشائعة",
      feedback: "ملاحظات",
      visaCalculator: "حاسبة التأشيرة",
      privacy: "سياسة الخصوصية",
      terms: "شروط الخدمة",
    },
    status: {
      loading: "جاري التحميل...",
      loadingInterface: "جاري تحميل الواجهة...",
    },
    notifications: {
      success: "نجاح",
      error: "خطأ",
      saved: "تم الحفظ",
      deleted: "تم الحذف",
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
        home: "الرئيسية",
        search: "بحث",
        courses: "الدورات",
        blog: "المدونة",
        contact: "اتصل بنا",
      },
      auth: {
        login: "تسجيل الدخول",
        signup: "إنشاء حساب",
        logout: "تسجيل الخروج",
      },
      userMenu: {
        open: "فتح قائمة المستخدم",
        dashboard: "لوحة التحكم",
        settings: "الإعدادات",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "نربط الطلاب الدوليين بجامعات عالمية المستوى من خلال وكلاء موثوقين وإدارة شفافة للطلبات.",
      contactEmailLabel: "راسلنا عبر البريد",
      headings: {
        platform: "المنصة",
        support: "الدعم",
        accountLegal: "الحساب والشؤون القانونية",
      },
      platformLinks: {
        search: "ابحث عن الجامعات",
        blog: "المدونة",
        visaCalculator: "حاسبة التأشيرة",
        feedback: "ملاحظات",
      },
      supportLinks: {
        help: "مركز المساعدة",
        contact: "اتصل بنا",
        faq: "الأسئلة الشائعة",
        dashboard: "لوحة التحكم",
      },
      accountLinks: {
        login: "تسجيل الدخول",
        signup: "ابدأ الآن",
        privacy: "سياسة الخصوصية",
        terms: "شروط الخدمة",
      },
      copyright: "© {{year}} GEG — Global Education Gateway. جميع الحقوق محفوظة.",
      questions: "هل لديك أسئلة؟",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "جاري التحميل...",
      retry: "إعادة المحاولة",
    },
    emptyState: {
      noRecentPages: "لا توجد صفحات حديثة",
      goToFallback: "اذهب إلى الصفحة البديلة",
      clearHistory: "مسح السجل",
      currentPage: "الصفحة الحالية",
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "تعذر تحميل الصفحة",
      failedToLoadPageDescription:
        "تعذر تحميل الصفحة. قد يكون ذلك بسبب مشكلة في الشبكة أو أن الصفحة غير متاحة مؤقتًا.",
      chunkReloadMessage:
        "قمنا بتحديث التطبيق للحصول على أحدث الملفات. إذا استمرت المشكلة، يرجى مسح ذاكرة التخزين المؤقت للمتصفح والمحاولة مرة أخرى.",
    },
    loading: "جاري تحميل التطبيق...",
    errorBoundary: {
      networkTitle: "خطأ في الاتصال",
      networkMessage: "فشل اتصال الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.",
      chunkTitle: "خطأ في التحميل",
      chunkMessage: "تعذر تحميل موارد التطبيق. يحدث ذلك عادة بعد تحديث التطبيق.",
      permissionTitle: "تم رفض الوصول",
      permissionMessage: "ليس لديك صلاحية للوصول إلى هذا المورد.",
      notFoundTitle: "غير موجود",
      notFoundMessage: "المورد المطلوب غير موجود.",
      unauthorizedTitle: "انتهت الجلسة",
      unauthorizedMessage: "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
      databaseTitle: "خطأ في قاعدة البيانات",
      databaseMessage: "فشل اتصال قاعدة البيانات. يرجى المحاولة مجددًا بعد لحظات.",
      genericTitle: "حدث خطأ",
      genericMessage: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      fallbackTitle: "خطأ",
      fallbackMessage: "حدث خطأ غير متوقع",
      technicalDetails: "تفاصيل تقنية",
      tryAgain: "إعادة المحاولة",
      tryAgainCount: "إعادة المحاولة (متبقي {count})",
      goHome: "العودة للرئيسية",
      maxRetriesReached: "تم الوصول إلى الحد الأقصى لعدد المحاولات. يرجى تحديث الصفحة أو التواصل مع الدعم.",
    },
  },
  pages: {
    contact: {
      heroTitle: "تواصل معنا",
      heroSubtitle: "نحن نرد عادة خلال يوم عمل واحد.",
      emailPrompt: "تفضل البريد الإلكتروني؟",
      email: "info@globaleducationgateway.com",
      imageAlt: "مستشار تعليمي محترف جاهز للمساعدة",
      formTitle: "أرسل لنا رسالة",
    },
    faq: {
      heroTitle: "الأسئلة الشائعة",
      heroSubtitle: "إجابات سريعة على أكثر الأسئلة شيوعًا حول رحلتك التعليمية",
      imageAlt: "طالب يدرس ويبحث",
      sections: [
        {
          audience: "الطلاب",
          items: [
            {
              question: "كيف يساعدني GEG في التقديم للجامعات؟",
              answer:
                "يربطك GEG بوكلاء موثوقين يوجهونك في كل مرحلة، من اختيار الجامعات إلى تقديم المستندات.",
            },
            {
              question: "هل هناك رسوم لاستخدام المنصة؟",
              answer:
                "إنشاء حساب واستكشاف الجامعات مجاني. قد يفرض الوكلاء رسوم استشارة يتم عرضها بوضوح قبل الالتزام.",
            },
            {
              question: "ما الوثائق المطلوبة للتقديم؟",
              answer:
                "عادة ما تحتاج إلى كشوف الدرجات، ونتائج اختبارات اللغة الإنجليزية (IELTS/TOEFL)، وخطابات توصية، وبيان شخصي، ونسخة من جواز السفر.",
            },
            {
              question: "هل يمكنني التقديم لعدة جامعات في وقت واحد؟",
              answer:
                "نعم! يمكنك التقديم لعدة جامعات وتتبع جميع الطلبات من خلال لوحة تحكم واحدة.",
            },
            {
              question: "كيف أتابع حالة طلبي؟",
              answer:
                "تعرض لك لوحة التحكم الشخصية التحديثات الفورية والمواعيد النهائية والخطوات التالية لتبقى على اطلاع دائم.",
            },
          ],
        },
        {
          audience: "الجامعات",
          items: [
            {
              question: "كيف يمكن لجامعتنا الشراكة مع GEG؟",
              answer:
                "قدّم طلب شراكة عبر بوابة الجامعة أو تواصل مع فريقنا. سنقوم بالتحقق من مؤسستك وإكمال عملية الانضمام خلال أيام عمل قليلة.",
            },
            {
              question: "ما الرؤى التي تحصل عليها الجامعات؟",
              answer:
                "تحصل الجامعات على لوحات معلومات تعرض قنوات المتقدمين ومقاييس التحويل والاهتمام الإقليمي لتمكينها من التخطيط لحملات التوظيف بثقة.",
            },
            {
              question: "هل يمكننا إدارة العروض مباشرة عبر المنصة؟",
              answer:
                "نعم، يمكن لفرق القبول إصدار عروض مشروطة أو نهائية، وطلب المستندات المفقودة، والتواصل مع الطلاب والوكلاء من مساحة عمل واحدة.",
            },
          ],
        },
        {
          audience: "الوكلاء",
          items: [
            {
              question: "ما الدعم الذي يحصل عليه الوكلاء في GEG؟",
              answer:
                "يحصل الوكلاء على نظام CRM مخصص ومواد تسويقية وتدريب حسب الطلب لمساعدة الطلاب في إيجاد البرامج المناسبة بسرعة.",
            },
            {
              question: "كيف تتم إدارة عمولات الوكلاء؟",
              answer:
                "هياكل العمولات شفافة. تحدد الجامعات الشروط ويتم تتبع المدفوعات في لوحة تحكم الوكيل لسهولة المراجعة.",
            },
            {
              question: "هل يمكن للوكلاء التعاون مع فرق القبول في الجامعات؟",
              answer:
                "بالتأكيد. تحافظ مساحات العمل المشتركة وسلاسل الرسائل على اطلاع الجميع بتقدم الطلاب والمستندات الناقصة وجدولة المقابلات.",
            },
          ],
        },
      ],
    },
  },
};

export default ar;
