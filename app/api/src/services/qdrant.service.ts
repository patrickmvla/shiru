import { QdrantClient } from "@qdrant/qdrant-js";
import type { Schemas } from "@qdrant/qdrant-js";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import { EmbeddingService } from "./embedding.service";
import { ContextChunk } from "./llm.service";

export class QdrantService {
  private client: QdrantClient;
  private collectionName = "study-buddy-collection";
  private vectorSize = 1024;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  public async ensureCollectionExists(): Promise<void> {
    try {
      const collections = await this.client.getCollections();

      const collectionExists = collections.collections.some(
        (collection: Schemas["CollectionDescription"]) =>
          collection.name === this.collectionName
      );

      if (!collectionExists) {
        console.log(
          `Collection '${this.collectionName}' not found. Creating...`
        );
        await this.client.recreateCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: "Cosine",
          },
        });
        console.log(
          `Collection '${this.collectionName}' created successfully.`
        );
      }
    } catch (error) {
      console.error("Failed to ensure collection exists:", error);
      throw new Error("Could not connect to or create Qdrant collection.");
    }
  }

  public async addChunks(chunks: string[], source: string): Promise<void> {
    await this.ensureCollectionExists();

    const points = [];
    for (const chunk of chunks) {
      const embedding = await EmbeddingService.generateEmbedding(chunk);
      points.push({
        id: uuidv4(),
        vector: embedding,
        payload: {
          source: source,
          text: chunk,
        },
      });
    }

    if (points.length === 0) {
      console.log("No chunks to add to the collection.");
      return;
    }

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: points,
    });

    console.log(
      `Added ${points.length} points to collection '${this.collectionName}'.`
    );
  }

  public async search(query: string, limit = 5): Promise<ContextChunk[]> {
    const queryVector = await EmbeddingService.generateEmbedding(query);

    const searchResult = await this.client.search(this.collectionName, {
      vector: queryVector,
      limit: limit,
      with_payload: true,
    });

    return searchResult.map((hit) => {
      const payload = hit.payload as { source: string; text: string };

      return {
        source: payload.source,
        text: payload.text,
        score: hit.score,
      };
    });
  }
}

export const qdrantService = new QdrantService();
