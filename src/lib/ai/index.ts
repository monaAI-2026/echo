import { AIProvider, AIProviderType } from "./types";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";

/**
 * 获取 AI Provider 实例
 * 根据环境变量 AI_PROVIDER 决定使用哪个 AI
 * 默认使用 Claude
 */
export function getAIProvider(
  providerType?: AIProviderType
): AIProvider {
  const type =
    providerType ||
    (process.env.AI_PROVIDER as AIProviderType) ||
    "claude";

  switch (type) {
    case "gemini":
      return new GeminiProvider();
    case "claude":
    default:
      return new ClaudeProvider();
  }
}

/**
 * 带降级的 AI 调用
 * 优先使用主 provider，失败时自动切换到备用 provider
 */
export async function generateMatchWithFallback(
  userInput: string,
  primaryProvider?: AIProviderType
): Promise<{ result: any; usedProvider: AIProviderType }> {
  // 从环境变量读取默认 provider
  const defaultProvider = (process.env.AI_PROVIDER as AIProviderType) || "claude";
  const mainProvider = primaryProvider || defaultProvider;
  const fallbackProvider: AIProviderType =
    mainProvider === "claude" ? "gemini" : "claude";

  try {
    const provider = getAIProvider(mainProvider);
    const result = await provider.generateMatch(userInput);
    return { result, usedProvider: mainProvider };
  } catch (error) {
    console.warn(
      `Primary provider (${mainProvider}) failed, trying fallback (${fallbackProvider})`
    );

    try {
      const provider = getAIProvider(fallbackProvider);
      const result = await provider.generateMatch(userInput);
      return { result, usedProvider: fallbackProvider };
    } catch (fallbackError) {
      console.error("Both providers failed:", fallbackError);
      throw new Error("All AI providers failed");
    }
  }
}

// 导出类型和类，方便直接使用
export { ClaudeProvider } from "./claude-provider";
export { GeminiProvider } from "./gemini-provider";
export type { AIProvider, PoemMatch, AIProviderType } from "./types";
