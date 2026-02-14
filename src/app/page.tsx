"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsSubmitting(true);

    const parts = input.trim().split("/");
    const signal = parts[0].trim();
    const name = parts[1]?.trim() || "";
    const location = parts[2]?.trim() || "";

    const params = new URLSearchParams({ signal });
    if (name) params.set("name", name);
    if (location) params.set("location", location);

    router.push(`/result?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col" style={{ background: "#EBE9E2" }}>
      {/* Header */}
      <header className="px-6 pt-7 sm:px-8 sm:pt-8">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-[3px] h-[12px] rounded-[1px] relative -top-[1px] ml-[2px]"
            style={{ background: "rgba(217,44,61,0.8)" }}
          />
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

      {/* Centered input area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="写下此刻你的想法和感受/你叫什么/你在哪"
            disabled={isSubmitting}
            className="w-full max-w-[413px] h-[180px] text-[16px] font-bold leading-[1.2] px-[42px] pt-10 rounded-lg transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-noto-serif-sc), 'Noto Serif SC', serif",
              color: "#1f1f1f",
              background: "#FBFBFB",
              border: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              resize: "none",
              outline: "none",
            }}
            onFocus={() => {}}
            onBlur={() => {}}
          />

          {/* Button */}
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={!input.trim() || isSubmitting}
              className="text-[13px] tracking-[0.1em] rounded-full transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-100"
              style={{
                fontFamily: "var(--font-noto-sans-sc), 'Noto Sans SC', sans-serif",
                color: "#fff",
                border: "none",
                background: "#1e1e1e",
                width: "120px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              onMouseOver={(e) => {
                if (input.trim() && !isSubmitting) e.currentTarget.style.background = "#333";
              }}
              onMouseOut={(e) => {
                if (input.trim() && !isSubmitting) e.currentTarget.style.background = "#1e1e1e";
              }}
            >
              {isSubmitting ? "发送中..." : "发送"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
