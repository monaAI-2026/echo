import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIProvider, PoemMatch } from "./types";
import { buildPrompt } from "./prompt";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey?: string, model: string = "gemini-3-flash-preview") {
    this.client = new GoogleGenerativeAI(
      apiKey || process.env.GOOGLE_API_KEY || ""
    );
    this.model = model;
  }

  private calculateYearSpan(era: string): number {
    const yearMatch = era.match(/(\d{3,4})年/);
    if (yearMatch) {
      return new Date().getFullYear() - parseInt(yearMatch[1]);
    }

    if (era.includes("公元前")) {
      const bcMatch = era.match(/公元前(\d+)年/);
      if (bcMatch) return new Date().getFullYear() + parseInt(bcMatch[1]);
    }

    if (era.includes("神话时代") || era.includes("童话时代") || era.includes("永恒")) {
      return 0;
    }

    const decadeMatch = era.match(/(\d{3,4})年代/);
    if (decadeMatch) {
      return new Date().getFullYear() - (parseInt(decadeMatch[1]) + 5);
    }

    return 100;
  }

  async generateMatch(userInput: string): Promise<PoemMatch> {
    const prompt = buildPrompt(userInput);

    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              reply: { type: SchemaType.STRING },
              source_name: { type: SchemaType.STRING },
              source_era: { type: SchemaType.STRING },
              source_location: { type: SchemaType.STRING },
            },
            required: ["reply", "source_name", "source_era", "source_location"],
          },
          // @ts-expect-error -- thinkingConfig is supported by the API but not yet in SDK types
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      interface SideraResponse {
        reply: string;
        source_name: string;
        source_era: string;
        source_location: string;
      }

      const sideraResult = JSON.parse(text) as SideraResponse;

      const poemMatch: PoemMatch = {
        quote: sideraResult.reply,
        authorName: sideraResult.source_name,
        era: sideraResult.source_era,
        location: sideraResult.source_location,
        yearSpan: this.calculateYearSpan(sideraResult.source_era),
      };

      return poemMatch;
    } catch (error) {
      console.error("Gemini API error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw new Error(`Failed to generate match with Gemini: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
