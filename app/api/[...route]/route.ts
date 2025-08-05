import { Hono } from "hono";
import { handle } from "hono/vercel";

import { pdfService } from "../src/services/pdf.service";
import { qdrantService } from "../src/services/qdrant.service";
import { LLMService } from "../src/services/llm.service";

const app = new Hono();

app.post("/api/upload", async (c) => {
  try {
    const body = await c.req.formData();
    const file = body.get("file") as File | null;

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
      source: chunk.source,
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

export const GET = handle(app);
export const POST = handle(app);
