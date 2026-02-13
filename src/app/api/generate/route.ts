import { NextRequest, NextResponse } from "next/server";
import { generateMatchWithFallback } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // 使用带降级的 AI 调用
    const { result, usedProvider } = await generateMatchWithFallback(
      input.trim()
    );

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        provider: usedProvider,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Generate API error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate poem match",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
