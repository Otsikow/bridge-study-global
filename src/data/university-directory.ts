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
    id: "uopeople",
    name: "University of the People",
    city: "Pasadena",
    country: "United States",
    region: "North America",
    institutionType: "Accredited online university",
    founded: 2009,
    ranking: 1,
    acceptanceRate: 51,
    programCount: 25,
    description:
      "A tuition-free, fully online university designed to remove financial and geographic barriers for learners everywhere.",
    focusAreas: [
      "Business Administration",
      "Computer Science",
      "Health Science",
      "Education",
    ],
    notablePrograms: [
      "BSc Computer Science",
      "MBA",
      "MS Information Technology",
    ],
    badges: ["Tuition-Free", "Online"],
    website: "https://www.uopeople.edu",
    averageTuitionInternational: 1200,
    tuitionDisplay: "$1.2k per year (assessment fees only)",
    studentBody: {
      total: 14000,
      internationalPercentage: 94,
    },
    researchHighlights: [
      "UN SDG digital inclusion partnerships",
      "Micro-scholarships funded by foundations and African governments",
    ],
    employabilityRank: 45,
  },
  {
    id: "tum",
    name: "Technical University of Munich",
    city: "Munich",
    country: "Germany",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1868,
    ranking: 2,
    acceptanceRate: 32,
    programCount: 178,
    description:
      "Germany's top public STEM university offering tuition-free degrees taught in English with strong industry ties.",
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
    tuitionDisplay: "€144 per semester (student services fee)",
    studentBody: {
      total: 50000,
      internationalPercentage: 38,
    },
    researchHighlights: [
      "Munich Quantum Valley collaborations",
      "Africa Food Security innovation lab with GIZ",
    ],
    employabilityRank: 12,
  },
  {
    id: "tartu",
    name: "University of Tartu",
    city: "Tartu",
    country: "Estonia",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1632,
    ranking: 3,
    acceptanceRate: 45,
    programCount: 120,
    description:
      "Baltic flagship university with English-taught tech, health, and entrepreneurship degrees plus generous scholarships.",
    focusAreas: [
      "Data & AI",
      "Medicine",
      "Entrepreneurship",
      "Humanities",
    ],
    notablePrograms: [
      "Software Engineering MSc",
      "Wellness and Spa Service Design",
      "International Law and Human Rights",
    ],
    badges: ["EU Scholarships", "Digital Society"],
    website: "https://www.ut.ee",
    averageTuitionInternational: 3800,
    tuitionDisplay: "€3.5k–€4k per year (international)",
    studentBody: {
      total: 16000,
      internationalPercentage: 26,
    },
    researchHighlights: [
      "sTARTUp Lab mentoring for African edtech founders",
      "Precision medicine hub for the Baltics",
    ],
    employabilityRank: 35,
  },
  {
    id: "porto",
    name: "University of Porto",
    city: "Porto",
    country: "Portugal",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1911,
    ranking: 4,
    acceptanceRate: 55,
    programCount: 300,
    description:
      "Portugal's most international campus with affordable engineering, business, and health degrees and Portuguese language prep.",
    focusAreas: [
      "Engineering",
      "Business",
      "Architecture",
      "Health Sciences",
      "Marine Science",
    ],
    notablePrograms: ["Civil Engineering", "Economics", "Biomedical Sciences"],
    badges: ["Atlantic Tech", "Portuguese Public"],
    website: "https://www.up.pt",
    averageTuitionInternational: 3200,
    tuitionDisplay: "€3k–€3.5k per year (international)",
    studentBody: {
      total: 35000,
      internationalPercentage: 18,
    },
    researchHighlights: [
      "Atlantic International Research Center on climate",
      "African mobility scholarships via Erasmus+",
    ],
    employabilityRank: 42,
  },
  {
    id: "ljubljana",
    name: "University of Ljubljana",
    city: "Ljubljana",
    country: "Slovenia",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1919,
    ranking: 5,
    acceptanceRate: 60,
    programCount: 300,
    description:
      "Central Europe's green innovation hub with low tuition for English-taught STEM and arts programs.",
    focusAreas: [
      "Engineering",
      "Environmental Science",
      "Arts",
      "Business",
    ],
    notablePrograms: ["Computer and Information Science", "Industrial Design", "Agronomy"],
    badges: ["Green Campus", "Central Europe"],
    website: "https://www.uni-lj.si",
    averageTuitionInternational: 2500,
    tuitionDisplay: "€2k–€3k per year (international)",
    studentBody: {
      total: 40000,
      internationalPercentage: 14,
    },
    researchHighlights: [
      "Circular economy pilots with African municipalities",
      "Jožef Stefan Institute AI labs",
    ],
    employabilityRank: 55,
  },
  {
    id: "belgrade",
    name: "University of Belgrade",
    city: "Belgrade",
    country: "Serbia",
    region: "Europe",
    institutionType: "Public research university",
    founded: 1808,
    ranking: 6,
    acceptanceRate: 65,
    programCount: 320,
    description:
      "One of Eastern Europe's most affordable research universities with strong medicine, IT, and agriculture faculties.",
    focusAreas: [
      "Medicine",
      "Information Technology",
      "Agriculture",
      "Humanities",
    ],
    notablePrograms: ["Medicine", "Software Engineering", "Veterinary Medicine"],
    badges: ["Balkan Public", "Affordable"],
    website: "https://www.bg.ac.rs",
    averageTuitionInternational: 2000,
    tuitionDisplay: "€1.8k–€2.2k per year (international)",
    studentBody: {
      total: 97000,
      internationalPercentage: 7,
    },
    researchHighlights: [
      "Danube region sustainable agriculture projects",
      "Telecommunications innovation center",
    ],
    employabilityRank: 70,
  },
  {
    id: "nairobi",
    name: "University of Nairobi",
    city: "Nairobi",
    country: "Kenya",
    region: "Africa",
    institutionType: "Public flagship university",
    founded: 1956,
    ranking: 7,
    acceptanceRate: 35,
    programCount: 540,
    description:
      "Kenya's premier research university with flexible fee payment plans for regional students and industry attachments.",
    focusAreas: [
      "Engineering",
      "Medicine",
      "Agribusiness",
      "Humanities",
      "Entrepreneurship",
    ],
    notablePrograms: ["Civil Engineering", "Medicine", "Bachelor of Commerce"],
    badges: ["East Africa", "Flagship"],
    website: "https://www.uonbi.ac.ke",
    averageTuitionInternational: 1500,
    tuitionDisplay: "KES 190k–250k per year",
    studentBody: {
      total: 49000,
      internationalPercentage: 9,
    },
    researchHighlights: [
      "FabLab Nairobi hardware incubator",
      "USAID-backed climate-smart agriculture trials",
    ],
    employabilityRank: 60,
  },
  {
    id: "makerere",
    name: "Makerere University",
    city: "Kampala",
    country: "Uganda",
    region: "Africa",
    institutionType: "Public research university",
    founded: 1922,
    ranking: 8,
    acceptanceRate: 55,
    programCount: 350,
    description:
      "East Africa's innovation powerhouse with affordable tuition and strong entrepreneurship support for pan-African students.",
    focusAreas: [
      "Public Health",
      "Agriculture",
      "ICT",
      "Education",
    ],
    notablePrograms: ["Public Health", "Agribusiness Management", "Software Engineering"],
    badges: ["East Africa", "Innovation Hub"],
    website: "https://www.mak.ac.ug",
    averageTuitionInternational: 1600,
    tuitionDisplay: "UGX 6M–7.5M per year",
    studentBody: {
      total: 35000,
      internationalPercentage: 10,
    },
    researchHighlights: [
      "ResilientAfrica Network entrepreneurship grants",
      "Makerere AI Lab for public health",
    ],
    employabilityRank: 65,
  },
  {
    id: "ukzn",
    name: "University of KwaZulu-Natal",
    city: "Durban",
    country: "South Africa",
    region: "Africa",
    institutionType: "Public research university",
    founded: 2004,
    ranking: 9,
    acceptanceRate: 30,
    programCount: 320,
    description:
      "South African university with sliding-scale tuition, STEM co-ops, and robust support for continental students.",
    focusAreas: [
      "Engineering",
      "Health Sciences",
      "Law",
      "Humanities",
    ],
    notablePrograms: ["Electrical Engineering", "Medicine", "Development Studies"],
    badges: ["South Africa", "Cooperative Education"],
    website: "https://ukzn.ac.za",
    averageTuitionInternational: 2400,
    tuitionDisplay: "ZAR 40k–55k per year",
    studentBody: {
      total: 46000,
      internationalPercentage: 15,
    },
    researchHighlights: [
      "Square Kilometre Array radio astronomy node",
      "Afretec digital skills partnership",
    ],
    employabilityRank: 58,
  },
  {
    id: "ibadan",
    name: "University of Ibadan",
    city: "Ibadan",
    country: "Nigeria",
    region: "Africa",
    institutionType: "Public research university",
    founded: 1948,
    ranking: 10,
    acceptanceRate: 20,
    programCount: 250,
    description:
      "Nigeria's oldest university with subsidized tuition, strong humanities, and expanding STEM incubation programs.",
    focusAreas: [
      "Humanities",
      "Agriculture",
      "Medicine",
      "Computer Science",
    ],
    notablePrograms: ["Medicine", "Communication and Language Arts", "Computer Science"],
    badges: ["Nigeria", "Subsidized"],
    website: "https://www.ui.edu.ng",
    averageTuitionInternational: 400,
    tuitionDisplay: "₦150k–₦250k per year",
    studentBody: {
      total: 35000,
      internationalPercentage: 5,
    },
    researchHighlights: [
      "Ibadan School of Government and Public Policy",
      "UI Incubation Hub for agritech startups",
    ],
    employabilityRank: 72,
  },
  {
    id: "capecoast",
    name: "University of Cape Coast",
    city: "Cape Coast",
    country: "Ghana",
    region: "Africa",
    institutionType: "Public university",
    founded: 1962,
    ranking: 11,
    acceptanceRate: 58,
    programCount: 200,
    description:
      "Coastal Ghanaian university known for teacher education, blue economy research, and affordable distance learning options.",
    focusAreas: [
      "Education",
      "Marine Science",
      "Business",
      "Computer Science",
    ],
    notablePrograms: ["BEd Science", "Blue Economy and Coastal Management", "BSc ICT"],
    badges: ["Ghana", "Distance Learning"],
    website: "https://ucc.edu.gh",
    averageTuitionInternational: 1300,
    tuitionDisplay: "GHS 14k–18k per year",
    studentBody: {
      total: 32000,
      internationalPercentage: 8,
    },
    researchHighlights: [
      "Centre for Coastal Management fisheries projects",
      "Teacher professional development for West Africa",
    ],
    employabilityRank: 68,
  },
  {
    id: "alexandria",
    name: "Alexandria University",
    city: "Alexandria",
    country: "Egypt",
    region: "Africa",
    institutionType: "Public research university",
    founded: 1938,
    ranking: 12,
    acceptanceRate: 40,
    programCount: 300,
    description:
      "Egyptian Mediterranean university offering low-cost engineering, maritime, and medical programs with Arabic and English tracks.",
    focusAreas: [
      "Engineering",
      "Maritime Studies",
      "Medicine",
      "Arts",
    ],
    notablePrograms: ["Petroleum Engineering", "Marine Engineering", "Pharmacy"],
    badges: ["North Africa", "Affordable"],
    website: "https://www.alexu.edu.eg",
    averageTuitionInternational: 1800,
    tuitionDisplay: "EGP 55k–65k per year",
    studentBody: {
      total: 150000,
      internationalPercentage: 6,
    },
    researchHighlights: [
      "Mediterranean energy transition research",
      "Joint labs with African Union maritime programs",
    ],
    employabilityRank: 66,
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
