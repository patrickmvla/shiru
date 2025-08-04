import { useMutation } from "@tanstack/react-query";
import { useAppStore, Message } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

// import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = "http://localhost:8000";

interface ChatPayload {
  message: string;
}

/**
 * The function that makes the API call to the chat endpoint.
 * @param payload The chat message payload.
 * @returns A promise that resolves with the server's response.
 */
const sendMessage = async (payload: ChatPayload): Promise<Message> => {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get a response.");
  }

  const data = await response.json();
  return {
    id: uuidv4(),
    role: "assistant",
    text: data.answer,
    sources: data.sources,
  };
};

export const useChat = () => {
  const addMessage = useAppStore((state) => state.addMessage);
  // const { toast } = useToast();

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (variables) => {
      // Optimistically add the user's message to the store
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        text: variables.message,
      };
      addMessage(userMessage);
    },
    onSuccess: (data) => {
      // On success, add the assistant's response to the store
      addMessage(data);
    },
    onError: (error) => {
      console.error("Chat error:", error.message);
      // toast({
      //   title: 'An Error Occurred',
      //   description: error.message,
      //   variant: 'destructive',
      // });
      // Optionally, you could add a message to the chat indicating an error
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        text: "Sorry, I ran into an error. Please try again.",
      };
      addMessage(errorMessage);
    },
  });
};
