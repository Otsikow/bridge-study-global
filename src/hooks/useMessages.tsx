import { useEffect, useState } from "react";

export interface SendMessagePayload {
  content: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
  }>;
}

export function useMessages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = (conversationId: string, payload: SendMessagePayload) => {
    console.log("Send message:", conversationId, payload);
  };

  const startTyping = (conversationId: string) => {
    console.log("Start typing:", conversationId);
  };

  const stopTyping = (conversationId: string) => {
    console.log("Stop typing:", conversationId);
  };

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    typingUsers,
    loading,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
