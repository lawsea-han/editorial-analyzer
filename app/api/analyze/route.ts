import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ALL_PHASES = [
  {
    phase: 1,
    title: "기초 독해",
    steps: [
      { n: 1, label: "핵심 주제 파악" },
      { n: 2, label: "필자의 주장 요약" },
      { n: 3, label: "글의 구조 분석" },
      { n: 4, label: "핵심 키워드 추출" },
      { n: 5, label: "독자 대상 파악" },
      { n: 6, label: "집필 맥락 추론" },
    ],
  },
  {
    phase: 2,
    title: "논리 분석",
    steps: [
      { n: 7, label: "논거 목록화" },
      { n: 8, label: "논리 흐름 추적" },
      { n: 9, label: "근거의 타당성 검토" },
      { n: 10, label: "전제 가정 파악" },
      { n: 11, label: "논리적 약점 탐지" },
      { n: 12, label: "반론 가능성 검토" },
    ],
  },
  {
    phase: 3,
    title: "비판적 평가",
    steps: [
      { n: 13, label: "사실 vs 의견 구분" },
      { n: 14, label: "감정적 호소 분석" },
      { n: 15, label: "생략된 정보 파악" },
      { n: 16, label: "편향성 진단" },
      { n: 17, label: "대안적 관점 제시" },
      { n: 18, label: "필자의 의도 평가" },
    ],
  },
  {
    phase: 4,
    title: "통합 및 재구성",
    steps: [
      { n: 19, label: "핵심 가치 추출" },
      { n: 20, label: "사회적 맥락 연결" },
      { n: 21, label: "역사적 배경 참조" },
      { n: 22, label: "비교 사례 탐색" },
      { n: 23, label: "논리 재설계" },
      { n: 24, label: "실제 사례 연결" },
      { n: 25, label: "최종 요약" },
    ],
  },
  {
    phase: 5,
    title: "성찰",
    steps: [
      { n: 26, label: "편향 점검" },
      { n: 27, label: "자기교정" },
      { n: 28, label: "메타인지 평가" },
      { n: 29, label: "약점 집중 보완" },
      { n: 30, label: "장기 기억 설계" },
    ],
  },
];

function buildPrompt(text: string, selectedPhases: number[]): string {
  const phases = ALL_PHASES.filter((p) => selectedPhases.includes(p.phase));
  const totalSteps = phases.reduce((acc, p) => acc + p.steps.length, 0);

  const phaseText = phases
    .map(
      (p) =>
        `PHASE ${p.phase} — ${p.title}\n` +
        p.steps.map((s) => `[단계${s.n}] ${s.label}`).join("\n")
    )
    .join("\n\n");

  return `다음 사설을 ${totalSteps}단계로 분석해주세요:\n\n${phaseText}\n\n---\n사설 원문:\n${text}`;
}

export async function POST(req: Request) {
  const { text, selectedPhases } = await req.json();

  if (!text || text.trim().length === 0) {
    return new Response("사설 텍스트를 입력해주세요.", { status: 400 });
  }

  const phases: number[] =
    Array.isArray(selectedPhases) && selectedPhases.length > 0
      ? selectedPhases
      : [1, 2, 3, 4, 5];

  const totalSteps = ALL_PHASES.filter((p) => phases.includes(p.phase)).reduce(
    (acc, p) => acc + p.steps.length,
    0
  );

  const systemPrompt = `당신은 사설(editorial)을 깊이 분석하는 전문 분석가입니다.
각 단계를 명확히 구분하여 분석하고, 반드시 한국어로 출력하세요.
각 단계는 2~4문장으로 핵심만 간결하게 작성하세요.
반드시 아래 형식을 정확히 따르세요:

[단계N] 단계제목
분석내용

형식을 절대 바꾸지 마세요. 요청된 ${totalSteps}개의 단계만 분석하세요.`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: buildPrompt(text, phases) }],
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
