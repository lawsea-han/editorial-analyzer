import { execFile } from "node:child_process";
import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(repoRoot, "output", `study-animation-${stamp}`);
const sceneDir = path.join(outDir, "scenes");
const clipDir = path.join(outDir, "clips");
const width = 1920;
const height = 1080;
const fps = 24;
const speechRate = 3;

const scenes = [
  {
    title: "8시간 앉아도 기억이 안 나는 이유",
    eyebrow: "공부법 리셋",
    visual: "desk",
    accent: "#f4c430",
    bullets: ["오래 앉아 있기", "형광펜만 긋기", "다시 보면 알 것 같은 착각"],
    narration:
      "하루 종일 책상에 앉아 있었는데, 다음 날 머릿속이 하얘진 경험 있나요? 문제는 의지가 약해서가 아닙니다. 우리 뇌가 기억을 저장하는 방식과, 우리가 공부하는 방식이 서로 어긋나 있을 때 이런 일이 생깁니다. 오늘은 공부 시간을 늘리는 이야기가 아니라, 같은 시간을 써도 뇌가 더 잘 기억하게 만드는 다섯 가지 방법을 정리해 보겠습니다.",
  },
  {
    title: "첫 번째, 읽지 말고 꺼내세요",
    eyebrow: "방법 1",
    visual: "brain",
    accent: "#ff7a59",
    bullets: ["책을 덮기", "방금 본 내용 말하기", "기억 구멍 찾기"],
    narration:
      "첫 번째는 꺼내기입니다. 많은 사람이 책을 계속 읽으면 기억이 쌓인다고 생각하지만, 실제로 기억을 강하게 만드는 순간은 다시 읽는 순간보다 떠올리려고 애쓰는 순간에 가깝습니다. 한 페이지를 읽었다면 책을 덮고, 방금 본 내용을 세 문장으로 말해 보세요. 막히는 지점이 바로 진짜 공부해야 할 지점입니다.",
  },
  {
    title: "두 번째, 25분만 진짜로 집중하세요",
    eyebrow: "방법 2",
    visual: "timer",
    accent: "#5fb3f3",
    bullets: ["타이머 25분", "휴대폰 뒤집기", "끝나면 5분 쉬기"],
    narration:
      "두 번째는 짧고 선명한 집중입니다. 공부 효율이 낮은 날을 보면 책상에는 앉아 있지만, 휴대폰을 보고, 메시지를 확인하고, 중간중간 딴생각을 하느라 집중이 계속 끊깁니다. 처음부터 네 시간을 버티려고 하지 마세요. 타이머를 25분으로 맞추고, 그 시간에는 한 가지 과목, 한 가지 목표만 잡습니다. 짧아서 만만하지만, 제대로 하면 생각보다 강합니다.",
  },
  {
    title: "세 번째, 복습은 바로 하지 말고 간격을 두세요",
    eyebrow: "방법 3",
    visual: "calendar",
    accent: "#77c66e",
    bullets: ["10분 뒤", "하루 뒤", "3일 뒤"],
    narration:
      "세 번째는 간격 복습입니다. 방금 배운 내용을 바로 다시 보면 익숙해서 아는 것처럼 느껴집니다. 하지만 익숙함은 기억과 다릅니다. 조금 잊어버린 뒤 다시 꺼내야 기억 회로가 더 단단해집니다. 오늘 공부한 내용은 10분 뒤에 한 번, 내일 한 번, 3일 뒤에 한 번 짧게 확인해 보세요. 복습 시간은 길 필요가 없습니다. 중요한 건 타이밍입니다.",
  },
  {
    title: "네 번째, 문제를 먼저 보면 뇌가 깨어납니다",
    eyebrow: "방법 4",
    visual: "quiz",
    accent: "#f56f8f",
    bullets: ["문제 훑기", "무엇을 모르는지 보기", "그다음 개념 읽기"],
    narration:
      "네 번째는 문제를 먼저 보는 것입니다. 많은 학생이 개념을 완벽하게 이해한 뒤 문제를 풀려고 하지만, 그러면 시작이 너무 늦어집니다. 오히려 문제를 먼저 보면 뇌가 질문을 갖고 개념을 읽기 시작합니다. 정답을 맞히라는 뜻이 아닙니다. 지금 무엇을 모르고, 어떤 표현이 반복되는지 보는 겁니다. 질문이 생긴 상태에서 읽는 개념은 훨씬 잘 붙습니다.",
  },
  {
    title: "다섯 번째, 공부 끝에는 1분 요약을 남기세요",
    eyebrow: "방법 5",
    visual: "note",
    accent: "#9d7cf5",
    bullets: ["오늘 배운 핵심", "아직 헷갈리는 것", "내일 볼 첫 문제"],
    narration:
      "다섯 번째는 1분 요약입니다. 공부가 끝났을 때 바로 책을 덮고 일어나면, 뇌는 오늘 배운 정보를 정리할 기회를 놓칩니다. 마지막 1분만 남겨서 세 줄을 적어 보세요. 오늘 배운 핵심 하나, 아직 헷갈리는 것 하나, 내일 다시 볼 첫 문제 하나. 이 작은 마무리가 다음 공부의 시작 속도를 확 바꿉니다.",
  },
  {
    title: "공부 잘하는 사람은 오래 버티는 사람이 아닙니다",
    eyebrow: "핵심 정리",
    visual: "split",
    accent: "#f4c430",
    bullets: ["오래 앉기보다", "기억나게 설계하기", "반복보다 회상하기"],
    narration:
      "여기서 중요한 건 공부를 더 고통스럽게 만들지 않는 것입니다. 공부를 잘하는 사람은 무조건 오래 버티는 사람이 아니라, 뇌가 기억하기 좋은 조건을 만드는 사람입니다. 읽고, 덮고, 떠올리고, 틀리고, 다시 확인하는 과정을 짧게 반복하세요. 그러면 같은 40분도 훨씬 진하게 남습니다.",
  },
  {
    title: "오늘 바로 해볼 40분 루틴",
    eyebrow: "실전 루틴",
    visual: "routine",
    accent: "#2dbf9f",
    bullets: ["5분: 문제 훑기", "25분: 개념 집중", "10분: 책 덮고 회상"],
    narration:
      "바로 써먹고 싶다면 이렇게 해 보세요. 먼저 5분 동안 문제를 훑으면서 오늘 무엇을 알아야 하는지 봅니다. 그다음 25분 동안 개념을 읽고 예시를 확인합니다. 마지막 10분은 책을 덮고 빈 종이에 기억나는 내용을 씁니다. 많이 쓰는 것이 목표가 아닙니다. 내가 진짜로 기억한 것과 기억하지 못한 것을 구분하는 것이 목표입니다.",
  },
  {
    title: "절대 하지 말아야 할 함정",
    eyebrow: "주의",
    visual: "warning",
    accent: "#ef4444",
    bullets: ["완벽해질 때까지 미루기", "예쁜 정리만 하기", "공부 시간만 세기"],
    narration:
      "반대로 피해야 할 함정도 있습니다. 완벽하게 이해한 뒤 문제를 풀겠다고 미루는 것, 노트를 예쁘게 꾸미는 데 에너지를 다 쓰는 것, 공부 시간을 숫자로만 세는 것입니다. 뇌는 예쁜 노트보다, 힘들게 떠올린 정보에 더 강하게 반응합니다. 오늘부터는 시간을 기록하기보다, 내가 무엇을 꺼낼 수 있었는지를 확인해 보세요.",
  },
  {
    title: "3일만 해보면 차이가 보입니다",
    eyebrow: "작은 실험",
    visual: "threeDays",
    accent: "#ffb703",
    bullets: ["1일차: 루틴 익히기", "2일차: 간격 복습", "3일차: 설명해보기"],
    narration:
      "이 방법은 거창하게 시작할 필요가 없습니다. 3일만 실험해 보세요. 첫날은 40분 루틴을 한 번 해보고, 둘째 날은 전날 내용을 10분만 복습하고, 셋째 날은 누군가에게 설명하듯 말해 봅니다. 설명이 막히는 부분은 실패가 아니라 지도입니다. 어디를 다시 보면 되는지 알려주는 표시니까요.",
  },
  {
    title: "결론: 공부는 입력보다 출력입니다",
    eyebrow: "마지막 한 문장",
    visual: "brainBoost",
    accent: "#38bdf8",
    bullets: ["읽기보다 떠올리기", "오래보다 선명하게", "반복보다 간격 있게"],
    narration:
      "정리하겠습니다. 공부는 많이 넣는 게임이 아니라, 필요할 때 꺼낼 수 있게 만드는 게임입니다. 읽기보다 떠올리기, 오래보다 선명하게, 반복보다 간격 있게. 이 세 가지만 기억해도 공부 방식은 달라집니다. 오늘 공부할 내용 하나를 정하고, 책을 덮은 뒤 3문장으로 설명해 보세요. 그 순간부터 뇌는 조금 다르게 일하기 시작합니다.",
  },
  {
    title: "오늘의 미션",
    eyebrow: "저장하고 따라하기",
    visual: "mission",
    accent: "#22c55e",
    bullets: ["책 덮고 3문장", "내일 10분 복습", "3일 뒤 다시 확인"],
    narration:
      "오늘의 미션입니다. 공부를 시작하기 전에 문제를 먼저 보고, 공부가 끝나면 책을 덮고 3문장으로 말해 보세요. 그리고 내일 10분만 다시 꺼내 보세요. 공부가 쉬워진다기보다, 공부가 어디서 막히는지 선명해질 겁니다. 그 선명함이 성적을 바꾸는 출발점입니다.",
  },
];

const fullNarration = scenes.map((scene) => `${scene.eyebrow}. ${scene.title}. ${scene.narration}`).join("\n\n");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if ([...next].length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function multilineText(text, x, y, size, fill, maxChars, weight = 800, lineHeight = 1.25) {
  const lines = wrapText(text, maxChars);
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${tspans}</text>`;
}

function bubble(x, y, w, h, fill = "#fff8df", stroke = "#1f2937") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="38" fill="${fill}" stroke="${stroke}" stroke-width="8"/>`;
}

function character(x, y, shirt = "#f97316", pose = "desk") {
  const arm = pose === "think" ? `<path d="M${x + 138} ${y + 245} C${x + 195} ${y + 215},${x + 208} ${y + 170},${x + 170} ${y + 145}" stroke="#1f2937" stroke-width="18" fill="none" stroke-linecap="round"/>` : `<path d="M${x + 138} ${y + 245} C${x + 205} ${y + 260},${x + 248} ${y + 286},${x + 290} ${y + 320}" stroke="#1f2937" stroke-width="18" fill="none" stroke-linecap="round"/>`;
  return `
    <g transform="translate(${x} ${y})">
      <path d="M80 385 C74 285,90 230,145 210 C208 185,285 210,310 285 C332 352,295 420,198 432 C132 440,92 425,80 385Z" fill="${shirt}" stroke="#1f2937" stroke-width="8"/>
      <circle cx="190" cy="122" r="92" fill="#fffdf7" stroke="#1f2937" stroke-width="8"/>
      <circle cx="158" cy="115" r="8" fill="#1f2937"/>
      <circle cx="222" cy="115" r="8" fill="#1f2937"/>
      <path d="M165 154 C186 169,209 169,229 154" fill="none" stroke="#1f2937" stroke-width="7" stroke-linecap="round"/>
      ${arm}
      <path d="M90 252 C45 275,28 330,58 365" stroke="#1f2937" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M120 430 C85 505,85 575,125 635" stroke="#1f2937" stroke-width="20" fill="none" stroke-linecap="round"/>
      <path d="M245 430 C305 493,330 555,310 635" stroke="#1f2937" stroke-width="20" fill="none" stroke-linecap="round"/>
    </g>`;
}

function iconFor(visual, x, y, accent) {
  if (visual === "timer") {
    return `<g transform="translate(${x} ${y})"><circle cx="160" cy="160" r="130" fill="#fffdf7" stroke="#1f2937" stroke-width="10"/><path d="M160 160 L160 72 M160 160 L235 190" stroke="${accent}" stroke-width="16" stroke-linecap="round"/><text x="160" y="360" text-anchor="middle" font-size="54" font-weight="900" fill="#1f2937">25분</text></g>`;
  }
  if (visual === "calendar" || visual === "threeDays") {
    return `<g transform="translate(${x} ${y})">${bubble(0, 30, 360, 270, "#fffdf7")}<rect x="0" y="30" width="360" height="82" rx="32" fill="${accent}" stroke="#1f2937" stroke-width="8"/><text x="180" y="210" text-anchor="middle" font-size="96" font-weight="900" fill="#1f2937">${visual === "threeDays" ? "3일" : "복습"}</text><path d="M65 0 V60 M295 0 V60" stroke="#1f2937" stroke-width="20" stroke-linecap="round"/></g>`;
  }
  if (visual === "quiz") {
    return `<g transform="translate(${x} ${y})">${bubble(0, 0, 390, 320, "#fffdf7")}<text x="195" y="145" text-anchor="middle" font-size="150" font-weight="900" fill="${accent}">?</text><path d="M80 230 H310 M80 270 H250" stroke="#1f2937" stroke-width="16" stroke-linecap="round"/></g>`;
  }
  if (visual === "warning") {
    return `<g transform="translate(${x} ${y})"><path d="M190 0 L380 330 H0 Z" fill="#fff1f2" stroke="#1f2937" stroke-width="10"/><text x="190" y="240" text-anchor="middle" font-size="210" font-weight="900" fill="${accent}">!</text></g>`;
  }
  return `<g transform="translate(${x} ${y})"><path d="M60 210 C10 110,80 20,190 20 C310 20,380 105,330 215 C300 280,240 300,190 300 C135 300,92 280,60 210Z" fill="#fffdf7" stroke="#1f2937" stroke-width="10"/><path d="M110 155 C150 120,200 125,222 165 C246 120,306 135,315 190" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><path d="M190 300 V380" stroke="#1f2937" stroke-width="18" stroke-linecap="round"/><circle cx="190" cy="418" r="32" fill="${accent}" stroke="#1f2937" stroke-width="8"/></g>`;
}

function sceneSvg(scene, index) {
  const bg = index % 2 === 0 ? "#f3ead7" : "#e5f0f6";
  const shirt = ["#f97316", "#84cc16", "#06b6d4", "#f472b6", "#a78bfa"][index % 5];
  const bulletItems = scene.bullets
    .map((item, i) => `<g transform="translate(0 ${i * 92})"><circle cx="24" cy="0" r="18" fill="${scene.accent}" stroke="#1f2937" stroke-width="5"/><text x="62" y="14" font-size="48" font-weight="800" fill="#1f2937">${escapeXml(item)}</text></g>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; paint-order: stroke; }
    .scribble { fill: none; stroke: #1f2937; stroke-width: 5; stroke-linecap: round; opacity: .18; }
  </style>
  <rect width="1920" height="1080" fill="${bg}"/>
  <path class="scribble" d="M76 172 C240 120,342 240,508 188 S850 132,990 214"/>
  <path class="scribble" d="M1160 840 C1310 790,1470 910,1838 808"/>
  <circle cx="1700" cy="170" r="110" fill="#fffdf7" stroke="#1f2937" stroke-width="8"/>
  <path d="M1700 170 L1700 98 M1700 170 L1755 195" stroke="#1f2937" stroke-width="10" stroke-linecap="round"/>
  <text x="1700" y="320" text-anchor="middle" font-size="48" font-weight="900" fill="${scene.accent}">FOCUS</text>
  <rect x="90" y="74" width="420" height="88" rx="44" fill="${scene.accent}" stroke="#1f2937" stroke-width="7"/>
  <text x="300" y="135" text-anchor="middle" font-size="48" font-weight="900" fill="#111827">${escapeXml(scene.eyebrow)}</text>
  ${multilineText(scene.title, 92, 282, 86, "#111827", 16, 900, 1.15)}
  <g transform="translate(120 590)">${bulletItems}</g>
  ${character(1110, 520, shirt, index % 3 === 0 ? "think" : "desk")}
  ${iconFor(scene.visual, 1160, 155, scene.accent)}
  <rect x="970" y="890" width="780" height="72" rx="36" fill="#111827" opacity=".92"/>
  <text x="1360" y="941" text-anchor="middle" font-size="38" font-weight="900" fill="#fffdf7">공부는 오래보다, 기억나게 설계하는 것</text>
  <text x="92" y="1014" font-size="34" font-weight="800" fill="#475569">original explainer animation / 5-minute study routine</text>
</svg>`;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, { windowsHide: true, ...options }, (error, stdout, stderr) => {
      if (error) {
        error.message += `\n${stderr}`;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  });
}

async function synthesizeNarration(textPath, wavPath, psPath) {
  const ps = `
param([string]$TextPath, [string]$WavPath)
Add-Type -AssemblyName System.Speech
$text = Get-Content -Raw -Encoding UTF8 $TextPath
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft Heami Desktop')
$speaker.Rate = ${speechRate}
$speaker.Volume = 100
$speaker.SetOutputToWaveFile($WavPath)
$speaker.Speak($text)
$speaker.Dispose()
`;
  await writeFile(psPath, ps, "utf8");
  await run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psPath, textPath, wavPath]);
}

async function wavDurationSeconds(wavPath) {
  const buf = await readFile(wavPath);
  const byteRate = buf.readUInt32LE(28);
  const dataIndex = buf.indexOf(Buffer.from("data"));
  if (byteRate <= 0 || dataIndex < 0) return 300;
  const dataSize = buf.readUInt32LE(dataIndex + 4);
  return dataSize / byteRate;
}

async function renderScenePngs() {
  const pngs = [];
  for (const [index, scene] of scenes.entries()) {
    const svg = sceneSvg(scene, index);
    const svgPath = path.join(sceneDir, `${String(index + 1).padStart(2, "0")}.svg`);
    const pngPath = path.join(sceneDir, `${String(index + 1).padStart(2, "0")}.png`);
    await writeFile(svgPath, svg, "utf8");
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    pngs.push(pngPath);
  }
  await copyFile(pngs.at(-1), path.join(outDir, "thumbnail.png"));
  return pngs;
}

async function renderClip(pngPath, clipPath, duration, index) {
  const frames = Math.max(1, Math.round(duration * fps));
  const zoomDirection = index % 2 === 0 ? "1+0.045*t" : "1.045-0.035*t";
  const filter = `scale=w='${width}*(${zoomDirection}/${duration.toFixed(3)})':h='${height}*(${zoomDirection}/${duration.toFixed(3)})':eval=frame,crop=${width}:${height}:(iw-ow)/2:(ih-oh)/2,setsar=1,format=yuv420p`;
  await run(ffmpegPath, [
    "-y",
    "-hide_banner",
    "-nostats",
    "-loglevel",
    "error",
    "-loop",
    "1",
    "-i",
    pngPath,
    "-t",
    duration.toFixed(3),
    "-r",
    String(fps),
    "-vf",
    filter,
    "-frames:v",
    String(frames),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-crf",
    "20",
    clipPath,
  ]);
}

async function main() {
  if (!ffmpegPath) throw new Error("ffmpeg-static did not provide an ffmpeg binary.");
  await mkdir(sceneDir, { recursive: true });
  await mkdir(clipDir, { recursive: true });

  const transcriptPath = path.join(outDir, "transcript.txt");
  const productionNotesPath = path.join(outDir, "production-notes.md");
  const narrationPath = path.join(outDir, "narration.wav");
  const speechScriptPath = path.join(outDir, "synthesize.ps1");
  await writeFile(transcriptPath, fullNarration, "utf8");
  await writeFile(
    productionNotesPath,
    `# 공부 효율 애니메이션 제작 노트

- Style: original hand-drawn explainer, inspired by Korean study/self-improvement YouTube grammar without copying characters or assets.
- Duration target: about 5 minutes.
- Narration voice: Microsoft Heami Desktop ko-KR.
- Resolution: 1920x1080.
- Scenes: ${scenes.length}.

## Title Ideas

1. 8시간 공부해도 기억 안 나는 이유: 40분 공부 루틴
2. 뇌가 기억하게 만드는 공부법 5가지
3. 공부 효율을 바꾸는 3일 실험

## Thumbnail Copy

왼쪽: "8시간"
오른쪽: "40분"
Main: "단 3일 만에 공부 효율 바꾸는 법"
`,
    "utf8",
  );

  console.log("Rendering scene artwork...");
  const pngs = await renderScenePngs();

  console.log("Synthesizing Korean narration...");
  await synthesizeNarration(transcriptPath, narrationPath, speechScriptPath);
  const audioDuration = await wavDurationSeconds(narrationPath);
  const totalDuration = Math.max(260, audioDuration + 4);
  const charCounts = scenes.map((scene) => [...scene.narration].length + 80);
  const charTotal = charCounts.reduce((sum, count) => sum + count, 0);
  const durations = charCounts.map((count) => (count / charTotal) * totalDuration);

  console.log(`Narration duration: ${audioDuration.toFixed(1)}s; video target: ${totalDuration.toFixed(1)}s`);
  const clips = [];
  for (const [index, png] of pngs.entries()) {
    const clipPath = path.join(clipDir, `${String(index + 1).padStart(2, "0")}.mp4`);
    console.log(`Rendering clip ${index + 1}/${pngs.length} (${durations[index].toFixed(1)}s)...`);
    await renderClip(png, clipPath, durations[index], index);
    clips.push(clipPath);
  }

  const concatPath = path.join(outDir, "clips.txt");
  await writeFile(concatPath, clips.map((clip) => `file '${clip.replaceAll("\\", "/").replaceAll("'", "'\\''")}'`).join("\n"), "utf8");
  const silentVideoPath = path.join(outDir, "video-silent.mp4");
  const finalPath = path.join(outDir, "study-animation.mp4");

  console.log("Concatenating clips...");
  await run(ffmpegPath, [
    "-y",
    "-hide_banner",
    "-nostats",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-c",
    "copy",
    silentVideoPath,
  ]);

  console.log("Muxing narration...");
  await run(ffmpegPath, [
    "-y",
    "-hide_banner",
    "-nostats",
    "-loglevel",
    "error",
    "-i",
    silentVideoPath,
    "-i",
    narrationPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    finalPath,
  ]);

  console.log(`Done: ${finalPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
