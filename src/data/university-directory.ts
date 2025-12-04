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
    id: "oxford",
    name: "University of Oxford",
    city: "Oxford",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1096,
    ranking: 1,
    acceptanceRate: 17,
    programCount: 350,
    description:
      "World's oldest English-speaking university renowned for tutorial system, groundbreaking research, and prestigious global reputation.",
    focusAreas: [
      "Humanities",
      "Sciences",
      "Medicine",
      "Social Sciences",
      "Engineering",
    ],
    notablePrograms: [
      "Philosophy, Politics and Economics (PPE)",
      "Medicine",
      "Law",
    ],
    badges: ["Russell Group", "Oxbridge"],
    website: "https://www.ox.ac.uk",
    averageTuitionInternational: 35000,
    tuitionDisplay: "£26k–£39k per year",
    studentBody: {
      total: 24000,
      internationalPercentage: 43,
    },
    researchHighlights: [
      "COVID-19 vaccine development with AstraZeneca",
      "Leader in artificial intelligence and machine learning research",
    ],
    employabilityRank: 1,
  },
  {
    id: "cambridge",
    name: "University of Cambridge",
    city: "Cambridge",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1209,
    ranking: 2,
    acceptanceRate: 21,
    programCount: 330,
    description:
      "Historic collegiate university with exceptional research output, Nobel Prize winners, and world-class STEM programs.",
    focusAreas: [
      "Mathematics",
      "Engineering",
      "Natural Sciences",
      "Medicine",
      "Computer Science",
    ],
    notablePrograms: [
      "Natural Sciences Tripos",
      "Engineering",
      "Computer Science",
    ],
    badges: ["Russell Group", "Oxbridge"],
    website: "https://www.cam.ac.uk",
    averageTuitionInternational: 35000,
    tuitionDisplay: "£24k–£63k per year",
    studentBody: {
      total: 24000,
      internationalPercentage: 39,
    },
    researchHighlights: [
      "World-leading quantum computing research",
      "Pioneering work in genetics and molecular biology",
    ],
    employabilityRank: 2,
  },
  {
    id: "mit",
    name: "Massachusetts Institute of Technology",
    city: "Cambridge",
    country: "United States",
    region: "North America",
    institutionType: "Private research university",
    founded: 1861,
    ranking: 3,
    acceptanceRate: 4,
    programCount: 250,
    description:
      "World-leading technology institute pioneering innovation in engineering, AI, robotics, and entrepreneurship.",
    focusAreas: [
      "Engineering",
      "Computer Science",
      "Physics",
      "Mathematics",
      "Economics",
    ],
    notablePrograms: [
      "Computer Science and Engineering",
      "Electrical Engineering",
      "Business Analytics",
    ],
    badges: ["Ivy Plus", "Tech Innovation"],
    website: "https://www.mit.edu",
    averageTuitionInternational: 57000,
    tuitionDisplay: "$57k per year",
    studentBody: {
      total: 11500,
      internationalPercentage: 34,
    },
    researchHighlights: [
      "Leading AI and robotics research labs",
      "Nuclear fusion energy breakthrough achievements",
    ],
    employabilityRank: 3,
  },
  {
    id: "harvard",
    name: "Harvard University",
    city: "Cambridge",
    country: "United States",
    region: "North America",
    institutionType: "Private research university",
    founded: 1636,
    ranking: 4,
    acceptanceRate: 3,
    programCount: 400,
    description:
      "America's oldest and most prestigious university with unparalleled resources, faculty, and global alumni network.",
    focusAreas: [
      "Business",
      "Law",
      "Medicine",
      "Government",
      "Computer Science",
    ],
    notablePrograms: [
      "MBA",
      "Law",
      "Medicine",
    ],
    badges: ["Ivy League", "World's Top Endowment"],
    website: "https://www.harvard.edu",
    averageTuitionInternational: 54000,
    tuitionDisplay: "$54k per year",
    studentBody: {
      total: 23000,
      internationalPercentage: 25,
    },
    researchHighlights: [
      "Wyss Institute for biologically inspired engineering",
      "Harvard Business School innovation ecosystem",
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
    acceptanceRate: 4,
    programCount: 300,
    description:
      "Silicon Valley's academic heart driving tech innovation, entrepreneurship, and interdisciplinary research excellence.",
    focusAreas: [
      "Computer Science",
      "Engineering",
      "Business",
      "Medicine",
      "AI & Machine Learning",
    ],
    notablePrograms: [
      "Computer Science",
      "MBA",
      "Artificial Intelligence",
    ],
    badges: ["Tech Hub", "Startup Culture"],
    website: "https://www.stanford.edu",
    averageTuitionInternational: 58000,
    tuitionDisplay: "$58k per year",
    studentBody: {
      total: 17000,
      internationalPercentage: 23,
    },
    researchHighlights: [
      "Stanford AI Lab pioneering machine learning",
      "Leading biotech and medical device innovation",
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
    programCount: 200,
    description:
      "UK's leading STEM university specializing in science, engineering, medicine, and business with strong industry connections.",
    focusAreas: [
      "Engineering",
      "Medicine",
      "Business",
      "Natural Sciences",
      "Data Science",
    ],
    notablePrograms: [
      "Biomedical Engineering",
      "Computing",
      "Imperial MBA",
    ],
    badges: ["Russell Group", "STEM Excellence"],
    website: "https://www.imperial.ac.uk",
    averageTuitionInternational: 38000,
    tuitionDisplay: "£33k–£40k per year",
    studentBody: {
      total: 20000,
      internationalPercentage: 60,
    },
    researchHighlights: [
      "World-class medical research and NHS partnerships",
      "Leading quantum computing and AI research",
    ],
    employabilityRank: 6,
  },
  {
    id: "toronto",
    name: "University of Toronto",
    city: "Toronto",
    country: "Canada",
    region: "North America",
    institutionType: "Public research university",
    founded: 1827,
    ranking: 7,
    acceptanceRate: 43,
    programCount: 700,
    description:
      "Canada's top-ranked university with world-leading research, diverse programs, and strong connections to Toronto's tech scene.",
    focusAreas: [
      "Computer Science",
      "Engineering",
      "Business",
      "Medicine",
      "AI & Machine Learning",
    ],
    notablePrograms: [
      "Computer Science",
      "Rotman Commerce",
      "Engineering Science",
    ],
    badges: ["U15", "AI Research"],
    website: "https://www.utoronto.ca",
    averageTuitionInternational: 45000,
    tuitionDisplay: "CAD $45k–$60k per year",
    studentBody: {
      total: 95000,
      internationalPercentage: 24,
    },
    researchHighlights: [
      "Birthplace of deep learning and neural networks",
      "Vector Institute for AI research leadership",
    ],
    employabilityRank: 7,
  },
  {
    id: "melbourne",
    name: "University of Melbourne",
    city: "Melbourne",
    country: "Australia",
    region: "Oceania",
    institutionType: "Public research university",
    founded: 1853,
    ranking: 8,
    acceptanceRate: 70,
    programCount: 400,
    description:
      "Australia's leading university offering world-class education, cutting-edge research, and strong Asia-Pacific connections.",
    focusAreas: [
      "Medicine",
      "Law",
      "Business",
      "Engineering",
      "Arts",
    ],
    notablePrograms: [
      "Melbourne JD",
      "Medicine",
      "Master of Management",
    ],
    badges: ["Group of Eight", "Melbourne Model"],
    website: "https://www.unimelb.edu.au",
    averageTuitionInternational: 45000,
    tuitionDisplay: "AUD $35k–$50k per year",
    studentBody: {
      total: 51000,
      internationalPercentage: 47,
    },
    researchHighlights: [
      "Leading cancer and medical research institute",
      "Climate change and sustainability research excellence",
    ],
    employabilityRank: 8,
  },
  {
    id: "yale",
    name: "Yale University",
    city: "New Haven",
    country: "United States",
    region: "North America",
    institutionType: "Private research university",
    founded: 1701,
    ranking: 9,
    acceptanceRate: 5,
    programCount: 350,
    description:
      "Prestigious Ivy League university with exceptional liberal arts education, world-class professional schools, and rich traditions.",
    focusAreas: [
      "Law",
      "Medicine",
      "Drama",
      "History",
      "Political Science",
    ],
    notablePrograms: [
      "Yale Law School",
      "Drama",
      "History",
    ],
    badges: ["Ivy League", "Residential Colleges"],
    website: "https://www.yale.edu",
    averageTuitionInternational: 62000,
    tuitionDisplay: "$62k per year",
    studentBody: {
      total: 14500,
      internationalPercentage: 21,
    },
    researchHighlights: [
      "Yale School of Medicine pioneering immunology",
      "World-renowned art galleries and museums",
    ],
    employabilityRank: 9,
  },
  {
    id: "princeton",
    name: "Princeton University",
    city: "Princeton",
    country: "United States",
    region: "North America",
    institutionType: "Private research university",
    founded: 1746,
    ranking: 10,
    acceptanceRate: 6,
    programCount: 280,
    description:
      "Elite Ivy League institution focused on undergraduate excellence, groundbreaking research, and close faculty-student collaboration.",
    focusAreas: [
      "Mathematics",
      "Physics",
      "Economics",
      "Engineering",
      "Public Policy",
    ],
    notablePrograms: [
      "Mathematics",
      "Physics",
      "Woodrow Wilson School",
    ],
    badges: ["Ivy League", "Undergraduate Focus"],
    website: "https://www.princeton.edu",
    averageTuitionInternational: 57000,
    tuitionDisplay: "$57k per year",
    studentBody: {
      total: 8500,
      internationalPercentage: 12,
    },
    researchHighlights: [
      "Princeton Plasma Physics Laboratory fusion research",
      "Institute for Advanced Study theoretical research",
    ],
    employabilityRank: 10,
  },
  {
    id: "ucl",
    name: "University College London",
    city: "London",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1826,
    ranking: 11,
    acceptanceRate: 48,
    programCount: 440,
    description:
      "London's global university with world-leading research, diverse international community, and innovative interdisciplinary programs.",
    focusAreas: [
      "Architecture",
      "Law",
      "Medicine",
      "Engineering",
      "Economics",
    ],
    notablePrograms: [
      "The Bartlett Architecture",
      "Law",
      "Medicine",
    ],
    badges: ["Russell Group", "London University"],
    website: "https://www.ucl.ac.uk",
    averageTuitionInternational: 32000,
    tuitionDisplay: "£24k–£38k per year",
    studentBody: {
      total: 43000,
      internationalPercentage: 55,
    },
    researchHighlights: [
      "UCL AI Centre leading machine learning research",
      "Pioneering neuroscience and brain research",
    ],
    employabilityRank: 11,
  },
  {
    id: "edinburgh",
    name: "University of Edinburgh",
    city: "Edinburgh",
    country: "United Kingdom",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1583,
    ranking: 12,
    acceptanceRate: 40,
    programCount: 500,
    description:
      "Scotland's premier university with rich history, outstanding research, and vibrant international student community.",
    focusAreas: [
      "Informatics",
      "Medicine",
      "Business",
      "Law",
      "Engineering",
    ],
    notablePrograms: [
      "Artificial Intelligence",
      "Medicine",
      "Law",
    ],
    badges: ["Russell Group", "Ancient University"],
    website: "https://www.ed.ac.uk",
    averageTuitionInternational: 28000,
    tuitionDisplay: "£25k–£34k per year",
    studentBody: {
      total: 36000,
      internationalPercentage: 44,
    },
    researchHighlights: [
      "Birthplace of Dolly the sheep cloning breakthrough",
      "Leading AI and robotics research center",
    ],
    employabilityRank: 12,
  },
  {
    id: "ubc",
    name: "University of British Columbia",
    city: "Vancouver",
    country: "Canada",
    region: "North America",
    institutionType: "Public research university",
    founded: 1908,
    ranking: 13,
    acceptanceRate: 52,
    programCount: 600,
    description:
      "Canada's Pacific coast research powerhouse with stunning campus, strong sustainability focus, and Asia-Pacific connections.",
    focusAreas: [
      "Sustainability",
      "Engineering",
      "Business",
      "Forestry",
      "Medicine",
    ],
    notablePrograms: [
      "Sauder School of Business",
      "Engineering",
      "Forestry",
    ],
    badges: ["U15", "Sustainability Leader"],
    website: "https://www.ubc.ca",
    averageTuitionInternational: 42000,
    tuitionDisplay: "CAD $40k–$55k per year",
    studentBody: {
      total: 68000,
      internationalPercentage: 31,
    },
    researchHighlights: [
      "TRIUMF particle physics and nuclear research",
      "World-leading sustainable forestry research",
    ],
    employabilityRank: 13,
  },
  {
    id: "anu",
    name: "Australian National University",
    city: "Canberra",
    country: "Australia",
    region: "Oceania",
    institutionType: "Public research university",
    founded: 1946,
    ranking: 14,
    acceptanceRate: 35,
    programCount: 380,
    description:
      "Australia's national research university with exceptional focus on policy, international relations, and scientific research excellence.",
    focusAreas: [
      "International Relations",
      "Public Policy",
      "Sciences",
      "Engineering",
      "Law",
    ],
    notablePrograms: [
      "International Relations",
      "Public Policy",
      "Astrophysics",
    ],
    badges: ["Group of Eight", "National University"],
    website: "https://www.anu.edu.au",
    averageTuitionInternational: 45000,
    tuitionDisplay: "AUD $38k–$49k per year",
    studentBody: {
      total: 25000,
      internationalPercentage: 44,
    },
    researchHighlights: [
      "Mount Stromlo Observatory astrophysics research",
      "Leading Asia-Pacific policy and diplomacy research",
    ],
    employabilityRank: 14,
  },
  {
    id: "tum",
    name: "Technical University of Munich",
    city: "Munich",
    country: "Germany",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1868,
    ranking: 15,
    acceptanceRate: 32,
    programCount: 178,
    description:
      "Germany's top technical university offering tuition-free degrees with strong industry ties and excellence in STEM fields.",
    focusAreas: [
      "Engineering",
      "Computer Science",
      "Life Sciences",
      "Management",
      "Sustainability",
    ],
    notablePrograms: [
      "Informatics",
      "Mechanical Engineering",
      "Sustainable Resource Management",
    ],
    badges: ["Tuition-Free", "Excellence Initiative"],
    website: "https://www.tum.de",
    averageTuitionInternational: 350,
    tuitionDisplay: "€144 per semester",
    studentBody: {
      total: 50000,
      internationalPercentage: 38,
    },
    researchHighlights: [
      "Munich Quantum Valley quantum computing research",
      "Leading automotive and mobility innovation",
    ],
    employabilityRank: 15,
  },
  {
    id: "sydney",
    name: "University of Sydney",
    city: "Sydney",
    country: "Australia",
    region: "Oceania",
    institutionType: "Public research university",
    founded: 1850,
    ranking: 16,
    acceptanceRate: 30,
    programCount: 450,
    description:
      "Australia's first university combining historic prestige with modern innovation, located in the heart of Sydney.",
    focusAreas: [
      "Business",
      "Medicine",
      "Law",
      "Engineering",
      "Architecture",
    ],
    notablePrograms: [
      "Sydney Business School",
      "Medicine",
      "Architecture",
    ],
    badges: ["Group of Eight", "Sandstone University"],
    website: "https://www.sydney.edu.au",
    averageTuitionInternational: 48000,
    tuitionDisplay: "AUD $42k–$55k per year",
    studentBody: {
      total: 73000,
      internationalPercentage: 42,
    },
    researchHighlights: [
      "Charles Perkins Centre health and obesity research",
      "Nanoscience Hub pioneering materials science",
    ],
    employabilityRank: 16,
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
