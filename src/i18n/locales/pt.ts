const pt = {
  common: {
    languageNames: {
      en: "Inglês",
      de: "Alemão",
      fr: "Francês",
      pt: "Português",
      sw: "Suaíli",
      es: "Espanhol",
      zh: "Chinês",
      hi: "Hindi",
      ar: "Árabe",
    },
    labels: {
      language: "Idioma",
      selectLanguage: "Selecionar idioma",
      toggleNavigation: "Alternar navegação",
      openUserMenu: "Abrir menu do usuário",
      currentPage: "Página atual",
      showRecentPages: "Mostrar páginas recentes",
    },
    actions: {
      login: "Entrar",
      signup: "Cadastrar",
      logout: "Sair",
      goToLogin: "Ir para login",
      goBack: "Voltar",
      reloadPage: "Recarregar página",
      retry: "Tentar novamente",
      save: "Salvar",
      clear: "Limpar",
      cancel: "Cancelar",
      submit: "Enviar",
      markAllRead: "Marcar tudo como lido",
    },
    navigation: {
      home: "Início",
      search: "Buscar",
      courses: "Cursos",
      blog: "Blog",
      contact: "Contato",
      dashboard: "Painel",
      settings: "Configurações",
      helpCenter: "Central de ajuda",
      faq: "FAQ",
      feedback: "Feedback",
      visaCalculator: "Calculadora de visto",
      privacy: "Política de privacidade",
      terms: "Termos de uso",
    },
    status: {
      loading: "Carregando...",
      loadingInterface: "Carregando interface...",
    },
    notifications: {
      success: "Sucesso",
      error: "Erro",
      saved: "Salvo",
      deleted: "Excluído",
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
        home: "Início",
        search: "Buscar",
        courses: "Cursos",
        blog: "Blog",
        contact: "Contato",
      },
      auth: {
        login: "Entrar",
        signup: "Cadastrar",
        logout: "Sair",
      },
      userMenu: {
        open: "Abrir menu do usuário",
        dashboard: "Painel",
        settings: "Configurações",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "Conectamos estudantes internacionais a universidades de classe mundial por meio de agentes verificados e uma gestão transparente de candidaturas.",
      contactEmailLabel: "Envie-nos um e-mail",
      headings: {
        platform: "Plataforma",
        support: "Suporte",
        accountLegal: "Conta & Jurídico",
      },
      platformLinks: {
        search: "Buscar universidades",
        blog: "Blog",
        visaCalculator: "Calculadora de visto",
        feedback: "Feedback",
      },
      supportLinks: {
        help: "Central de ajuda",
        contact: "Fale conosco",
        faq: "FAQ",
        dashboard: "Painel",
      },
      accountLinks: {
        login: "Entrar",
        signup: "Começar",
        privacy: "Política de privacidade",
        terms: "Termos de uso",
      },
      copyright: "© {{year}} GEG — Global Education Gateway. Todos os direitos reservados.",
      questions: "Dúvidas?",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "Carregando...",
      retry: "Tentar novamente",
    },
    emptyState: {
      noRecentPages: "Nenhuma página recente",
      goToFallback: "Ir para alternativa",
      clearHistory: "Limpar histórico",
      currentPage: "Página atual",
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "Não foi possível carregar a página",
      failedToLoadPageDescription:
        "A página não pôde ser carregada. Isso pode ocorrer devido a um problema de rede ou porque a página está temporariamente indisponível.",
      chunkReloadMessage:
        "Atualizamos o aplicativo para buscar os arquivos mais recentes. Se isso continuar acontecendo, limpe o cache do navegador e tente novamente.",
    },
    loading: "Carregando aplicação...",
    errorBoundary: {
      networkTitle: "Erro de conexão",
      networkMessage: "A conexão de rede falhou. Verifique sua internet e tente novamente.",
      chunkTitle: "Erro de carregamento",
      chunkMessage: "Não foi possível carregar os recursos do aplicativo. Isso geralmente ocorre após uma atualização.",
      permissionTitle: "Acesso negado",
      permissionMessage: "Você não tem permissão para acessar este recurso.",
      notFoundTitle: "Não encontrado",
      notFoundMessage: "O recurso solicitado não foi encontrado.",
      unauthorizedTitle: "Sessão expirada",
      unauthorizedMessage: "Sua sessão expirou. Faça login novamente.",
      databaseTitle: "Erro de banco de dados",
      databaseMessage: "A conexão com o banco de dados falhou. Tente novamente em instantes.",
      genericTitle: "Algo deu errado",
      genericMessage: "Ocorreu um erro inesperado. Tente novamente.",
      fallbackTitle: "Erro",
      fallbackMessage: "Ocorreu um erro inesperado",
      technicalDetails: "Detalhes técnicos",
      tryAgain: "Tentar novamente",
      tryAgainCount: "Tentar novamente ({count} restantes)",
      goHome: "Voltar ao início",
      maxRetriesReached: "Número máximo de tentativas atingido. Atualize a página ou contate o suporte.",
    },
  },
  pages: {
    contact: {
      heroTitle: "Fale conosco",
      heroSubtitle: "Normalmente respondemos em até um dia útil.",
      emailPrompt: "Prefere e-mail?",
      email: "info@globaleducationgateway.com",
      imageAlt: "Consultor educacional profissional pronto para ajudar",
      formTitle: "Envie-nos uma mensagem",
    },
    faq: {
      heroTitle: "Perguntas frequentes",
      heroSubtitle: "Respostas rápidas para as dúvidas mais comuns sobre sua jornada educacional",
      imageAlt: "Estudante aprendendo e pesquisando",
      sections: [
        {
          audience: "Estudantes",
          items: [
            {
              question: "Como o GEG me ajuda a me candidatar às universidades?",
              answer:
                "O GEG conecta você a agentes verificados que orientam cada etapa – da escolha das universidades ao envio dos documentos.",
            },
            {
              question: "Usar a plataforma tem custo?",
              answer:
                "Criar uma conta e explorar universidades é gratuito. Agentes podem cobrar taxas de consultoria, exibidas claramente antes de qualquer compromisso.",
            },
            {
              question: "Quais documentos preciso para me candidatar?",
              answer:
                "Normalmente são exigidos históricos acadêmicos, testes de inglês (IELTS/TOEFL), cartas de recomendação, carta de motivação e cópia do passaporte.",
            },
            {
              question: "Posso me candidatar a várias universidades?",
              answer:
                "Sim! Você pode se candidatar a várias universidades ao mesmo tempo e acompanhar todas as candidaturas em um único painel.",
            },
            {
              question: "Como me mantenho informado sobre o status da minha candidatura?",
              answer:
                "Seu painel personalizado mostra atualizações em tempo real, prazos e próximos passos para que você sempre saiba o que fazer.",
            },
          ],
        },
        {
          audience: "Universidades",
          items: [
            {
              question: "Como nossa universidade pode se tornar parceira do GEG?",
              answer:
                "Envie um pedido de parceria pelo Portal Universitário ou entre em contato com nossa equipe. Verificamos sua instituição e concluímos a integração em poucos dias úteis.",
            },
            {
              question: "Quais insights as universidades recebem?",
              answer:
                "As universidades acessam painéis com funis de candidatos, métricas de conversão e interesse regional para planejar campanhas de recrutamento com segurança.",
            },
            {
              question: "Podemos gerenciar ofertas diretamente na plataforma?",
              answer:
                "Sim. As equipes de admissão podem emitir ofertas condicionais ou finais, solicitar documentos faltantes e se comunicar com estudantes e agentes em um único espaço.",
            },
          ],
        },
        {
          audience: "Agentes",
          items: [
            {
              question: "Que suporte os agentes recebem no GEG?",
              answer:
                "Os agentes recebem um CRM dedicado, materiais de marketing e treinamentos sob demanda para aproximar estudantes dos programas ideais rapidamente.",
            },
            {
              question: "Como as comissões dos agentes são tratadas?",
              answer:
                "As estruturas de comissão são transparentes. As universidades definem os termos e os pagamentos são acompanhados no painel do agente para fácil conciliação.",
            },
            {
              question: "Os agentes podem colaborar com as equipes de admissão das universidades?",
              answer:
                "Com certeza. Espaços de trabalho compartilhados e conversas mantêm todas as partes alinhadas sobre o progresso dos estudantes, documentos pendentes e agendamento de entrevistas.",
            },
          ],
        },
      ],
    },
  },
};

export default pt;
