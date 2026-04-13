// 아이콘 생성 스크립트 (Canvas API 사용)
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, "../public/icons");

mkdirSync(ICONS_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of SIZES) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // 배경
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#1e3a8a");
  grad.addColorStop(1, "#2563eb");
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // 텍스트 (신문 아이콘 느낌)
  const fontSize = Math.floor(size * 0.42);
  ctx.font = `bold ${fontSize}px serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("사", size / 2, size * 0.44);

  const subSize = Math.floor(size * 0.16);
  ctx.font = `${subSize}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("분석기", size / 2, size * 0.78);

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(join(ICONS_DIR, `icon-${size}x${size}.png`), buffer);
  console.log(`✓ icon-${size}x${size}.png`);
}

console.log("아이콘 생성 완료!");
