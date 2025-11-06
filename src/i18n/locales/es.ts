const es = {
  common: {
    languageNames: {
      en: "Inglés",
      de: "Alemán",
      fr: "Francés",
      pt: "Portugués",
      sw: "Suajili",
      es: "Español",
      zh: "Chino",
      hi: "Hindi",
      ar: "Árabe",
    },
    labels: {
      language: "Idioma",
      selectLanguage: "Seleccionar idioma",
      toggleNavigation: "Alternar navegación",
      openUserMenu: "Abrir menú de usuario",
      currentPage: "Página actual",
      showRecentPages: "Mostrar páginas recientes",
    },
    actions: {
      login: "Iniciar sesión",
      signup: "Registrarse",
      logout: "Cerrar sesión",
      goToLogin: "Ir al inicio de sesión",
      goBack: "Volver",
      reloadPage: "Recargar página",
      retry: "Reintentar",
      save: "Guardar",
      clear: "Limpiar",
      cancel: "Cancelar",
      submit: "Enviar",
      markAllRead: "Marcar todo como leído",
    },
    navigation: {
      home: "Inicio",
      search: "Buscar",
      courses: "Cursos",
      blog: "Blog",
      contact: "Contacto",
      dashboard: "Panel",
      settings: "Configuración",
      helpCenter: "Centro de ayuda",
      faq: "FAQ",
      feedback: "Comentarios",
      visaCalculator: "Calculadora de visa",
      privacy: "Política de privacidad",
      terms: "Términos de servicio",
    },
    status: {
      loading: "Cargando...",
      loadingInterface: "Cargando interfaz...",
    },
    notifications: {
      success: "Éxito",
      error: "Error",
      saved: "Guardado",
      deleted: "Eliminado",
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
        home: "Inicio",
        search: "Buscar",
        courses: "Cursos",
        blog: "Blog",
        contact: "Contacto",
      },
      auth: {
        login: "Iniciar sesión",
        signup: "Registrarse",
        logout: "Cerrar sesión",
      },
      userMenu: {
        open: "Abrir menú de usuario",
        dashboard: "Panel",
        settings: "Configuración",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "Conectamos a estudiantes internacionales con universidades de clase mundial mediante agentes verificados y una gestión transparente de solicitudes.",
      contactEmailLabel: "Escríbenos",
      headings: {
        platform: "Plataforma",
        support: "Soporte",
        accountLegal: "Cuenta y legal",
      },
      platformLinks: {
        search: "Buscar universidades",
        blog: "Blog",
        visaCalculator: "Calculadora de visa",
        feedback: "Comentarios",
      },
      supportLinks: {
        help: "Centro de ayuda",
        contact: "Contáctanos",
        faq: "FAQ",
        dashboard: "Panel",
      },
      accountLinks: {
        login: "Iniciar sesión",
        signup: "Comenzar",
        privacy: "Política de privacidad",
        terms: "Términos de servicio",
      },
      copyright: "© {{year}} GEG — Global Education Gateway. Todos los derechos reservados.",
      questions: "¿Preguntas?",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "Cargando...",
      retry: "Reintentar",
    },
    emptyState: {
      noRecentPages: "No hay páginas recientes",
      goToFallback: "Ir a la alternativa",
      clearHistory: "Borrar historial",
      currentPage: "Página actual",
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "No se pudo cargar la página",
      failedToLoadPageDescription:
        "La página no se pudo cargar. Puede deberse a un problema de red o a que la página esté temporalmente no disponible.",
      chunkReloadMessage:
        "Actualizamos la aplicación para obtener los archivos más recientes. Si sigue ocurriendo, borra el caché del navegador e inténtalo de nuevo.",
    },
    loading: "Cargando aplicación...",
    errorBoundary: {
      networkTitle: "Error de conexión",
      networkMessage: "La conexión de red falló. Verifica tu internet e inténtalo nuevamente.",
      chunkTitle: "Error de carga",
      chunkMessage: "No se pudieron cargar los recursos de la aplicación. Esto suele ocurrir tras una actualización.",
      permissionTitle: "Acceso denegado",
      permissionMessage: "No tienes permiso para acceder a este recurso.",
      notFoundTitle: "No encontrado",
      notFoundMessage: "El recurso solicitado no se encontró.",
      unauthorizedTitle: "Sesión expirada",
      unauthorizedMessage: "Tu sesión ha expirado. Inicia sesión nuevamente.",
      databaseTitle: "Error de base de datos",
      databaseMessage: "La conexión a la base de datos falló. Inténtalo de nuevo en unos momentos.",
      genericTitle: "Algo salió mal",
      genericMessage: "Ocurrió un error inesperado. Inténtalo nuevamente.",
      fallbackTitle: "Error",
      fallbackMessage: "Ocurrió un error inesperado",
      technicalDetails: "Detalles técnicos",
      tryAgain: "Reintentar",
      tryAgainCount: "Reintentar (quedan {count})",
      goHome: "Volver al inicio",
      maxRetriesReached: "Se alcanzó el número máximo de intentos. Actualiza la página o contacta al soporte.",
    },
  },
  pages: {
    contact: {
      heroTitle: "Contáctanos",
      heroSubtitle: "Normalmente respondemos en un día hábil.",
      emailPrompt: "¿Prefieres correo electrónico?",
      email: "info@globaleducationgateway.com",
      imageAlt: "Asesor educativo profesional listo para ayudar",
      formTitle: "Envíanos un mensaje",
    },
    faq: {
      heroTitle: "Preguntas frecuentes",
      heroSubtitle: "Respuestas rápidas a las preguntas más comunes sobre tu camino educativo",
      imageAlt: "Estudiante aprendiendo e investigando",
      sections: [
        {
          audience: "Estudiantes",
          items: [
            {
              question: "¿Cómo me ayuda GEG a postularme a universidades?",
              answer:
                "GEG te conecta con agentes verificados que te guían en cada etapa: desde seleccionar universidades hasta enviar los documentos.",
            },
            {
              question: "¿Tiene costo usar la plataforma?",
              answer:
                "Crear una cuenta y explorar universidades es gratuito. Los agentes pueden cobrar honorarios de consultoría, claramente indicados antes de comprometerte.",
            },
            {
              question: "¿Qué documentos necesito para postularme?",
              answer:
                "Generalmente se requieren certificados académicos, resultados de exámenes de inglés (IELTS/TOEFL), cartas de recomendación, una carta de motivación y copia del pasaporte.",
            },
            {
              question: "¿Puedo postularme a varias universidades?",
              answer:
                "¡Sí! Puedes postularte a varias universidades a la vez y seguir todas las solicitudes desde un solo panel.",
            },
            {
              question: "¿Cómo me mantengo informado sobre el estado de mi solicitud?",
              answer:
                "Tu panel personalizado muestra actualizaciones en tiempo real, plazos y próximos pasos para que siempre sepas qué hacer luego.",
            },
          ],
        },
        {
          audience: "Universidades",
          items: [
            {
              question: "¿Cómo puede nuestra universidad asociarse con GEG?",
              answer:
                "Envía una solicitud de asociación a través del Portal Universitario o contacta a nuestro equipo. Verificaremos tu institución y completaremos la incorporación en pocos días hábiles.",
            },
            {
              question: "¿Qué información reciben las universidades?",
              answer:
                "Las universidades acceden a paneles con embudos de solicitantes, métricas de conversión e interés por región para planificar campañas de reclutamiento con confianza.",
            },
            {
              question: "¿Podemos gestionar ofertas directamente en la plataforma?",
              answer:
                "Sí. Los equipos de admisión pueden emitir ofertas condicionales o finales, solicitar documentos faltantes y comunicarse con estudiantes y agentes desde un solo espacio de trabajo.",
            },
          ],
        },
        {
          audience: "Agentes",
          items: [
            {
              question: "¿Qué apoyo reciben los agentes en GEG?",
              answer:
                "Los agentes obtienen un CRM dedicado, material de marketing y capacitación bajo demanda para ayudar a los estudiantes a encontrar programas adecuados rápidamente.",
            },
            {
              question: "¿Cómo se gestionan las comisiones de los agentes?",
              answer:
                "Las estructuras de comisión son transparentes. Las universidades definen los términos y los pagos se registran en el panel del agente para facilitar la conciliación.",
            },
            {
              question: "¿Los agentes pueden colaborar con los equipos de admisión universitarios?",
              answer:
                "Por supuesto. Los espacios de trabajo compartidos y los hilos de mensajes mantienen a todas las partes alineadas sobre el progreso del estudiante, los documentos faltantes y la programación de entrevistas.",
            },
          ],
        },
      ],
    },
  },
};

export default es;
