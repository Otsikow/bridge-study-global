import type { MessageAttachment } from "@/types/messaging";

export const DEFAULT_TENANT_ID = "tenant-bridge-global";

export interface DirectoryProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role:
    | "student"
    | "agent"
    | "partner"
    | "staff"
    | "admin"
    | "counselor"
    | "verifier"
    | "finance"
    | "school_rep";
  tenant_id: string;
  headline?: string;
}

export interface MockConversationSeed {
  id: string;
  tenantId: string;
  title?: string | null;
  name?: string | null;
  type?: string | null;
  isGroup: boolean;
  participantIds: string[];
  metadata?: Record<string, unknown> | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
}

export interface MockMessageAttachmentSeed
  extends Pick<MessageAttachment, "type" | "url" | "name" | "size" | "mime_type" | "preview_url" | "storage_path" | "duration_ms" | "meta"> {
  id?: string;
}

export interface MockMessageSeed {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  messageType?: string;
  attachments?: MockMessageAttachmentSeed[];
  metadata?: Record<string, unknown> | null;
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const recent = {
  fifteenMinutes: minutesAgo(15),
  thirtyMinutes: minutesAgo(30),
  sixtyMinutes: minutesAgo(60),
  ninetyMinutes: minutesAgo(90),
  twoHours: minutesAgo(120),
  fourHours: minutesAgo(240),
  sixHours: minutesAgo(360),
  eightHours: minutesAgo(480),
  twentyHours: minutesAgo(60 * 20),
  oneDay: minutesAgo(60 * 24),
  twoDays: minutesAgo(60 * 48),
  fiveDays: minutesAgo(60 * 24 * 5),
};

export const DIRECTORY_PROFILES: DirectoryProfile[] = [
  {
    id: "student-zoe",
    full_name: "Zoe Chen",
    email: "zoe.chen@example.com",
    avatar_url: "https://i.pravatar.cc/150?img=47",
    role: "student",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "MSc Computer Science applicant",
  },
  {
    id: "student-lucas",
    full_name: "Lucas Martínez",
    email: "lucas.martinez@example.com",
    avatar_url: "https://i.pravatar.cc/150?img=15",
    role: "student",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "MBA hopeful · LATAM region",
  },
  {
    id: "student-amira",
    full_name: "Amira Khan",
    email: "amira.khan@example.com",
    avatar_url: "https://i.pravatar.cc/150?img=32",
    role: "student",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "Scholarship finalist",
  },
  {
    id: "agent-riley",
    full_name: "Riley Patel",
    email: "riley.patel@example.com",
    avatar_url: "https://i.pravatar.cc/150?img=12",
    role: "agent",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "Lead counsellor · North America",
  },
  {
    id: "staff-maya",
    full_name: "Maya Thompson",
    email: "maya.thompson@example.com",
    avatar_url: "https://i.pravatar.cc/150?img=38",
    role: "staff",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "Director of student success",
  },
  {
    id: "admin-jordan",
    full_name: "Jordan Avery",
    email: "jordan.avery@example.com",
    avatar_url: "https://i.pravatar.cc/150?img=5",
    role: "admin",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "Global operations",
  },
  {
    id: "counselor-samira",
    full_name: "Samira El-Sayed",
    email: "samira.elsayed@example.com",
    avatar_url: "https://i.pravatar.cc/150?img=24",
    role: "counselor",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "Visa specialist",
  },
  {
    id: "uni-sophia",
    full_name: "Sophia Laurent",
    email: "sophia.laurent@cascadia.edu",
    avatar_url: "https://i.pravatar.cc/150?img=9",
    role: "school_rep",
    tenant_id: DEFAULT_TENANT_ID,
    headline: "Partnerships · Cascadia University",
  },
];

export const MOCK_CONVERSATIONS: MockConversationSeed[] = [
  {
    id: "conv-zoe-agent",
    tenantId: DEFAULT_TENANT_ID,
    isGroup: false,
    participantIds: ["student-zoe", "agent-riley"],
    metadata: {
      subtitle: "University of Cascadia · Computer Science MSc",
    },
    createdAt: recent.twoDays,
    updatedAt: recent.fifteenMinutes,
    lastMessageAt: recent.fifteenMinutes,
  },
  {
    id: "conv-zoe-support",
    tenantId: DEFAULT_TENANT_ID,
    isGroup: true,
    name: "Application support room",
    participantIds: ["student-zoe", "agent-riley", "staff-maya"],
    metadata: {
      subtitle: "Fast-track graduate review",
    },
    avatarUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=200&auto=format&fit=crop&q=80",
    createdAt: recent.fiveDays,
    updatedAt: recent.twoHours,
    lastMessageAt: recent.twoHours,
  },
  {
    id: "conv-agent-university",
    tenantId: DEFAULT_TENANT_ID,
    isGroup: true,
    name: "Cascadia partnership sync",
    participantIds: ["agent-riley", "uni-sophia", "staff-maya"],
    metadata: {
      subtitle: "Quarterly recruitment goals",
    },
    createdAt: recent.oneDay,
    updatedAt: recent.fourHours,
    lastMessageAt: recent.fourHours,
  },
  {
    id: "conv-staff-leadership",
    tenantId: DEFAULT_TENANT_ID,
    isGroup: true,
    name: "Operations leadership",
    participantIds: ["staff-maya", "admin-jordan", "counselor-samira"],
    metadata: {
      subtitle: "Pipeline health and escalations",
    },
    createdAt: recent.fiveDays,
    updatedAt: recent.eightHours,
    lastMessageAt: recent.eightHours,
  },
  {
    id: "conv-lucas-agent",
    tenantId: DEFAULT_TENANT_ID,
    isGroup: false,
    participantIds: ["student-lucas", "agent-riley"],
    metadata: {
      subtitle: "Global MBA · Fall 2025 intake",
    },
    createdAt: recent.oneDay,
    updatedAt: recent.thirtyMinutes,
    lastMessageAt: recent.thirtyMinutes,
  },
];

export const MOCK_MESSAGES: Record<string, MockMessageSeed[]> = {
  "conv-zoe-agent": [
    {
      id: "msg-zoe-agent-1",
      conversationId: "conv-zoe-agent",
      senderId: "agent-riley",
      content: "Hi Zoe! I reviewed your statement of purpose and it already looks strong. I added a few inline suggestions for clarity.",
      createdAt: recent.twoHours,
      attachments: [
        {
          id: "att-sop",
          type: "file",
          url: "https://cdn.bridge-global.example/documents/zoe-sop-feedback.pdf",
          name: "SOP-feedback.pdf",
          size: 256000,
          mime_type: "application/pdf",
        },
      ],
    },
    {
      id: "msg-zoe-agent-2",
      conversationId: "conv-zoe-agent",
      senderId: "student-zoe",
      content: "Thank you! I'll incorporate the notes this evening. Do you think the university will accept my updated IELTS score?",
      createdAt: recent.ninetyMinutes,
    },
    {
      id: "msg-zoe-agent-3",
      conversationId: "conv-zoe-agent",
      senderId: "agent-riley",
      content: "Yes — their cutoff is 7.0 and you're at 7.5 now. I'll update the portal and share confirmation once admissions replies.",
      createdAt: recent.sixtyMinutes,
    },
    {
      id: "msg-zoe-agent-4",
      conversationId: "conv-zoe-agent",
      senderId: "student-zoe",
      content: "Amazing! Could we schedule a prep call for the faculty interview?",
      createdAt: recent.thirtyMinutes,
    },
    {
      id: "msg-zoe-agent-5",
      conversationId: "conv-zoe-agent",
      senderId: "agent-riley",
      content: "Absolutely. I reserved Thursday 4:30 PM PT. Sharing a calendar invite shortly.",
      createdAt: recent.fifteenMinutes,
      metadata: {
        action: "calendar_invite",
      },
    },
  ],
  "conv-zoe-support": [
    {
      id: "msg-zoe-support-1",
      conversationId: "conv-zoe-support",
      senderId: "staff-maya",
      content: "Hi team — Zoe's financial documents passed verification. Only the tuition deposit remains outstanding.",
      createdAt: recent.oneDay,
    },
    {
      id: "msg-zoe-support-2",
      conversationId: "conv-zoe-support",
      senderId: "agent-riley",
      content: "Thanks Maya! Zoe, I've emailed you the secure payment link. Let me know if you need a payment plan.",
      createdAt: recent.twentyHours,
    },
    {
      id: "msg-zoe-support-3",
      conversationId: "conv-zoe-support",
      senderId: "student-zoe",
      content: "Got it. I'll confirm once the transfer is complete — aiming for tonight.",
      createdAt: recent.twoHours,
    },
  ],
  "conv-agent-university": [
    {
      id: "msg-agent-university-1",
      conversationId: "conv-agent-university",
      senderId: "uni-sophia",
      content: "Sharing the revised seat allocation for Spring 2025. We've increased STEM seats by 15%.",
      createdAt: recent.eightHours,
      attachments: [
        {
          id: "att-seat-plan",
          type: "file",
          url: "https://cdn.bridge-global.example/reports/cascadia-seat-plan.xlsx",
          name: "Seat-allocation.xlsx",
          size: 512000,
          mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    },
    {
      id: "msg-agent-university-2",
      conversationId: "conv-agent-university",
      senderId: "agent-riley",
      content: "Thanks Sophia! We'll prioritise high-intent CS and Data Science candidates this cycle.",
      createdAt: recent.sixHours,
    },
    {
      id: "msg-agent-university-3",
      conversationId: "conv-agent-university",
      senderId: "staff-maya",
      content: "Noted. I'll align our admissions rubric with the updated targets and circulate by end of day.",
      createdAt: recent.fourHours,
    },
  ],
  "conv-staff-leadership": [
    {
      id: "msg-staff-leadership-1",
      conversationId: "conv-staff-leadership",
      senderId: "admin-jordan",
      content: "Reminder: Q4 pipeline review tomorrow. Please add any escalations to the shared tracker.",
      createdAt: recent.twoDays,
    },
    {
      id: "msg-staff-leadership-2",
      conversationId: "conv-staff-leadership",
      senderId: "counselor-samira",
      content: "Visa backlog cleared for 8 of the pending Nigerian applicants. Updated the dashboard tags accordingly.",
      createdAt: recent.oneDay,
    },
    {
      id: "msg-staff-leadership-3",
      conversationId: "conv-staff-leadership",
      senderId: "staff-maya",
      content: "Great work. I'll highlight that during tomorrow's briefing.",
      createdAt: recent.eightHours,
    },
  ],
  "conv-lucas-agent": [
    {
      id: "msg-lucas-agent-1",
      conversationId: "conv-lucas-agent",
      senderId: "student-lucas",
      content: "Hola Riley! Confirming my GMAT retake went well — scored a 710. Uploading the official report tonight.",
      createdAt: recent.oneDay,
    },
    {
      id: "msg-lucas-agent-2",
      conversationId: "conv-lucas-agent",
      senderId: "agent-riley",
      content: "That's excellent Lucas! I'll update your Kellogg and Rotman applications and request alumni interview slots.",
      createdAt: recent.thirtyMinutes,
    },
  ],
};
