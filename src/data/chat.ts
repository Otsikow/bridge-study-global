import { supabase } from "@/integrations/supabase/client";

export const getOrCreateConversation = async (studentId: string): Promise<string> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", supabase.auth.user()!.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    throw profileError;
  }

  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_user1_id: supabase.auth.user()!.id,
    p_user2_id: studentId,
    p_tenant_id: profile.tenant_id,
  });

  if (error) {
    console.error("Error getting or creating conversation:", error);
    throw error;
  }

  return data;
};

export const getMessages = async (conversationId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }

  return data;
};

export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<any> => {
  const { data, error } = await supabase
    .from("conversation_messages")
    .insert([
      {
        conversation_id: conversationId,
        sender_id: supabase.auth.user()!.id,
        content: content,
      },
    ])
    .single();

  if (error) {
    console.error("Error sending message:", error);
    throw error;
  }

  return data;
};
