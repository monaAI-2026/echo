/**
 * AI Provider 统一接口和类型定义
 */

export interface PoemMatch {
  quote: string;        // 诗词原文
  authorName: string;   // 说话者（真实人物或文学角色）
  era: string;          // 时间（朝代/年份/作品中的时间）
  location: string;     // 地点/场景
  source?: string;      // 出处（诗名/书名）
  yearSpan: number;     // 距今年数
}

export interface AIProvider {
  /**
   * 根据用户输入生成匹配的诗词
   * @param userInput 用户的心情/想法
   * @returns 匹配的诗词信息
   */
  generateMatch(userInput: string): Promise<PoemMatch>;
}

export type AIProviderType = 'claude' | 'gemini';
