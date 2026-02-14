export interface DrawCardProps {
  userSignal: string;
  userName: string;
  userTime: string;
  userLocation: string;
  quote: string;
  authorName: string;
  era: string;
  location: string;
}

function formatEra(era: string): string {
  const bcMatch = era.match(/^公元前(\d+)年$/);
  if (bcMatch) return `公元前${bcMatch[1]}`;
  const yearMatch = era.match(/^(\d{3,4})年$/);
  if (yearMatch) return yearMatch[1];
  const decadeMatch = era.match(/^(\d{3,4})年代$/);
  if (decadeMatch) return `${decadeMatch[1]}s`;
  return era;
}

const PUNCTUATION = new Set([
  "，", "。", "！", "？", "、", "；", "：", "…",
  "\u201C", "\u201D", "）", "】", "》", "·", "～", "—",
]);

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let currentLine = "";
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const testLine = currentLine + char;
    const w = ctx.measureText(testLine).width;
    if (w > maxWidth && currentLine) {
      if (PUNCTUATION.has(char) && w <= maxWidth + MAX_OVERFLOW) {
        currentLine = testLine;
      } else if (i + 1 < chars.length && PUNCTUATION.has(chars[i + 1])) {
        const combinedWidth = ctx.measureText(testLine + chars[i + 1]).width;
        if (combinedWidth <= maxWidth + MAX_OVERFLOW) {
          currentLine = testLine + chars[i + 1];
          i++;
        } else {
          lines.push(currentLine);
          currentLine = char;
        }
      } else {
        lines.push(currentLine);
        currentLine = char;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawPulseWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number
): void {
  const scaleX = width / 260;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, 1);

  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(95, 12);
  ctx.quadraticCurveTo(100, 12, 102, 10);
  ctx.quadraticCurveTo(106, 6, 108, 8);
  ctx.lineTo(112, 14);
  ctx.quadraticCurveTo(114, 18, 116, 12);
  ctx.lineTo(120, 2);
  ctx.quadraticCurveTo(121, 0, 122, 2);
  ctx.lineTo(126, 22);
  ctx.quadraticCurveTo(127, 24, 128, 22);
  ctx.lineTo(132, 6);
  ctx.quadraticCurveTo(134, 0, 136, 6);
  ctx.lineTo(138, 12);
  ctx.quadraticCurveTo(140, 16, 142, 14);
  ctx.lineTo(144, 10);
  ctx.quadraticCurveTo(146, 8, 148, 12);
  ctx.lineTo(260, 12);

  ctx.strokeStyle = "rgba(221,221,221,0.7)";
  ctx.lineWidth = 0.7 / scaleX;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.restore();
}

// Card layout constants
const MAX_OVERFLOW = 25.8 * 0.6; // ~15.5px – punctuation overflow ceiling
const W = 340;
const PX = 38;
const CW = W - PX * 2; // 264
const PT = 60;
const PB = 62;
const LABEL_H = 11;
const LABEL_MB = 20;
const MAIN_LH = 25.8 * 1.2; // 30.96
const INFO_MT = 16;
const INFO_H = 10;
const DIV_MT = 42;
const DIV_H = 24;
const DIV_MB = 36;

function getFonts() {
  const style = getComputedStyle(document.body);
  const jinghua =
    style.getPropertyValue("--font-jinghua").trim() || "'JingHua LaoSong'";
  const courier =
    style.getPropertyValue("--font-courier-prime").trim() || "'Courier Prime'";
  const noto =
    style.getPropertyValue("--font-noto-sans-sc").trim() || "'Noto Sans SC'";
  return { jinghua, courier, noto };
}

function makeFontStrings(fonts: { jinghua: string; courier: string; noto: string }) {
  return {
    labelZh: `10px ${fonts.jinghua}, serif`,
    labelEn: `11px ${fonts.courier}, monospace`,
    main: `bold 25.8px ${fonts.jinghua}, serif`,
    info: `10px ${fonts.noto}, sans-serif`,
  };
}

/** Draw the card onto a context (already scaled). Returns logical height. */
function drawCard(ctx: CanvasRenderingContext2D, props: DrawCardProps): number {
  const fonts = getFonts();
  const f = makeFontStrings(fonts);

  // Pre-calculate text wrapping
  const tmp = document.createElement("canvas").getContext("2d")!;
  tmp.font = f.main;
  const lines1 = wrapText(tmp, props.userSignal, CW);
  const lines2 = wrapText(tmp, props.quote, CW);

  const sectionH = (n: number) =>
    LABEL_H + LABEL_MB + n * MAIN_LH + INFO_MT + INFO_H;
  const H =
    PT + sectionH(lines1.length) + DIV_MT + DIV_H + DIV_MB + sectionH(lines2.length) + PB;

  // Background
  ctx.fillStyle = "#FBFBFB";
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "top";
  let y = PT;

  // ===== SECTION 1: User Signal =====
  ctx.fillStyle = "#bbb";
  ctx.font = f.labelZh;
  const zhW1 = ctx.measureText("念头").width;
  ctx.fillText("念头", PX, y);
  ctx.font = f.labelEn;
  ctx.fillText("SIGNAL", PX + zhW1 + 4, y);
  y += LABEL_H + LABEL_MB;

  ctx.fillStyle = "#1f1f1f";
  ctx.font = f.main;
  for (const line of lines1) {
    ctx.fillText(line, PX, y);
    y += MAIN_LH;
  }

  y += INFO_MT;
  ctx.fillStyle = "rgba(217,44,61,0.65)";
  ctx.font = f.info;
  const userInfoParts = [props.userName, props.userTime];
  if (props.userLocation) {
    userInfoParts.push(props.userLocation);
  }
  ctx.fillText(userInfoParts.join(" / "), PX, y);
  y += INFO_H;

  // ===== DIVIDER =====
  y += DIV_MT;
  drawPulseWave(ctx, PX, y, CW);
  y += DIV_H + DIV_MB;

  // ===== SECTION 2: Quote =====
  ctx.fillStyle = "#bbb";
  ctx.font = f.labelZh;
  const zhW2 = ctx.measureText("回响").width;
  ctx.fillText("回响", PX, y);
  ctx.font = f.labelEn;
  ctx.fillText("ECHO", PX + zhW2 + 4, y);
  y += LABEL_H + LABEL_MB;

  ctx.fillStyle = "#1f1f1f";
  ctx.font = f.main;
  for (const line of lines2) {
    ctx.fillText(line, PX, y);
    y += MAIN_LH;
  }

  y += INFO_MT;
  ctx.fillStyle = "rgba(217,44,61,0.65)";
  ctx.font = f.info;
  ctx.fillText(
    `${props.authorName} / ${formatEra(props.era)} / ${props.location}`,
    PX,
    y
  );

  return H;
}

/** Calculate card height without drawing */
export function getCardHeight(props: DrawCardProps): number {
  const fonts = getFonts();
  const f = makeFontStrings(fonts);

  const tmp = document.createElement("canvas").getContext("2d")!;
  tmp.font = f.main;
  const lines1 = wrapText(tmp, props.userSignal, CW);
  const lines2 = wrapText(tmp, props.quote, CW);

  const sectionH = (n: number) =>
    LABEL_H + LABEL_MB + n * MAIN_LH + INFO_MT + INFO_H;
  return (
    PT + sectionH(lines1.length) + DIV_MT + DIV_H + DIV_MB + sectionH(lines2.length) + PB
  );
}

/** Render card to an offscreen canvas at given scale */
export async function renderCardToCanvas(
  props: DrawCardProps,
  scale: number = 5
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const fonts = getFonts();
  const f = makeFontStrings(fonts);

  // Pre-calculate height
  const tmp = document.createElement("canvas").getContext("2d")!;
  tmp.font = f.main;
  const lines1 = wrapText(tmp, props.userSignal, CW);
  const lines2 = wrapText(tmp, props.quote, CW);
  const sectionH = (n: number) =>
    LABEL_H + LABEL_MB + n * MAIN_LH + INFO_MT + INFO_H;
  const H =
    PT + sectionH(lines1.length) + DIV_MT + DIV_H + DIV_MB + sectionH(lines2.length) + PB;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  drawCard(ctx, props);

  return canvas;
}

/** Card logical width (constant) */
export const CARD_WIDTH = W;
