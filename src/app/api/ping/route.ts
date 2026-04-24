export const runtime = "edge";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  return Response.json({ hasKey: !!key && key.length > 10, ts: Date.now() });
}
