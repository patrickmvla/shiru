import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { pdfService } from "./services/pdf.service";
import { qdrantService } from "./services/qdrant.service";
import { LLMService } from "./services/llm.service";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["POST", "GET", "OPTIONS"],
  })
);

app.get("/", (c) => {
  return c.json({ message: "Study Buddy AI server is running!" });
});

app.post("/api/upload", async (c) => {
  try {
    const body = await c.req.formData();
    const file = body.get("file") as File;

    if (!file) {
      return c.json({ success: false, error: "No file provided." }, 400);
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const chunks = await pdfService.parseAndChunk(fileBuffer);
    await qdrantService.addChunks(chunks, file.name);

    return c.json({
      success: true,
      message: `File '${file.name}' processed successfully.`,
    });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    return c.json({ success: false, error: "Failed to process file." }, 500);
  }
});

app.post("/api/chat", async (c) => {
  try {
    const { message } = await c.req.json();

    if (!message) {
      return c.json({ success: false, error: "No message provided." }, 400);
    }

    const contextChunks = await qdrantService.search(message);

    const answer = await LLMService.generateAnswer(message, contextChunks);

    const sources = contextChunks.map((chunk) => ({
      source: chunk.payload.source,
    }));

    const uniqueSources = Array.from(
      new Map(sources.map((item) => [item["source"], item])).values()
    );

    return c.json({ success: true, answer, sources: uniqueSources });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return c.json(
      { success: false, error: "Failed to process chat message." },
      500
    );
  }
});

const port = 8000;
console.log(`Backend server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
