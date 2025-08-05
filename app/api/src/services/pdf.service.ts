import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

const LLAMA_PARSE_BASE_URL = "https://api.cloud.llamaindex.ai/api/v1";

export class PdfService {
  private textSplitter: RecursiveCharacterTextSplitter;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LLAMA_CLOUD_API_KEY!;
    if (!this.apiKey) {
      throw new Error(
        "LLAMA_CLOUD_API_KEY is not set in environment variables."
      );
    }

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  private async getParsedText(fileBuffer: Buffer): Promise<string> {
    const formData = new FormData();

    const arrayBuffer = new Uint8Array(fileBuffer).buffer;

    formData.append(
      "file",
      new Blob([arrayBuffer], { type: "application/pdf" })
    );

    const uploadResponse = await fetch(
      `${LLAMA_PARSE_BASE_URL}/parsing/upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(
        `LlamaParse upload failed: ${await uploadResponse.text()}`
      );
    }
    const { id: jobId } = await uploadResponse.json();

    let jobStatus = "";
    while (jobStatus !== "SUCCESS") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await fetch(
        `${LLAMA_PARSE_BASE_URL}/parsing/job/${jobId}`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      );
      const statusData = await statusResponse.json();
      jobStatus = statusData.status;
      if (jobStatus === "FAILURE") throw new Error("LlamaParse job failed.");
    }

    const resultResponse = await fetch(
      `${LLAMA_PARSE_BASE_URL}/parsing/job/${jobId}/result/markdown`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );
    const resultData = await resultResponse.json();

    return resultData.markdown;
  }

  public async parseAndChunk(fileBuffer: Buffer): Promise<string[]> {
    try {
      const fullText = await this.getParsedText(fileBuffer);

      if (!fullText || !fullText.trim()) {
        console.warn("No text content extracted by LlamaParse.");
        return [];
      }

      const chunks = await this.textSplitter.splitText(fullText);
      console.log(
        `PDF parsed with LlamaParse API and split into ${chunks.length} chunks.`
      );

      return chunks;
    } catch (error) {
      console.error("Failed to parse or chunk PDF with LlamaParse API:", error);
      throw new Error("Error processing PDF file with LlamaParse.");
    }
  }
}

export const pdfService = new PdfService();
