export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TelegramChatId = number | string;

type TelegramUpdate = {
  message?: {
    message_id?: number;
    text?: string;
    chat?: {
      id: TelegramChatId;
    };
    from?: {
      first_name?: string;
      username?: string;
    };
  };
};

function splitTelegramMessage(text: string, limit = 3900) {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > limit) {
    const breakpoint = remaining.lastIndexOf("\n", limit);
    const splitAt = breakpoint > 1000 ? breakpoint : limit;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

async function sendTelegramMessage(token: string, chatId: TelegramChatId, text: string) {
  const chunks = splitTelegramMessage(text);

  for (const chunk of chunks) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Telegram sendMessage failed: ${response.status} ${detail}`);
    }
  }
}

async function generateReply(prompt: string, firstName?: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return [
      "AI 답변을 만들려면 서버에 ANTHROPIC_API_KEY가 필요해요.",
      "",
      "지금 Telegram webhook은 연결 준비가 되어 있고, 환경변수를 설정하면 바로 답변을 생성할 수 있습니다.",
    ].join("\n");
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: [
      "You are a warm Korean assistant connected to Telegram.",
      "Reply in Korean by default.",
      "Be concise, practical, and helpful.",
      "If the user asks for a YouTube animation/video idea, give a concrete production plan or short script.",
    ].join(" "),
    messages: [
      {
        role: "user",
        content: `${firstName ? `${firstName} says:\n` : ""}${prompt}`,
      },
    ],
  });

  return message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export async function GET() {
  return Response.json({
    ok: true,
    route: "/api/telegram",
    configured: {
      telegram_bot_token: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      telegram_webhook_secret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      anthropic_api_key: Boolean(process.env.ANTHROPIC_API_KEY),
    },
  });
}

export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token) {
    return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 500 });
  }

  if (expectedSecret) {
    const actualSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (actualSecret !== expectedSecret) {
      return Response.json({ ok: false, error: "Invalid Telegram webhook secret" }, { status: 401 });
    }
  }

  const update = (await req.json()) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim();

  if (!chatId || !text) {
    return Response.json({ ok: true, ignored: true });
  }

  if (text === "/start" || text === "/help") {
    await sendTelegramMessage(
      token,
      chatId,
      [
        "연결됐어요. 이제 메시지를 보내면 제가 답장할게요.",
        "",
        "예시:",
        "- 공부법 영상 대본 만들어줘",
        "- 이 문장을 유튜브 쇼츠 대본으로 바꿔줘",
        "- 이 글을 5단계로 분석해줘",
      ].join("\n"),
    );
    return Response.json({ ok: true });
  }

  try {
    const reply = await generateReply(text, update.message?.from?.first_name);
    await sendTelegramMessage(token, chatId, reply || "답변을 만들지 못했어요. 한 번만 다시 보내주세요.");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram] failed to process update", error);
    await sendTelegramMessage(
      token,
      chatId,
      "처리 중 오류가 났어요. 서버 로그와 환경변수 설정을 확인해볼게요.",
    );
    return Response.json({ ok: false, error: "Failed to process Telegram update" }, { status: 500 });
  }
}
