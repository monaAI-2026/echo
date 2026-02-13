import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";

export async function GET() {
  const envCheck = {
    AI_PROVIDER: process.env.AI_PROVIDER || "(not set)",
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "✅ set" : "❌ missing",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "✅ set" : "❌ missing",
  };

  const results: Record<string, string> = {};

  // Test Gemini
  try {
    const gemini = getAIProvider("gemini");
    await gemini.generateMatch("测试");
    results.gemini = "✅ success";
  } catch (error) {
    results.gemini = `❌ ${error instanceof Error ? error.message : String(error)}`;
  }

  // Test Claude
  try {
    const claude = getAIProvider("claude");
    await claude.generateMatch("测试");
    results.claude = "✅ success";
  } catch (error) {
    results.claude = `❌ ${error instanceof Error ? error.message : String(error)}`;
  }

  return NextResponse.json({ env: envCheck, providers: results });
}
