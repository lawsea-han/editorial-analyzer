import { createRequire } from "node:module";
import fs from "node:fs";

const youtubeProjectRoot = "C:/Users/liie8/Desktop/youtube popular";
const requireFromYoutubeProject = createRequire(`${youtubeProjectRoot}/package.json`);
const { google } = requireFromYoutubeProject("googleapis");

const videoId = process.env.YOUTUBE_VIDEO_ID || "7GhULmo6uzE";
const credentialsPath = `${youtubeProjectRoot}/credentials.json`;
const tokenPath = `${youtubeProjectRoot}/token.json`;

const title = "8시간 공부해도 기억 안 나는 이유: 공부 효율 10배 올리는 40분 루틴";
const description = `하루 종일 공부했는데 다음 날 아무것도 기억나지 않는다면, 의지보다 공부 방식이 문제일 수 있습니다.

이 영상에서는 뇌가 더 잘 기억하도록 만드는 공부법 5가지를 5분 안에 정리합니다.
읽기만 하는 공부가 아니라, 꺼내고, 간격을 두고, 문제를 먼저 보며, 마지막 1분 요약으로 기억을 고정하는 방법입니다.

타임라인
00:00 오래 공부해도 기억 안 나는 이유
00:38 방법 1. 읽지 말고 꺼내기
01:05 방법 2. 25분만 진짜로 집중하기
01:35 방법 3. 간격 복습하기
02:05 방법 4. 문제를 먼저 보기
02:34 방법 5. 1분 요약 남기기
03:03 핵심 정리
03:30 바로 해볼 40분 루틴
04:05 피해야 할 공부 함정
04:31 오늘의 미션

오늘의 40분 루틴
1. 5분: 문제를 먼저 훑기
2. 25분: 개념 집중해서 읽기
3. 10분: 책 덮고 기억나는 내용 적기

좋았다면 저장해두고 오늘 공부 전에 한 번만 따라 해보세요.

#공부법 #공부자극 #집중력 #기억력 #뇌과학 #자기계발 #공부효율 #복습법`;

const tags = [
  "공부법",
  "공부자극",
  "공부 효율",
  "공부 루틴",
  "기억력",
  "집중력",
  "뇌과학 공부법",
  "복습법",
  "간격 반복",
  "회상 연습",
  "40분 공부",
  "학생 공부법",
  "시험 공부법",
  "자기계발",
  "공부 동기부여",
];

const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
const { client_secret, client_id } = creds.installed || creds.web;
const auth = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3001/oauth2callback");
auth.setCredentials(token);
auth.on("tokens", (tokens) => {
  const current = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  fs.writeFileSync(tokenPath, JSON.stringify({ ...current, ...tokens }, null, 2));
});

const youtube = google.youtube({ version: "v3", auth });

const existing = await youtube.videos.list({
  part: ["snippet", "status"],
  id: [videoId],
});

const item = existing.data.items?.[0];
if (!item) {
  throw new Error(`Could not find uploaded video ${videoId}`);
}

await youtube.videos.update({
  part: ["snippet", "status"],
  requestBody: {
    id: videoId,
    snippet: {
      ...item.snippet,
      title,
      description,
      tags,
      categoryId: item.snippet?.categoryId || "27",
      defaultLanguage: "ko",
      defaultAudioLanguage: "ko",
    },
    status: {
      ...item.status,
      privacyStatus: "private",
      selfDeclaredMadeForKids: false,
    },
  },
});

const resultPath =
  "C:/Users/liie8/Desktop/editorial-analyzer/output/study-animation-2026-04-14T00-51-19-598Z/youtube-upload-result.json";
fs.writeFileSync(
  resultPath,
  JSON.stringify(
    {
      videoId,
      url: `https://youtube.com/watch?v=${videoId}`,
      title,
      privacyStatus: "private",
      metadataUpdatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log(`UPDATED_URL=https://youtube.com/watch?v=${videoId}`);
