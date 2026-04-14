import { createRequire } from "node:module";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);
const requireFromYoutubeProject = createRequire("C:/Users/liie8/Desktop/youtube popular/package.json");
const { MsEdgeTTS, OUTPUT_FORMAT } = requireFromYoutubeProject("msedge-tts");

const outputDir = "C:/Users/liie8/Desktop/editorial-analyzer/output/study-animation-2026-04-14T00-51-19-598Z";
const transcriptPath = path.join(outputDir, "transcript.txt");
const silentVideoPath = path.join(outputDir, "video-silent.mp4");
const rawAudioPath = path.join(outputDir, "narration-edge-sunhi.mp3");
const fittedAudioPath = path.join(outputDir, "narration-edge-sunhi-fitted.m4a");
const finalVideoPath = path.join(outputDir, "study-animation-announcer-voice.mp4");

function runFfmpeg(args) {
  return execFileAsync(ffmpegPath, ["-hide_banner", "-nostats", "-loglevel", "error", ...args], {
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 10,
  });
}

async function durationSeconds(filePath) {
  const { stderr } = await execFileAsync(ffmpegPath, ["-hide_banner", "-i", filePath], {
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 10,
  }).catch((error) => ({ stderr: error.stderr || "" }));
  const match = stderr.match(/Duration:\s(\d+):(\d+):(\d+\.\d+)/);
  if (!match) throw new Error(`Could not read duration for ${filePath}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function atempoChain(factor) {
  const values = [];
  let remaining = factor;

  while (remaining > 2) {
    values.push(2);
    remaining /= 2;
  }
  while (remaining < 0.5) {
    values.push(0.5);
    remaining /= 0.5;
  }

  values.push(Number(remaining.toFixed(4)));
  return values.map((value) => `atempo=${value}`).join(",");
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const transcript = (await readFile(transcriptPath, "utf8"))
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  console.log("Generating Edge Neural announcer-style narration...");
  const tempDir = path.join(outputDir, "edge-tts-temp");
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });

  const tts = new MsEdgeTTS();
  await tts.setMetadata("ko-KR-SunHiNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioFilePath } = await tts.toFile(tempDir, transcript, {
    rate: "+28%",
    pitch: "-2Hz",
    volume: "+0%",
  });
  await rm(rawAudioPath, { force: true });
  await rename(audioFilePath, rawAudioPath);
  await rm(tempDir, { recursive: true, force: true });
  tts.close();

  const [videoDuration, audioDuration] = await Promise.all([
    durationSeconds(silentVideoPath),
    durationSeconds(rawAudioPath),
  ]);
  const targetAudioDuration = videoDuration - 1.2;
  const factor = audioDuration / targetAudioDuration;
  console.log(
    `Silent video: ${videoDuration.toFixed(2)}s; Edge audio: ${audioDuration.toFixed(2)}s; tempo factor: ${factor.toFixed(3)}`,
  );

  await runFfmpeg([
    "-y",
    "-i",
    rawAudioPath,
    "-filter:a",
    atempoChain(factor),
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    fittedAudioPath,
  ]);

  await runFfmpeg([
    "-y",
    "-i",
    silentVideoPath,
    "-i",
    fittedAudioPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
    finalVideoPath,
  ]);

  const finalDuration = await durationSeconds(finalVideoPath);
  fs.writeFileSync(
    path.join(outputDir, "announcer-voice-notes.json"),
    JSON.stringify(
      {
        voice: "ko-KR-SunHiNeural",
        style: "announcer-like Korean neural voice",
        rawAudioPath,
        fittedAudioPath,
        finalVideoPath,
        videoDuration,
        rawAudioDuration: audioDuration,
        finalDuration,
        tempoFactor: factor,
      },
      null,
      2,
    ),
  );

  console.log(`Done: ${finalVideoPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
