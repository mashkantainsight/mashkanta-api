export const runtime = "edge";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  const hasKey = !!key && key.length > 10;

  // Test Gemini with a tiny request
  let geminiStatus = "untested";
  if (hasKey) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "say hi" }] }],
          }),
        }
      );
      geminiStatus = `HTTP ${resp.status}`;
    } catch (e) {
      geminiStatus = `error: ${String(e)}`;
    }
  }

  return Response.json({ hasKey, geminiStatus, ts: Date.now() });
}
