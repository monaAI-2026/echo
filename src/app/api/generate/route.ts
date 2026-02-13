import { NextRequest, NextResponse } from "next/server";
import { generateMatchWithFallback } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const trimmedInput = input.trim();

    // 使用带降级的 AI 调用
    const { result, usedProvider } = await generateMatchWithFallback(
      trimmedInput
    );

    const duration = Date.now() - startTime;
    console.log(
      `[generate] provider=${usedProvider}, time=${duration}ms, input="${trimmedInput.slice(0, 50)}", reply="${result.quote?.slice(0, 30)}"`
    );

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        provider: usedProvider,
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[generate] FAILED, time=${duration}ms, error:`, error);

    return NextResponse.json(
      {
        error: "Failed to generate poem match",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
