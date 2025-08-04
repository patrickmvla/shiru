import { pipeline } from "@xenova/transformers";

export class EmbeddingService {
  private static instance: Promise<any> | null = null;

  private static model = "Xenova/bge-large-en-v1.5";

  private static task: "feature-extraction" = "feature-extraction";

  public static async getInstance(): Promise<any> {
    if (this.instance === null) {
      console.log("Initializing embedding model...");
      this.instance = pipeline(this.task, this.model);
    }
    return this.instance;
  }

  public static async generateEmbedding(text: string): Promise<number[]> {
    const generator = await this.getInstance();

    const output = await generator(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  }
}
