export const dynamic = "force-dynamic";

export async function GET() {
  const result = {
    ok: false,
    checks: {
      env_key: false,
      sdk_import: false,
      sdk_init: false,
    },
    error: null as string | null,
    timestamp: new Date().toISOString(),
  };

  // 1. 환경변수 체크
  result.checks.env_key = !!process.env.ANTHROPIC_API_KEY;
  if (!result.checks.env_key) {
    result.error = "ANTHROPIC_API_KEY 환경변수 없음";
    console.error("[health]", result.error);
    return Response.json(result, { status: 500 });
  }

  // 2. SDK import 체크
  try {
    await import("@anthropic-ai/sdk");
    result.checks.sdk_import = true;
  } catch (e) {
    result.error = `SDK import 실패: ${e instanceof Error ? e.message : String(e)}`;
    console.error("[health]", result.error);
    return Response.json(result, { status: 500 });
  }

  // 3. SDK 초기화 체크
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    result.checks.sdk_init = true;
  } catch (e) {
    result.error = `SDK 초기화 실패: ${e instanceof Error ? e.message : String(e)}`;
    console.error("[health]", result.error);
    return Response.json(result, { status: 500 });
  }

  result.ok = true;
  return Response.json(result);
}
