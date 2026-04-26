export const runtime = "edge";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const PROMPT = `חלץ נתונים ממסמך "אישור יתרות לסילוק" ישראלי. החזר JSON בלבד ללא markdown.

{
  "bankName": "<שם הבנק>",
  "originalAmount": <סכום הלוואה מקורי כולל, מספר שלם>,
  "tracks": [
    {
      "type": "<'זכאות' | 'פריים' | 'קבועה לא צמודה' | 'קבועה צמודה' | 'משתנה לא צמודה' | 'משתנה צמודה'>",
      "balance": <יתרת קרן נוכחית, מספר שלם>,
      "originalAmount": <סכום מקורי של מסלול זה, מספר שלם>,
      "interestRate": <ריבית שנתית עשרונית, לדוגמה 4.5>,
      "remainingMonths": <חודשים שנותרו לפי תאריך סיום, מספר שלם>
    }
  ]
}

כללים:
- type — חובה להשתמש בדיוק בערכים המותרים. שים לב ל"לא" בקבועה/משתנה לא צמודה.
- אל תמיר "זכאות" לסוג אחר.
- remainingMonths — חשב מתאריך סיום מינוס היום בחודשים.
- interestRate — שנתית כמספר (4.5 ולא 0.045).
- כלול את כל שורות הטבלה.`;

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

type RawTrack = {
  type: string;
  balance: number;
  originalAmount?: number;
  interestRate: number;
  remainingMonths: number;
};

type RawAnalysis = {
  bankName?: string;
  originalAmount: number;
  tracks: RawTrack[];
};

function spitzerPayment(balance: number, annualRate: number, months: number): number {
  if (months <= 0 || balance <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r < 0.00001) return Math.round(balance / months);
  return Math.round((balance * r) / (1 - Math.pow(1 + r, -months)));
}

function enrichAnalysis(raw: RawAnalysis) {
  const tracks = (raw.tracks || [])
    .filter((t) => t && t.balance > 0 && t.remainingMonths > 0)
    .map((t) => ({
      ...t,
      currentBalance: t.balance,
      monthlyPayment: spitzerPayment(t.balance, t.interestRate, t.remainingMonths),
    }));

  const principalRemaining = Math.round(tracks.reduce((s, t) => s + t.balance, 0));
  const currentMonthlyPayment = Math.round(tracks.reduce((s, t) => s + t.monthlyPayment, 0));
  const interestRemaining = Math.round(
    tracks.reduce((s, t) => s + Math.max(0, t.monthlyPayment * t.remainingMonths - t.balance), 0)
  );
  const weightedIRR = principalRemaining > 0
    ? Math.round((tracks.reduce((s, t) => s + t.interestRate * t.balance, 0) / principalRemaining) * 100) / 100
    : 0;

  const maxMonths = Math.max(0, ...tracks.map((t) => t.remainingMonths));
  const currentYear = new Date().getFullYear();
  const forecast = Array.from({ length: Math.ceil(maxMonths / 12) }, (_, y) => ({
    year: String(currentYear + y),
    payment: Math.round(
      tracks.filter((t) => t.remainingMonths > y * 12).reduce((s, t) => s + t.monthlyPayment, 0)
    ),
  }));

  return {
    bankName: raw.bankName,
    originalAmount: raw.originalAmount,
    currentBalance: principalRemaining,
    principalRemaining,
    interestRemaining,
    totalRemainingPayments: principalRemaining + interestRemaining,
    weightedIRR,
    currentMonthlyPayment,
    peakMonthlyPayment: Math.max(currentMonthlyPayment, ...forecast.map((f) => f.payment)),
    remainingYears: Math.round((maxMonths / 12) * 10) / 10,
    tracks,
    forecast,
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "*";
  try {
    const { pdfBase64 } = (await request.json()) as { pdfBase64: string };
    if (!pdfBase64) return Response.json({ error: "No PDF" }, { status: 400, headers: cors(origin) });

    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
    });

    if (resp.status === 529 || resp.status === 429)
      return Response.json({ error: "השרת עמוס כרגע. אנא המתן מספר דקות ונסה שוב." }, { status: 429, headers: cors(origin) });

    if (!resp.ok) {
      const txt = await resp.text();
      return Response.json({ error: `Claude ${resp.status}`, details: txt.slice(0, 500) }, { status: 502, headers: cors(origin) });
    }

    const rawText = (await resp.json())?.content?.[0]?.text;
    if (typeof rawText !== "string")
      return Response.json({ error: "Unexpected Claude response" }, { status: 502, headers: cors(origin) });

    let parsed: RawAnalysis;
    try {
      const cleaned = rawText.replace(/```json|```/gi, "").trim();
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      parsed = JSON.parse(first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned);
    } catch {
      return Response.json({ error: "JSON parse failed", details: rawText.slice(0, 500) }, { status: 502, headers: cors(origin) });
    }

    return Response.json(enrichAnalysis(parsed), { headers: cors(origin) });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: cors(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get("origin") || "*") });
}
