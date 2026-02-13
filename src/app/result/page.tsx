"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResultCard from "@/components/ResultCard";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";
import { renderCardToCanvas } from "@/lib/draw-card";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] flex flex-col items-center justify-center" style={{ background: "#EBE9E2" }}>
          <div className="flex flex-col items-center gap-5" style={{ transform: "scale(1.1) translateY(-20px)" }}>
            <div className="flex items-center gap-[3.6px] h-6">
              {[9.6, 14.4, 19.2, 14.4, 9.6].map((h, i) => (
                <div
                  key={i}
                  className="w-[2.4px] rounded-full"
                  style={{
                    height: `${h}px`,
                    background: "rgba(217,44,61,0.85)",
                    animation: "wave 1s ease-in-out infinite",
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
            <p
              className="text-[11px] tracking-[0.25em] pl-[0.25em]"
              style={{ fontFamily: "'Noto Sans SC', sans-serif", color: "rgba(0,0,0,0.25)" }}
            >
              正在寻找回响
            </p>
          </div>
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}

const DEFAULT_PAIRS = [
  { name: "碳基生物", location: "银河系第三旋臂" },
  { name: "第 42 号观测员", location: "蓝色行星表面" },
  { name: "未命名角色", location: "故事的第 1 页" },
  { name: "某位路人甲", location: "历史的背景板里" },
  { name: "某人", location: "世界的角落" },
  { name: "发信人", location: "北纬30度" },
  { name: "代号 K", location: "未知频段" },
];

const ALL_LOCATIONS = DEFAULT_PAIRS.map((p) => p.location);

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("信号传输中");

  const userSignal = searchParams.get("signal") || "今天终于完成了毕设了，太难了！";
  const paramName = searchParams.get("name") || "";
  const paramLocation = searchParams.get("location") || "";

  const [userIdentity] = useState(() => {
    if (paramName && paramLocation) {
      return { name: paramName, location: paramLocation };
    }
    if (paramName) {
      return { name: paramName, location: getRandomItem(ALL_LOCATIONS) };
    }
    const pair = getRandomItem(DEFAULT_PAIRS);
    return { name: pair.name, location: pair.location };
  });

  const [result, setResult] = useState({
    quote: "",
    authorName: "",
    era: "",
    location: "",
    yearSpan: 0,
  });

  const now = new Date();
  const userTime = `${now.getFullYear()}`;

  useEffect(() => {
    let isCancelled = false;

    const loadingMessages = [
      "信号传输中",
      "正在寻找回响",
      "收到来自远方的信号",
      "正在解读这段频率",
      "共鸣即将抵达",
    ];
    let messageIndex = 0;

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 4000);

    async function generateMatch() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetchWithRetry("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input: userSignal }),
          timeout: 60000,
          retries: 1,
          retryDelay: 2000,
        });

        if (isCancelled) return;

        if (!response.ok) {
          throw new Error("Failed to generate match");
        }

        const data = await response.json();

        if (data.success) {
          setResult(data.data);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err) {
        if (isCancelled) return;
        console.error("Generate error:", err);
        setError(err instanceof Error ? err.message : "生成失败，请重试");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    generateMatch();

    return () => {
      isCancelled = true;
      clearInterval(messageInterval);
    };
  }, [userSignal]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const canvas = await renderCardToCanvas({
        userSignal,
        userName: userIdentity.name,
        userTime,
        userLocation: userIdentity.location,
        quote: result.quote,
        authorName: result.authorName,
        era: result.era,
        location: result.location,
      }, 5);

      const link = document.createElement("a");
      link.download = `echo-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = () => {
    router.push("/");
  };

  // Loading state — wave loader
  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col" style={{ background: "#EBE9E2" }}>
        {/* Header */}
        <header className="px-6 pt-7 sm:px-8 sm:pt-8">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[15px]"
              style={{ fontFamily: "var(--font-jinghua), 'JingHua LaoSong', serif", color: "#1f1f1f" }}
            >
              回响
            </span>
            <span
              className="text-[13px] tracking-[0.2em]"
              style={{ fontFamily: "var(--font-courier-prime), 'Courier Prime', monospace", color: "#bbb" }}
            >
              ECHO
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-5" style={{ transform: "scale(1.1) translateY(-20px)" }}>
            {/* Wave loader */}
            <div className="flex items-center gap-[3.6px] h-6">
              {[9.6, 14.4, 19.2, 14.4, 9.6].map((h, i) => (
                <div
                  key={i}
                  className="w-[2.4px] rounded-full"
                  style={{
                    height: `${h}px`,
                    background: "rgba(217,44,61,0.85)",
                    animation: "wave 1s ease-in-out infinite",
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>

            {/* Status text */}
            <p
              className="text-[11px] tracking-[0.25em] pl-[0.25em]"
              style={{ fontFamily: "var(--font-noto-sans-sc), 'Noto Sans SC', sans-serif", color: "rgba(0,0,0,0.45)" }}
            >
              {loadingMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center px-6" style={{ background: "#EBE9E2" }}>
        <div className="flex flex-col items-center gap-6 max-w-md">
          <div className="text-center">
            <p
              className="text-lg mb-2"
              style={{ fontFamily: "var(--font-jinghua), 'JingHua LaoSong', serif", color: "#1f1f1f" }}
            >
              获取回响失败
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="text-[11px] tracking-[0.1em] px-5 py-2 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              fontFamily: "var(--font-noto-sans-sc), 'Noto Sans SC', sans-serif",
              color: "#999",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
              e.currentTarget.style.color = "#666";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.color = "#999";
            }}
          >
            重新发送
          </button>
        </div>
      </div>
    );
  }

  // Result state
  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#EBE9E2" }}>
      {/* Header */}
      <header className="px-6 pt-7 sm:px-8 sm:pt-8">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[15px]"
            style={{ fontFamily: "var(--font-jinghua), 'JingHua LaoSong', serif", color: "#1f1f1f" }}
          >
            回响
          </span>
          <span
            className="text-[13px] tracking-[0.2em]"
            style={{ fontFamily: "var(--font-courier-prime), 'Courier Prime', monospace", color: "#bbb" }}
          >
            ECHO
          </span>
        </div>
      </header>

      {/* Result content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full">
          <ResultCard
            userSignal={userSignal}
            userName={userIdentity.name}
            userTime={userTime}
            userLocation={userIdentity.location}
            quote={result.quote}
            authorName={result.authorName}
            era={result.era}
            location={result.location}
            yearSpan={result.yearSpan}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            className="text-[11px] tracking-[0.1em] px-5 py-2 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center"
            style={{
              fontFamily: "var(--font-noto-sans-sc), 'Noto Sans SC', sans-serif",
              color: "#666",
              border: "1px solid rgba(0,0,0,0.15)",
            }}
            onClick={handleRetry}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.3)";
              e.currentTarget.style.color = "#444";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
              e.currentTarget.style.color = "#666";
            }}
          >
            回到首页
          </button>
          <button
            className="text-[11px] tracking-[0.1em] px-5 py-2 rounded-full transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              fontFamily: "var(--font-noto-sans-sc), 'Noto Sans SC', sans-serif",
              color: "#D92C3D",
              border: "1px solid rgba(217,44,61,0.3)",
            }}
            onClick={handleDownload}
            disabled={isDownloading}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(217,44,61,0.04)";
              e.currentTarget.style.borderColor = "rgba(217,44,61,0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(217,44,61,0.3)";
            }}
          >
            {isDownloading ? "下载中..." : "下载卡片"}
          </button>
        </div>
      </div>
    </div>
  );
}
