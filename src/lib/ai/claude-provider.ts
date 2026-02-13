import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, PoemMatch } from "./types";

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateMatch(userInput: string): Promise<PoemMatch> {
    const prompt = `你是一位精通中国古典文学的学者。用户会告诉你他们此刻的心情或想法，请为他们找到一句最贴切、最有共鸣的中国古诗词名句。

要求：
1. 深入理解用户的情感和意境
2. 选择真实存在的经典诗词名句
3. 确保诗句与用户心情有深层共鸣，而非简单的字面匹配
4. 优先选择广为人知的名句
5. 如果这句话出自文学作品中某个角色之口，authorName 应使用角色名而非作者名，era 应使用作品中这句话发生的时间而非作者的真实年代。例如："有一天，我看了四十四次日落" → authorName: "小王子"，era: "童话时代"，而非 authorName: "圣埃克苏佩里"

用户心情：${userInput}

请以 JSON 格式返回，包含以下字段：
{
  "quote": "诗词原文",
  "authorName": "说话者（真实人物用本名，文学角色用角色名）",
  "era": "时期（真实人物用朝代/年份，文学角色用作品中的时间）",
  "location": "地点/场景（不超过11个中文字）",
  "yearSpan": 距今大约多少年
}

只返回 JSON，不要其他解释。`;

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

      const result = JSON.parse(jsonText) as PoemMatch;

      return result;
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error("Failed to generate match with Claude");
    }
  }
}
