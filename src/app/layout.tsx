import type { Metadata } from "next";
import { Noto_Sans_SC, Courier_Prime } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-sc",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
});

const jinghuaLaoSong = localFont({
  src: "../../public/fonts/jinghua-laosong.ttf",
  variable: "--font-jinghua",
  display: "swap",
});

export const metadata: Metadata = {
  title: "回响 Echo",
  description: "跨越时空的共鸣",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${notoSansSC.variable} ${courierPrime.variable} ${jinghuaLaoSong.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
