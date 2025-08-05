"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";
import { useUploadDocument } from "@/hooks/use-upload-document";
import { useAppStore } from "@/lib/store";

const fileSchema = z.object({
  file: z.any().refine((files) => files?.length === 1, "File is required."),
});

const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type FileFormValues = z.infer<typeof fileSchema>;
type ChatFormValues = z.infer<typeof chatSchema>;

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { messages, documents } = useAppStore();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const uploadMutation = useUploadDocument();
  const chatMutation = useChat();

  const fileForm = useForm<FileFormValues>({
    resolver: zodResolver(fileSchema),
  });

  const chatForm = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
  });

  const handleFileUpload = (data: FileFormValues) => {
    const file = data.file[0];
    if (file) {
      uploadMutation.mutate(file);
      fileForm.reset();
    }
  };

  const handleChatSubmit = (data: ChatFormValues) => {
    chatMutation.mutate({ message: data.message });
    chatForm.reset();
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isMounted) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Document Management */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your Documents</CardTitle>
              <CardDescription>Upload and manage materials.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <form
                onSubmit={fileForm.handleSubmit(handleFileUpload)}
                className="space-y-2"
              >
                <Input type="file" {...fileForm.register("file")} />
                {fileForm.formState.errors.file?.message && (
                  <p className="text-xs text-destructive">
                    {`${fileForm.formState.errors.file.message}`}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </form>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Uploaded Files:</h3>
                {documents.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {documents.map((doc, i) => (
                      <li key={i}>📄 {doc}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>
                Ask questions about your documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              <ScrollArea className="h-full pr-4" ref={chatContainerRef}>
                <div className="flex flex-col gap-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground self-end"
                          : "bg-muted self-start"
                      }`}
                    >
                      <p className="text-sm">{m.text}</p>
                      {m.sources && (
                        <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                          <strong>Sources:</strong>{" "}
                          {m.sources.map((s) => s.source).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t">
              <form
                onSubmit={chatForm.handleSubmit(handleChatSubmit)}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask a question..."
                  {...chatForm.register("message")}
                  disabled={chatMutation.isPending}
                />
                <Button type="submit" disabled={chatMutation.isPending}>
                  {chatMutation.isPending ? "Thinking..." : "Send"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
