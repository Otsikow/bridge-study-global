import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatArea } from '../ChatArea';
import type { Conversation, Message, TypingIndicator } from '@/hooks/useMessages';

vi.mock('../MessageInput', () => ({
  MessageInput: () => <div data-testid="message-input" />,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123', email: 'tester@example.com' } }),
}));

const baseConversation: Conversation = {
  id: 'conv-1',
  tenant_id: 'tenant-1',
  title: 'Chat',
  type: 'direct',
  is_group: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_message_at: new Date().toISOString(),
  participants: [
    {
      id: 'cp-1',
      conversation_id: 'conv-1',
      user_id: 'user-123',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
      role: 'owner',
      is_admin: true,
      profile: {
        id: 'user-123',
        full_name: 'You',
        avatar_url: null,
        role: 'student',
      },
    },
    {
      id: 'cp-2',
      conversation_id: 'conv-1',
      user_id: 'user-456',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
      role: 'member',
      is_admin: false,
      profile: {
        id: 'user-456',
        full_name: 'Alex Lee',
        avatar_url: null,
        role: 'student',
      },
    },
  ],
  lastMessage: undefined,
  unreadCount: 0,
  name: 'Chat',
  avatar_url: null,
  metadata: null,
};

const baseMessage = (overrides: Partial<Message>): Message => ({
  id: 'msg-default',
  conversation_id: 'conv-1',
  sender_id: 'user-456',
  content: 'Hello there',
  message_type: 'text',
  attachments: [],
  metadata: null,
  reply_to_id: null,
  edited_at: null,
  deleted_at: null,
  created_at: new Date().toISOString(),
  receipts: [],
  sender: {
    id: 'user-456',
    full_name: 'Alex Lee',
    avatar_url: null,
  },
  ...overrides,
});

describe('ChatArea', () => {
  it('renders media attachments and read receipts', () => {
    const messages: Message[] = [
      baseMessage({
        id: 'msg-1',
        attachments: [
          {
            id: 'att-1',
            type: 'image',
            url: 'https://example.com/campus.png',
            name: 'campus.png',
            size: 1024,
            mime_type: 'image/png',
            preview_url: 'https://example.com/campus.png',
            storage_path: 'user-456/campus.png',
            duration_ms: null,
            meta: null,
          },
          {
            id: 'att-2',
            type: 'audio',
            url: 'https://example.com/voice.webm',
            name: 'voice.webm',
            size: 2048,
            mime_type: 'audio/webm',
            preview_url: null,
            storage_path: 'user-456/voice.webm',
            duration_ms: 5000,
            meta: null,
          },
          {
            id: 'att-3',
            type: 'file',
            url: 'https://example.com/notes.pdf',
            name: 'notes.pdf',
            size: 4096,
            mime_type: 'application/pdf',
            preview_url: null,
            storage_path: 'user-456/notes.pdf',
            duration_ms: null,
            meta: null,
          },
        ],
      }),
      baseMessage({
        id: 'msg-2',
        sender_id: 'user-123',
        content: 'I have seen this.',
        receipts: [
          { message_id: 'msg-2', user_id: 'user-123', read_at: new Date().toISOString(), profile: baseConversation.participants![0].profile },
          { message_id: 'msg-2', user_id: 'user-456', read_at: new Date().toISOString(), profile: baseConversation.participants![1].profile },
        ],
        sender: {
          id: 'user-123',
          full_name: 'You',
          avatar_url: null,
        },
      }),
    ];

    render(
      <ChatArea
        conversation={baseConversation}
        messages={messages}
        typingUsers={[] as TypingIndicator[]}
        loading={false}
        onSendMessage={vi.fn()}
        onStartTyping={vi.fn()}
        onStopTyping={vi.fn()}
      />
    );

    expect(screen.getByAltText('campus.png')).toBeInTheDocument();
    expect(screen.getByText('voice.webm')).toBeInTheDocument();
    expect(screen.getByText('notes.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Seen by Alex Lee/)).toBeInTheDocument();
  });

  it('shows typing indicators', () => {
    const typingUsers = [
      {
        user_id: 'user-456',
        conversation_id: 'conv-1',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3000).toISOString(),
        profile: { full_name: 'Alex Lee' },
      },
    ];

    render(
      <ChatArea
        conversation={baseConversation}
        messages={[]}
        typingUsers={typingUsers as unknown as TypingIndicator[]}
        loading={false}
        onSendMessage={vi.fn()}
        onStartTyping={vi.fn()}
        onStopTyping={vi.fn()}
      />
    );

    expect(screen.getByText(/Alex Lee is typing…/)).toBeInTheDocument();
  });
});
