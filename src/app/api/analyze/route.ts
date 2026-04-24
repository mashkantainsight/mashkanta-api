// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

const GROQ_KEY = process.env.GROQ_API_KEY!;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const PROMPT = `Analyze Israeli mortgage PDF text. Return ONLY valid JSON, no markdown.

{
  "bankName": "<bank name in Hebrew>",
  "currentBalance": <number>,
  "originalAmount": <number>,
  "weightedIRR": <decimal>,
  "currentMonthlyPayment": <number>,
  "peakMonthlyPayment": <number>,
  "remainingYears": <number>,
  "principalRemaining": <number>,
  "interestRemaining": <number>,
  "tracks": [{"type":"<Hebrew name>","balance":<number>,"interestRate":<decimal>,"remainingMonths":<number>,"monthlyPayment":<number>}],
  "forecast": [{"year":"<YYYY>","payment":<number>}]
}

forecast: one row per year for next 5 years only. JSON only.`;

function extractFinancialLines(raw: string): string {
  const cleaned = raw
    .replace(/[^\u0020-\u007E\u05D0-\u05EA\n]/g, " ")
    .replace(/[ \t]{2,}/g, " ");

  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  const relevant = lines.filter((l) =>
    /\d{3,}/.test(l) || // any line with a 3+ digit number
    /יתרה|ריבית|קרן|מסלול|תשלום|הלוואה|סכום|בנק|פריים|קבועה|משתנה|זכאות|מדד/.test(l)
  );

  return relevant.slice(0, 100).join("\n").slice(0, 2500);
}

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "*";
  try {
    const { pdfBase64 } = (await request.json()) as { pdfBase64: string };
    if (!pdfBase64) {
      return Response.json({ error: "No PDF" }, { status: 400, headers: cors(origin) });
    }

    const buffer = Buffer.from(pdfBase64, "base64");
    const parsed = await pdfParse(buffer);
    const pdfText = extractFinancialLines(parsed.text || "");

    if (!pdfText) {
      return Response.json(
        { error: "לא ניתן לחלץ טקסט מהקובץ. האם הקובץ סרוק? אנא נסה PDF מבנק." },
        { status: 422, headers: cors(origin) }
      );
    }

    const resp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: PROMPT + "\n\nPDF TEXT:\n" + pdfText }],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 2048,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return Response.json({ error: `Groq ${resp.status}`, details: txt }, { status: 502, headers: cors(origin) });
    }

    const data = await resp.json();
    const raw = data.choices[0].message.content as string;
    const analysis = JSON.parse(raw.replace(/```json|```/gi, "").trim());

    return Response.json(analysis, { headers: cors(origin) });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: cors(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || "*";
  return new Response(null, { status: 204, headers: cors(origin) });
}
