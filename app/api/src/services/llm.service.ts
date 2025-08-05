import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type ContextChunk = {
  text: string;
  source: string;
  score: number;
};

export class LLMService {
  public static async generateAnswer(
    query: string,
    context: ContextChunk[]
  ): Promise<string> {
    const contextText = context.map((c) => c.text).join("\n---\n");

    const prompt = `
      You are an expert study assistant. Your goal is to answer questions based ONLY on the provided context.
      Read the context below and answer the user's question accurately.
      If the answer is not available in the context, clearly state "I could not find the answer in the provided documents." Do not use any outside knowledge.

      --- CONTEXT ---
      ${contextText}
      --- END CONTEXT ---

      User's Question: ${query}

      Answer:
    `;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama3-8b-8192",
      });

      return (
        chatCompletion.choices[0]?.message?.content || "No response from AI."
      );
    } catch (error) {
      console.error("Error generating answer from Groq:", error);
      throw new Error("Failed to get a response from the AI model.");
    }
  }
}
