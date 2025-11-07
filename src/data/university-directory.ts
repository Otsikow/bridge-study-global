export type UniversityRegion =
  | "Africa"
  | "Asia"
  | "Europe"
  | "Middle East"
  | "North America"
  | "Oceania"
  | "South America";

export interface UniversityDirectoryItem {
  id: string;
  name: string;
  city: string;
  country: string;
  region: UniversityRegion;
  institutionType: string;
  founded: number;
  ranking: number;
  acceptanceRate: number;
  programCount: number;
  description: string;
  focusAreas: string[];
  notablePrograms: string[];
  badges: string[];
  website: string;
  averageTuitionInternational: number;
  tuitionDisplay: string;
  studentBody: {
    total: number;
    internationalPercentage: number;
  };
  researchHighlights: string[];
  employabilityRank?: number;
}

export const UNIVERSITY_DIRECTORY_DATA: UniversityDirectoryItem[] = [
  {
    id: "mit",
    name: "Massachusetts Institute of Technology",
    city: "Cambridge",
    country: "United States",
    region: "North America",
    institutionType: "Private research university",
    founded: 1861,
    ranking: 1,
    acceptanceRate: 7,
    programCount: 450,
    description:
      "MIT pioneers research-driven education, blending cutting-edge science and engineering with entrepreneurship and innovation at global scale.",
    focusAreas: [
      "Engineering",
      "Computer Science",
      "Data & AI",
      "Business",
      "Aerospace",
    ],
    notablePrograms: [
      "Electrical Engineering and Computer Science",
      "Aerospace Engineering",
      "Sloan MBA",
    ],
    badges: ["Ivy Plus", "Top 10 Global"],
    website: "https://www.mit.edu",
    averageTuitionInternational: 57200,
    tuitionDisplay: "$57k per year (international)",
    studentBody: {
      total: 11858,
      internationalPercentage: 33,
    },
    researchHighlights: [
      "Media Lab innovations in human-computer interaction",
      "Lincoln Laboratory partnerships with NASA and the U.S. Air Force",
    ],
    employabilityRank: 1,
  },
  {
    id: "cambridge",
    name: "University of Cambridge",
    city: "Cambridge",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public collegiate research university",
    founded: 1209,
    ranking: 2,
    acceptanceRate: 18,
    programCount: 360,
    description:
      "A globally renowned collegiate university combining centuries-old academic tradition with world-leading research across disciplines.",
    focusAreas: ["Natural Sciences", "Engineering", "Medicine", "Humanities", "Law"],
    notablePrograms: ["Natural Sciences Tripos", "Engineering", "Judge MBA"],
    badges: ["Russell Group", "Collegiate"],
    website: "https://www.cam.ac.uk",
    averageTuitionInternational: 43800,
    tuitionDisplay: "£35k–£45k per year (international)",
    studentBody: {
      total: 21000,
      internationalPercentage: 39,
    },
    researchHighlights: [
      "Cavendish Laboratory Nobel Prize lineage",
      "Cambridge Biomedical Campus partnerships with AstraZeneca",
    ],
    employabilityRank: 2,
  },
  {
    id: "oxford",
    name: "University of Oxford",
    city: "Oxford",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public collegiate research university",
    founded: 1096,
    ranking: 3,
    acceptanceRate: 17,
    programCount: 350,
    description:
      "Oxford blends historic collegiate life with global research leadership, offering rigorous academic pathways and personalized tutorials.",
    focusAreas: ["Humanities", "Medicine", "Social Sciences", "Engineering", "Law"],
    notablePrograms: ["Philosophy, Politics and Economics", "Medicine", "Mathematics"],
    badges: ["Russell Group", "Collegiate"],
    website: "https://www.ox.ac.uk",
    averageTuitionInternational: 51000,
    tuitionDisplay: "£39k–£48k per year (international)",
    studentBody: {
      total: 25000,
      internationalPercentage: 41,
    },
    researchHighlights: [
      "Oxford Martin School tackling global grand challenges",
      "Oxford Vaccine Group breakthroughs in immunology",
    ],
    employabilityRank: 3,
  },
  {
    id: "harvard",
    name: "Harvard University",
    city: "Cambridge",
    country: "United States",
    region: "North America",
    institutionType: "Private Ivy League research university",
    founded: 1636,
    ranking: 4,
    acceptanceRate: 4,
    programCount: 410,
    description:
      "Harvard delivers a transformative liberal arts foundation, graduate excellence, and unmatched research depth across every major discipline.",
    focusAreas: ["Business", "Law", "Medicine", "Public Policy", "Sciences"],
    notablePrograms: ["Harvard Business School MBA", "Harvard Law JD", "Harvard Kennedy MPP"],
    badges: ["Ivy League", "Top 10 Global"],
    website: "https://www.harvard.edu",
    averageTuitionInternational: 54800,
    tuitionDisplay: "$54k per year (tuition only)",
    studentBody: {
      total: 23800,
      internationalPercentage: 23,
    },
    researchHighlights: [
      "Harvard Medical School leading clinical partnerships",
      "Artificial intelligence collaboratives with MIT and industry",
    ],
    employabilityRank: 4,
  },
  {
    id: "stanford",
    name: "Stanford University",
    city: "Stanford",
    country: "United States",
    region: "North America",
    institutionType: "Private research university",
    founded: 1885,
    ranking: 5,
    acceptanceRate: 5,
    programCount: 390,
    description:
      "Stanford fosters a powerhouse innovation ecosystem, bridging academics with Silicon Valley entrepreneurship and interdisciplinary research.",
    focusAreas: ["Engineering", "Computer Science", "Business", "Sustainability", "Medicine"],
    notablePrograms: ["Computer Science", "Graduate School of Business MBA", "Bioengineering"],
    badges: ["Top 10 Global", "Entrepreneurial"],
    website: "https://www.stanford.edu",
    averageTuitionInternational: 57400,
    tuitionDisplay: "$57k per year (tuition only)",
    studentBody: {
      total: 17150,
      internationalPercentage: 24,
    },
    researchHighlights: [
      "Stanford Doerr School of Sustainability launch",
      "SLAC National Accelerator collaborations",
    ],
    employabilityRank: 5,
  },
  {
    id: "imperial",
    name: "Imperial College London",
    city: "London",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1907,
    ranking: 6,
    acceptanceRate: 14,
    programCount: 320,
    description:
      "Imperial specializes in STEM excellence, integrating engineering, science, medicine, and business to advance real-world impact.",
    focusAreas: ["Engineering", "Medicine", "Data & AI", "Business", "Natural Sciences"],
    notablePrograms: ["Computing", "Chemical Engineering", "Imperial MBA"],
    badges: ["Russell Group", "STEM Focus"],
    website: "https://www.imperial.ac.uk",
    averageTuitionInternational: 45400,
    tuitionDisplay: "£35k–£42k per year (international)",
    studentBody: {
      total: 22700,
      internationalPercentage: 60,
    },
    researchHighlights: [
      "Imperial AI Network and data-centric engineering",
      "White City Innovation District partnerships",
    ],
    employabilityRank: 6,
  },
  {
    id: "eth-zurich",
    name: "ETH Zurich",
    city: "Zurich",
    country: "Switzerland",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1855,
    ranking: 7,
    acceptanceRate: 27,
    programCount: 280,
    description:
      "ETH Zurich stands at the forefront of European engineering and natural sciences, driving sustainable innovation and industry collaboration.",
    focusAreas: ["Engineering", "Computer Science", "Natural Sciences", "Architecture", "Sustainability"],
    notablePrograms: ["Mechanical Engineering", "Computer Science", "Architecture"],
    badges: ["Top 10 Global", "ETH Domain"],
    website: "https://ethz.ch",
    averageTuitionInternational: 1900,
    tuitionDisplay: "CHF 1.9k per year (all students)",
    studentBody: {
      total: 24300,
      internationalPercentage: 40,
    },
    researchHighlights: [
      "ETH AI Center and robotics leadership",
      "Climate science breakthroughs with Swiss Polar Institute",
    ],
    employabilityRank: 7,
  },
  {
    id: "mit",
    name: "Massachusetts Institute of Technology",
    city: "Cambridge",
    country: "United States",
    region: "North America",
    institutionType: "Private research university",
    founded: 1861,
    ranking: 1,
    acceptanceRate: 7,
    programCount: 200,
    description:
      "MIT drives breakthroughs at the intersection of science, engineering, and entrepreneurship, powering innovation ecosystems worldwide.",
    focusAreas: ["Engineering", "Computer Science", "Artificial Intelligence", "Business", "Climate Science"],
    notablePrograms: ["Electrical Engineering and Computer Science", "Sloan MBA", "Aeronautics and Astronautics"],
    badges: ["Top Global", "Entrepreneurial"],
    website: "https://www.mit.edu",
    averageTuitionInternational: 59750,
    tuitionDisplay: "$59k per year (international)",
    studentBody: {
      total: 11700,
      internationalPercentage: 29,
    },
    researchHighlights: [
      "MIT Schwarzman College of Computing advancing responsible AI",
      "Media Lab and CSAIL collaborations with global industry leaders",
    ],
    employabilityRank: 1,
  },
  {
    id: "ucl",
    name: "University College London",
    city: "London",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1826,
    ranking: 9,
    acceptanceRate: 16,
    programCount: 430,
    description:
      "UCL champions disruptive thinking, interdisciplinary teaching, and inclusive excellence across more than 400 undergraduate and graduate programs.",
    focusAreas: ["Social Sciences", "Architecture", "Engineering", "Arts", "Health Sciences"],
    notablePrograms: ["Architecture (Bartlett)", "Psychology", "Engineering Science"],
    badges: ["Russell Group", "London Global"],
    website: "https://www.ucl.ac.uk",
    averageTuitionInternational: 41000,
    tuitionDisplay: "£32k–£40k per year (international)",
    studentBody: {
      total: 43500,
      internationalPercentage: 51,
    },
    researchHighlights: [
      "UCL Institute of Education world-leading pedagogy",
      "UCL Innovation & Enterprise applied research hubs",
    ],
    employabilityRank: 8,
  },
  {
    id: "berkeley",
    name: "University of California, Berkeley",
    city: "Berkeley",
    country: "United States",
    region: "North America",
    institutionType: "Public research university",
    founded: 1868,
    ranking: 10,
    acceptanceRate: 14,
    programCount: 350,
    description:
      "UC Berkeley pairs public mission with elite research, powering breakthroughs in technology, sustainability, and social impact.",
    focusAreas: ["Engineering", "Computer Science", "Environmental Science", "Business", "Social Sciences"],
    notablePrograms: ["Computer Science", "Haas MBA", "Environmental Engineering"],
    badges: ["UC System", "Public Ivy"],
    website: "https://www.berkeley.edu",
    averageTuitionInternational: 48500,
    tuitionDisplay: "$48k per year (non-resident)",
    studentBody: {
      total: 45100,
      internationalPercentage: 22,
    },
    researchHighlights: [
      "Lawrence Berkeley National Laboratory collaborations",
      "SkyDeck accelerator and venture ecosystem",
    ],
    employabilityRank: 10,
  },
  {
    id: "toronto",
    name: "University of Toronto",
    city: "Toronto",
    country: "Canada",
    region: "North America",
    institutionType: "Public research university",
    founded: 1827,
    ranking: 11,
    acceptanceRate: 44,
    programCount: 700,
    description:
      "Canada's leading university with tri-campus diversity, research depth, and globally connected programs across every field of study.",
    focusAreas: ["Medicine", "AI & Data", "Engineering", "Humanities", "Business"],
    notablePrograms: ["Rotman Commerce", "Engineering Science", "Artificial Intelligence"],
    badges: ["U15 Canada", "Global Network"],
    website: "https://www.utoronto.ca",
    averageTuitionInternational: 47500,
    tuitionDisplay: "CA$60k per year (international)",
    studentBody: {
      total: 97000,
      internationalPercentage: 27,
    },
    researchHighlights: [
      "Vector Institute for AI partnerships",
      "Toronto Academic Health Science Network",
    ],
    employabilityRank: 12,
  },
  {
    id: "melbourne",
    name: "University of Melbourne",
    city: "Melbourne",
    country: "Australia",
    region: "Oceania",
    institutionType: "Public research university",
    founded: 1853,
    ranking: 12,
    acceptanceRate: 41,
    programCount: 340,
    description:
      "Australia's top-ranked university, integrating research, industry engagement, and global study pathways within a vibrant city campus.",
    focusAreas: ["Health Sciences", "Business", "Engineering", "Arts", "Sustainability"],
    notablePrograms: ["Melbourne JD", "Biomedicine", "Engineering"],
    badges: ["Group of Eight", "Asia-Pacific"],
    website: "https://www.unimelb.edu.au",
    averageTuitionInternational: 39000,
    tuitionDisplay: "A$39k–A$46k per year (international)",
    studentBody: {
      total: 54000,
      internationalPercentage: 44,
    },
    researchHighlights: [
      "Melbourne Connect innovation precinct",
      "Peter Doherty Institute medical research",
    ],
    employabilityRank: 13,
  },
  {
    id: "edinburgh",
    name: "University of Edinburgh",
    city: "Edinburgh",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1583,
    ranking: 13,
    acceptanceRate: 36,
    programCount: 300,
    description:
      "A historic Scottish university delivering research-intensive education with strengths in data science, medicine, and the arts.",
    focusAreas: ["Data & AI", "Medicine", "Humanities", "Engineering", "Social Sciences"],
    notablePrograms: ["Informatics", "Biomedical Sciences", "International Relations"],
    badges: ["Russell Group", "Historic"],
    website: "https://www.ed.ac.uk",
    averageTuitionInternational: 38000,
    tuitionDisplay: "£28k–£38k per year (international)",
    studentBody: {
      total: 42000,
      internationalPercentage: 43,
    },
    researchHighlights: [
      "Alan Turing Institute founding partner",
      "Edinburgh Futures Institute interdisciplinary labs",
    ],
    employabilityRank: 20,
  },
  {
    id: "tokyo",
    name: "University of Tokyo",
    city: "Tokyo",
    country: "Japan",
    region: "Asia",
    institutionType: "Public research university",
    founded: 1877,
    ranking: 14,
    acceptanceRate: 34,
    programCount: 310,
    description:
      "Japan's premier university, advancing science, technology, and policy with strong government and industry collaborations.",
    focusAreas: ["Engineering", "Natural Sciences", "Public Policy", "Medicine", "Humanities"],
    notablePrograms: ["Engineering", "International Public Policy", "Medicine"],
    badges: ["Top Asian University", "Public Flagship"],
    website: "https://www.u-tokyo.ac.jp",
    averageTuitionInternational: 5200,
    tuitionDisplay: "¥535k per year (all students)",
    studentBody: {
      total: 28253,
      internationalPercentage: 21,
    },
    researchHighlights: [
      "Kavli Institute for the Physics and Mathematics of the Universe",
      "Industry partnerships through UTokyo Innovation Platform",
    ],
    employabilityRank: 14,
  },
];

export const UNIVERSITY_FOCUS_AREAS = Array.from(
  new Set(
    UNIVERSITY_DIRECTORY_DATA.flatMap((university) => university.focusAreas)
  )
).sort();

export const UNIVERSITY_REGIONS = Array.from(
  new Set(UNIVERSITY_DIRECTORY_DATA.map((university) => university.region))
).sort();

export const UNIVERSITY_COUNTRIES = Array.from(
  new Set(UNIVERSITY_DIRECTORY_DATA.map((university) => university.country))
).sort();

export const UNIVERSITY_TYPES = Array.from(
  new Set(UNIVERSITY_DIRECTORY_DATA.map((university) => university.institutionType))
).sort();
