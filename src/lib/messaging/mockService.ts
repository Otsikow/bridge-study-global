import type { Conversation, ConversationParticipant, Message } from "@/types/messaging";
import {
  DEFAULT_TENANT_ID,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  type MockMessageAttachmentSeed,
  type MockMessageSeed,
} from "./data";
import {
  findDirectoryProfileById,
  getPlaceholderIdForRole,
  type DirectoryProfile,
} from "./directory";

type AliasMap = Record<string, string>;

const resolveId = (id: string, aliasMap: AliasMap) => aliasMap[id] ?? id;

const createAttachment = (
  attachment: MockMessageAttachmentSeed,
  fallbackId: string,
  index: number,
) => ({
  id: attachment.id ?? `${fallbackId}-att-${index}`,
  type: attachment.type ?? "file",
  url: attachment.url,
  name: attachment.name ?? null,
  size: attachment.size ?? null,
  mime_type: attachment.mime_type ?? null,
  preview_url: attachment.preview_url ?? attachment.url,
  storage_path: attachment.storage_path ?? null,
  duration_ms: attachment.duration_ms ?? null,
  meta: attachment.meta ?? null,
});

const computeUnreadCount = (
  messages: Message[],
  currentUserId: string | null,
  participants: ConversationParticipant[],
) => {
  if (!currentUserId) return messages.length;
  const participant = participants.find((item) => item.user_id === currentUserId);
  if (!participant?.last_read_at) return messages.length;
  const lastReadTime = new Date(participant.last_read_at).getTime();
  if (Number.isNaN(lastReadTime)) return 0;
  return messages.reduce((count, message) => {
    const createdAt = new Date(message.created_at).getTime();
    if (Number.isNaN(createdAt)) return count;
    if (message.sender_id !== currentUserId && createdAt > lastReadTime) {
      return count + 1;
    }
    return count;
  }, 0);
};

const hydrateMessage = (
  seed: MockMessageSeed,
  aliasMap: AliasMap,
  participants: ConversationParticipant[],
) => {
  const senderId = resolveId(seed.senderId, aliasMap);
  const participant = participants.find((item) => item.user_id === senderId);
  const attachments = (seed.attachments ?? []).map((attachment, idx) =>
    createAttachment(attachment, `${seed.id}-${idx}`, idx),
  );
  return {
    id: seed.id,
    conversation_id: seed.conversationId,
    sender_id: senderId,
    content: seed.content,
    message_type: seed.messageType ?? "text",
    attachments,
    metadata: seed.metadata ?? null,
    reply_to_id: null,
    edited_at: null,
    deleted_at: null,
    created_at: seed.createdAt,
    sender: participant?.profile
      ? {
          id: participant.profile.id,
          full_name: participant.profile.full_name,
          avatar_url: participant.profile.avatar_url,
        }
      : undefined,
  } satisfies Message;
};

const buildMessages = (
  conversationId: string,
  aliasMap: AliasMap,
  participants: ConversationParticipant[],
) => {
  const seeds = MOCK_MESSAGES[conversationId] ?? [];
  return seeds.map((seed) => hydrateMessage(seed, aliasMap, participants));
};

const sortByLastMessage = (conversations: Conversation[]) => {
  return [...conversations].sort((a, b) => {
    const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return timeB - timeA;
  });
};

export interface InitializeMockStateOptions {
  currentProfile?: DirectoryProfile | null;
  aliasMap?: AliasMap;
}

export interface MockMessagingState {
  conversations: Conversation[];
  messagesById: Record<string, Message[]>;
}

export const initializeMockMessagingState = (
  userId: string | null,
  tenantId: string | null,
  options: InitializeMockStateOptions = {},
): MockMessagingState => {
  const activeTenant = tenantId ?? DEFAULT_TENANT_ID;
  const aliasMap: AliasMap = { ...options.aliasMap };

  const ensureProfile = (id: string) => {
    if (options.currentProfile && options.currentProfile.id === id) {
      return options.currentProfile;
    }
    return findDirectoryProfileById(id);
  };

  if (options.currentProfile) {
    const placeholder = getPlaceholderIdForRole(options.currentProfile.role);
    if (placeholder && placeholder !== options.currentProfile.id) {
      aliasMap[placeholder] = options.currentProfile.id;
    }
  }

  const conversations: Conversation[] = [];
  const messagesById: Record<string, Message[]> = {};

  for (const seed of MOCK_CONVERSATIONS) {
    if (seed.tenantId !== activeTenant) continue;

    const actualParticipantIds = seed.participantIds.map((id) => resolveId(id, aliasMap));
    const participantProfiles: DirectoryProfile[] = [];
    for (const participantId of actualParticipantIds) {
      const profile = ensureProfile(participantId);
      if (profile) {
        participantProfiles.push(profile);
      }
    }

    if (participantProfiles.length === 0) continue;

    if (userId && !actualParticipantIds.includes(userId)) {
      continue;
    }

    const participants: ConversationParticipant[] = participantProfiles.map((profile) => ({
      id: `${seed.id}-${profile.id}`,
      conversation_id: seed.id,
      user_id: profile.id,
      joined_at: seed.createdAt,
      last_read_at: seed.createdAt,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: profile.role,
      },
    }));

    const messages = buildMessages(seed.id, aliasMap, participants);
    messagesById[seed.id] = messages;
    const lastMessage = messages[messages.length - 1];
    const lastMessageAt = lastMessage?.created_at ?? seed.lastMessageAt ?? seed.updatedAt;

    participants.forEach((participant) => {
      if (participant.user_id === userId) {
        participant.last_read_at = lastMessageAt ?? seed.updatedAt;
      } else if (messages.length > 1) {
        participant.last_read_at = messages[messages.length - 2]?.created_at ?? seed.createdAt;
      } else {
        participant.last_read_at = seed.createdAt;
      }
    });

    conversations.push({
      id: seed.id,
      tenant_id: seed.tenantId,
      title: seed.title ?? null,
      type: seed.type ?? (seed.isGroup ? "group" : "direct"),
      is_group: seed.isGroup,
      created_at: seed.createdAt,
      updated_at: lastMessageAt ?? seed.updatedAt,
      last_message_at: lastMessageAt,
      name: seed.name ?? null,
      avatar_url: seed.avatarUrl ?? null,
      metadata: seed.metadata ?? null,
      participants,
      lastMessage,
      unreadCount: computeUnreadCount(messages, userId, participants),
    });
  }

  return {
    conversations: sortByLastMessage(conversations),
    messagesById,
  };
};

export const sortConversations = sortByLastMessage;
