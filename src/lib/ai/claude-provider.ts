import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, PoemMatch } from "./types";
import { buildPrompt } from "./prompt";

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
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
      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      // 提取 JSON（处理可能的 markdown 代码块）
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?/g, "");
      }

      interface SideraResponse {
        reply: string;
        source_name: string;
        source_era: string;
        source_location: string;
      }

      const sideraResult = JSON.parse(jsonText) as SideraResponse;

      const poemMatch: PoemMatch = {
        quote: sideraResult.reply,
        authorName: sideraResult.source_name,
        era: sideraResult.source_era,
        location: sideraResult.source_location,
        yearSpan: this.calculateYearSpan(sideraResult.source_era),
      };

      return poemMatch;
    } catch (error) {
      console.error("Claude API error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw new Error(`Failed to generate match with Claude: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
