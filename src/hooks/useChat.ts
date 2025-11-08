import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
} from "@/data/chat";

export const useConversation = (studentId: string) => {
  return useQuery({
    queryKey: ["conversation", studentId],
    queryFn: () => getOrCreateConversation(studentId),
  });
};

export const useMessages = (conversationId: string | undefined) => {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(conversationId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  return {
    messages: messagesQuery.data,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage: sendMessageMutation.mutate,
  };
};
