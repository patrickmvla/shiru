declare module "@llamaindex/cloud" {
  interface LlamaParseReaderConfig {
    apiKey?: string;
    resultType?: "text" | "markdown";
  }

  interface Document {
    text: string;
    metadata?: Record<string, any>;
  }

  export class LlamaParseReader {
    constructor(config: LlamaParseReaderConfig);
    loadData(fileBuffer: Buffer): Promise<Document[]>;
  }
}
