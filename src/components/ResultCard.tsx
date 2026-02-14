"use client";

import { useEffect, useRef, useState } from "react";
import { renderCardToCanvas, CARD_WIDTH } from "@/lib/draw-card";
import type { DrawCardProps } from "@/lib/draw-card";

interface ResultCardProps extends DrawCardProps {
  yearSpan: number;
}

export default function ResultCard({
  userSignal,
  userName,
  userTime,
  userLocation,
  quote,
  authorName,
  era,
  location,
}: ResultCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [height, setHeight] = useState(0);

  const drawProps: DrawCardProps = {
    userSignal,
    userName,
    userTime,
    userLocation,
    quote,
    authorName,
    era,
    location,
  };

  useEffect(() => {
    async function render() {
      const dpr = window.devicePixelRatio || 1;
      const offscreen = await renderCardToCanvas(drawProps, dpr);
      const logicalH = offscreen.height / dpr;
      setHeight(logicalH);

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = offscreen.width;
      canvas.height = offscreen.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(offscreen, 0, 0);
    }
    render();
  }, [userSignal, userName, userTime, userLocation, quote, authorName, era, location]);

  return (
    <div
      id="result-card"
      className="w-full max-w-[340px] rounded-none overflow-hidden transition-all duration-300 ease-out cursor-default mx-auto"
      style={{
        background: "#FBFBFB",
        border: "none",
        boxShadow: isHovered ? "0 8px 28px rgba(0,0,0,0.04)" : "0 4px 16px rgba(0,0,0,0.06)",
        transform: isHovered ? "scale(1.01) translateY(-2px)" : "scale(1) translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${CARD_WIDTH}px`,
          height: height ? `${height}px` : "auto",
          display: "block",
        }}
      />
    </div>
  );
}
