const zh = {
  common: {
    languageNames: {
      en: "英语",
      de: "德语",
      fr: "法语",
      pt: "葡萄牙语",
      sw: "斯瓦希里语",
      es: "西班牙语",
      zh: "中文",
      hi: "印地语",
      ar: "阿拉伯语",
    },
    labels: {
      language: "语言",
      selectLanguage: "选择语言",
      toggleNavigation: "切换导航",
      openUserMenu: "打开用户菜单",
      currentPage: "当前页面",
      showRecentPages: "显示最近访问",
    },
    actions: {
      login: "登录",
      signup: "注册",
      logout: "退出登录",
      goToLogin: "前往登录",
      goBack: "返回",
      reloadPage: "重新加载页面",
      retry: "重试",
      save: "保存",
      clear: "清除",
      cancel: "取消",
      submit: "提交",
      markAllRead: "全部标记为已读",
    },
    navigation: {
      home: "首页",
      search: "搜索",
      courses: "课程",
      blog: "博客",
      contact: "联系",
      dashboard: "控制台",
      settings: "设置",
      helpCenter: "帮助中心",
      faq: "常见问题",
      feedback: "反馈",
      visaCalculator: "签证计算器",
      privacy: "隐私政策",
      terms: "服务条款",
    },
    status: {
      loading: "加载中...",
      loadingInterface: "界面加载中...",
    },
    notifications: {
      success: "成功",
      error: "错误",
      saved: "已保存",
      deleted: "已删除",
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
        home: "首页",
        search: "搜索",
        courses: "课程",
        blog: "博客",
        contact: "联系",
      },
      auth: {
        login: "登录",
        signup: "注册",
        logout: "退出登录",
      },
      userMenu: {
        open: "打开用户菜单",
        dashboard: "控制台",
        settings: "设置",
      },
    },
    footer: {
      aboutTitle: "GEG — Global Education Gateway",
      aboutDescription:
        "我们通过认证代理和透明的申请管理，将国际学生与世界一流大学连接起来。",
      contactEmailLabel: "联系我们",
      headings: {
        platform: "平台",
        support: "支持",
        accountLegal: "账户与法律",
      },
      platformLinks: {
        search: "搜索大学",
        blog: "博客",
        visaCalculator: "签证计算器",
        feedback: "反馈",
      },
      supportLinks: {
        help: "帮助中心",
        contact: "联系我们",
        faq: "常见问题",
        dashboard: "控制台",
      },
      accountLinks: {
        login: "登录",
        signup: "立即开始",
        privacy: "隐私政策",
        terms: "服务条款",
      },
      copyright: "© {{year}} GEG — Global Education Gateway. 版权所有。",
      questions: "有问题吗？",
    },
  },
  components: {
    loadingState: {
      defaultMessage: "加载中...",
      retry: "重试",
    },
    emptyState: {
      noRecentPages: "暂无最近访问",
      goToFallback: "前往备用页面",
      clearHistory: "清除历史",
      currentPage: "当前页面",
    },
  },
  app: {
    errors: {
      failedToLoadPageTitle: "无法加载页面",
      failedToLoadPageDescription:
        "页面无法加载。这可能是网络问题或页面暂时不可用。",
      chunkReloadMessage:
        "我们已刷新应用以获取最新文件。如果仍然出现，请清除浏览器缓存后重试。",
    },
    loading: "正在加载应用...",
    errorBoundary: {
      networkTitle: "连接错误",
      networkMessage: "网络连接失败。请检查您的网络后重试。",
      chunkTitle: "加载错误",
      chunkMessage: "无法加载应用资源，通常在应用更新后发生。",
      permissionTitle: "访问被拒绝",
      permissionMessage: "您无权访问此资源。",
      notFoundTitle: "未找到",
      notFoundMessage: "未找到请求的资源。",
      unauthorizedTitle: "会话已过期",
      unauthorizedMessage: "您的会话已过期，请重新登录。",
      databaseTitle: "数据库错误",
      databaseMessage: "数据库连接失败，请稍后再试。",
      genericTitle: "出现问题",
      genericMessage: "发生了意外错误，请重试。",
      fallbackTitle: "错误",
      fallbackMessage: "发生了意外错误",
      technicalDetails: "技术细节",
      tryAgain: "重试",
      tryAgainCount: "重试（剩余 {count} 次）",
      goHome: "返回首页",
      maxRetriesReached: "已达到最大重试次数。请刷新页面或联系支持。",
    },
  },
  pages: {
    contact: {
      heroTitle: "联系我们",
      heroSubtitle: "我们通常会在一个工作日内回复。",
      emailPrompt: "更喜欢电子邮件？",
      email: "info@globaleducationgateway.com",
      imageAlt: "专业教育顾问随时准备提供帮助",
      formTitle: "给我们留言",
    },
    faq: {
      heroTitle: "常见问题",
      heroSubtitle: "快速解答关于您教育旅程的常见问题",
      imageAlt: "正在学习和研究的学生",
      sections: [
        {
          audience: "学生",
          items: [
            {
              question: "GEG 如何帮助我申请大学？",
              answer:
                "GEG 将您与认证代理联系起来，他们会在每个阶段提供指导——从选择大学到提交材料。",
            },
            {
              question: "使用平台需要费用吗？",
              answer:
                "创建账户并浏览大学是免费的。代理可能会收取咨询费用，所有费用都会在承诺前清晰显示。",
            },
            {
              question: "申请需要哪些材料？",
              answer:
                "通常需要提供成绩单、英语考试成绩（IELTS/TOEFL）、推荐信、个人陈述以及护照复印件。",
            },
            {
              question: "可以同时申请多所大学吗？",
              answer:
                "可以！您可以同时申请多所大学，并在同一个控制台中跟踪所有申请。",
            },
            {
              question: "如何了解申请状态？",
              answer:
                "您的个人控制台会实时显示更新、截止日期和下一步，帮助您随时掌握进度。",
            },
          ],
        },
        {
          audience: "大学",
          items: [
            {
              question: "我们的大学如何与 GEG 合作？",
              answer:
                "通过大学门户提交合作申请或联系我们的团队。我们会验证您的院校，并在几个工作日内完成入驻。",
            },
            {
              question: "大学可以获得哪些洞察？",
              answer:
                "大学可以访问展示申请人管道、转化指标和地区兴趣的仪表板，从而自信规划招生活动。",
            },
            {
              question: "我们可以直接在平台上管理录取吗？",
              answer:
                "可以。招生团队可以发出有条件或无条件录取、请求补充材料，并在同一工作区与学生和代理沟通。",
            },
          ],
        },
        {
          audience: "代理",
          items: [
            {
              question: "代理可以获得哪些支持？",
              answer:
                "代理将获得专属 CRM、营销素材和按需培训，帮助学生快速匹配合适的项目。",
            },
            {
              question: "代理佣金如何处理？",
              answer:
                "佣金结构完全透明。大学定义合作条款，付款会在代理控制台中记录，方便对账。",
            },
            {
              question: "代理能否与大学招生团队协作？",
              answer:
                "当然。共享工作区和消息线程确保各方及时了解学生进度、缺失材料以及面试安排。",
            },
          ],
        },
      ],
    },
  },
};

export default zh;
