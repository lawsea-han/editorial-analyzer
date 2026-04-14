const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = process.env.TELEGRAM_WEBHOOK_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN.");
  process.exit(1);
}

if (!baseUrl) {
  console.error("Missing TELEGRAM_WEBHOOK_BASE_URL, for example https://your-app.vercel.app.");
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
const webhookUrl = new URL("/api/telegram", normalizedBaseUrl).toString();
const body = {
  url: webhookUrl,
  ...(secret ? { secret_token: secret } : {}),
};

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const result = await response.json();

if (!response.ok || !result.ok) {
  console.error("Failed to set Telegram webhook:", result);
  process.exit(1);
}

console.log(`Telegram webhook configured: ${webhookUrl}`);
