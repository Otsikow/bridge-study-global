import { useConversation, useMessages } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";

interface ChatMessageProps {
  message: any;
}

function ChatMessage({ message }: ChatMessageProps) {
  const { data: profile } = useProfile(message.sender_id);

  return (
    <div>
      <strong>{profile?.full_name || "..."}:</strong> {message.content}
    </div>
  );
}

interface ChatProps {
  studentId: string;
}

export default function Chat({ studentId }: ChatProps) {
  const { data: conversationId } = useConversation(studentId);
  const { messages, sendMessage } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() === "") {
      return;
    }
    sendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div>
      <h2 className="text-lg font-semibold">Chat</h2>
      <div className="space-y-4 mt-2">
        <div className="h-64 overflow-y-auto border rounded-md p-4">
          {messages?.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
}
