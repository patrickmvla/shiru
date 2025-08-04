import { create } from "zustand";

export interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  sources?: { source: string }[];
}

interface AppState {
  messages: Message[];
  documents: string[];
  addMessage: (message: Message) => void;
  addDocument: (documentName: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  messages: [
    {
      id: "init",
      role: "assistant",
      text: "Hello! Upload a document and ask me a question to get started.",
    },
  ],
  documents: [],

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  addDocument: (documentName) =>
    set((state) => {
      if (!state.documents.includes(documentName)) {
        return { documents: [...state.documents, documentName] };
      }
      return state;
    }),
}));
