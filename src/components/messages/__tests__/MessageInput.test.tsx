import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MessageInput } from '../MessageInput';

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const removeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
        remove: removeMock,
      })),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123', email: 'tester@example.com' } }),
}));

describe('MessageInput', () => {
  beforeEach(() => {
    uploadMock.mockReset();
    getPublicUrlMock.mockReset();
    removeMock.mockReset();
  });

  it('sends plain text messages', async () => {
    const onSendMessage = vi.fn();
    render(
      <MessageInput
        onSendMessage={onSendMessage}
        onStartTyping={() => {}}
        onStopTyping={() => {}}
      />
    );

    const textarea = screen.getByPlaceholderText('Type a message...');
    await userEvent.type(textarea, 'Hello world');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledTimes(1);
    });

    const payload = onSendMessage.mock.calls[0][0];
    expect(payload.content).toBe('Hello world');
    expect(payload.attachments).toEqual([]);
    expect(payload.messageType).toBe('text');
  });

  it('uploads an image attachment and sends it', async () => {
    uploadMock.mockResolvedValue({ data: null, error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.png' }, error: null });

    const onSendMessage = vi.fn();
    render(
      <MessageInput
        onSendMessage={onSendMessage}
        onStartTyping={() => {}}
        onStopTyping={() => {}}
      />
    );

    const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
    const input = screen.getByTestId('message-file-input');
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalled();
    });

    // Wait for preview to appear
    await screen.findByAltText('photo.png');

    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledTimes(1);
    });

    const payload = onSendMessage.mock.calls[0][0];
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments?.[0]).toMatchObject({
      type: 'image',
      name: 'photo.png',
      url: 'https://example.com/photo.png',
    });
    expect(payload.content).toBe('');
    expect(payload.messageType).toBe('image');
  });
});
