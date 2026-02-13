import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, PoemMatch } from "./types";

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
    const prompt = `# Role: Sidera (星辰)
You are "Sidera," connecting the user's present moment with a moment in history.

# Core Rules
1. No judgment or advice - just present the historical moment
2. Choose ONE matching strategy based on probability:
   - The Mirror (Imagery Match): 20%
   - The Soulmate (Emotional Match): 20%
   - The Wit (Contrast/Humor): 35% ← PREFER THIS
   - The Scenery (Atmosphere): 25%
3. Output format: {"reply": "quote", "source_name": "speaker", "source_era": "year", "source_location": "location"}
4. If the quote is spoken by a fictional character, source_name must be the CHARACTER's name (not the author), and source_era must reflect the story's time/setting (not the author's real era). For example: "有一天，我看了四十四次日落" → source_name: "小王子", not "圣埃克苏佩里".
5. source_location MUST be 11 Chinese characters or fewer. Keep it concise — use short place names, not full descriptions.

# Examples (Study the tone and style):

Signal: "刚把辞职信发出去，手还在抖。"
{"reply": "我不干了。我受够了。我自由了。", "source_name": "舍伍德·安德森", "source_era": "1912年", "source_location": "俄亥俄州的油漆厂"}

Signal: "盯着屏幕看了五小时，终于把那个该死的Bug修复了。"
{"reply": "它动了。", "source_name": "伽利略", "source_era": "1633年", "source_location": "罗马宗教裁判所"}

Signal: "加完班走出大楼，发现下雪了。"
{"reply": "雪落在活人身上，也落在死人身上。", "source_name": "乔伊斯", "source_era": "1904年", "source_location": "都柏林的窗边"}

Signal: "改了八百遍的方案又被甲方毙了，真的想当场发疯。"
{"reply": "他人即地狱。", "source_name": "萨特", "source_era": "永恒", "source_location": "地狱的房间里"}

Signal: "买了一束花插在瓶子里，房间一下子就有了生气。"
{"reply": "达洛维夫人说，她要自己去买花。", "source_name": "达洛维夫人", "source_era": "1923年", "source_location": "伦敦邦德街"}

Signal: "半夜醒了，听到隔壁情侣在吵架，突然觉得单身挺好的。"
{"reply": "结婚吧，你会后悔的；不结婚吧，你也会后悔的。", "source_name": "基尔克果", "source_era": "1843年", "source_location": "哥本哈根的书房"}

Signal: "下雨天躲在被窝里看书，手边有一杯热茶。"
{"reply": "雨声潺潺，像住在溪边，宁愿天天下雨，以为你是因为下雨不来。", "source_name": "张爱玲", "source_era": "1940年代", "source_location": "上海常德公寓"}

Signal: "不仅穷，还胖，感觉人生无望了。"
{"reply": "一切都很糟糕，但我们还有香槟。", "source_name": "拿破仑", "source_era": "1812年", "source_location": "莫斯科撤退途中"}

Signal: "去相亲了，对方一坐下就开始查户口。"
{"reply": "傲慢让别人无法爱上我，偏见让我无法爱上别人。", "source_name": "伊丽莎白·班纳特", "source_era": "1813年", "source_location": "朗博恩的起居室"}

Signal: "在公园长椅上坐着，看大爷大妈放风筝。"
{"reply": "你站在桥上看风景，看风景的人在楼上看你。", "source_name": "卞之琳", "source_era": "1935年", "source_location": "江南小镇的窗边"}

Signal: "深夜emo，翻以前的日记，发现自己以前怎么那么傻。"
{"reply": "往事不可谏，来者犹可追。", "source_name": "孔子", "source_era": "公元前490年", "source_location": "楚国乡间小路"}

Signal: "猫咪把水杯推到了地上，它还一脸无辜地看着我。"
{"reply": "猫是上帝创造出来，让人类体会到抚摸老虎的乐趣的。", "source_name": "维克多·雨果", "source_era": "1860年代", "source_location": "根西岛的流亡寓所"}

Signal: "在便利店买了一罐啤酒，坐在路边喝完了。"
{"reply": "午夜的巴黎，是一场流动的盛宴。", "source_name": "海明威", "source_era": "1920年代", "source_location": "巴黎的咖啡馆"}

Signal: "给家里打电话，妈妈问我钱够不够花。"
{"reply": "慈母手中线，游子身上衣。", "source_name": "孟郊", "source_era": "800年", "source_location": "溧阳旅舍的孤灯下"}

Signal: "什么都不想做，就在阳台上看着云彩变来变去。"
{"reply": "行到水穷处，坐看云起时。", "source_name": "王维", "source_era": "740年", "source_location": "终南山的溪边"}

# Now process this signal:
Signal: "${userInput}"

Output only valid JSON with reply, source_name, source_era, and source_location.`;

    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // 提取 JSON（处理可能的 markdown 代码块）
      let jsonText = text.trim();
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
      console.error("Gemini API error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw new Error(`Failed to generate match with Gemini: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
