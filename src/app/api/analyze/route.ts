export const runtime = "edge";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const PROMPT = `אתה מחלץ נתונים ממסמך "אישור יתרות לסילוק" של בנק ישראלי.
עליך לחלץ את טבלת המסלולים במדויק. במסמך יש טבלה עם עמודות. חלץ כל שורה.
החזר JSON בלבד ללא markdown ללא \`\`\`.

{
  "bankName": "<שם הבנק>",
  "originalAmount": <סכום ההלוואה המקורי הכולל של כל ההלוואה כפי שמצוין במסמך, מספר שלם>,
  "tracks": [
    {
      "type": "<סוג מסלול — חובה להיות אחד מהערכים הבאים בדיוק: 'זכאות' / 'פריים' / 'קבועה לא צמודה' / 'קבועה צמודה' / 'משתנה לא צמודה' / 'משתנה צמודה'>",
      "balance": <יתרת קרן נוכחית של מסלול זה — העמודה "יתרת קרן" או "יתרה לסילוק". מספר שלם>,
      "originalAmount": <סכום ההלוואה המקורי של מסלול זה. מספר שלם>,
      "interestRate": <ריבית שנתית של מסלול זה כמספר עשרוני. לדוגמה 4.5 ולא 0.045>,
      "remainingMonths": <מספר חודשים שנותרו עד סיום. מחשב לפי תאריך סיום מינוס היום. מספר שלם חיובי. לדוגמה: 346 חודשים>
    }
  ]
}

חוקים חשובים מאוד:
1. זיהוי סוג מסלול — קרא בדיוק מהטבלה:
   - "זכאות" (entitlement / משרד השיכון) → 'זכאות'
   - "פריים" (Prime) → 'פריים'
   - "קבועה לא צמודה" → 'קבועה לא צמודה' — שים לב ל"לא"
   - "קבועה צמודה למדד" → 'קבועה צמודה'
   - "משתנה לא צמודה" → 'משתנה לא צמודה' — שים לב ל"לא"
   - "משתנה צמודה למדד" → 'משתנה צמודה'
2. אל תמיר "זכאות" לסוג אחר.
3. אל תשמיט את המילה "לא" — ההבדל בין "קבועה צמודה" ל"קבועה לא צמודה" קריטי.
4. remainingMonths — חשב לפי תאריך סיום המסלול. אם תאריך הסיום הוא 2055, ועכשיו 2026, זה כ-348 חודשים.
5. interestRate — ריבית שנתית. לדוגמה: 4.5 (לא 0.045).
6. חובה לכלול את כל המסלולים — ספור את שורות הטבלה.`;

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

// Standard Spitzer (שפיצר) monthly payment formula
function spitzerPayment(balance: number, annualRate: number, months: number): number {
  if (months <= 0 || balance <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r < 0.00001) return Math.round(balance / months);
  return Math.round((balance * r) / (1 - Math.pow(1 + r, -months)));
}

function enrichAnalysis(raw: RawAnalysis) {
  const tracks = (raw.tracks || []).filter((t) => t && t.balance > 0 && t.remainingMonths > 0);

  // Compute monthly payment per track using Spitzer formula
  const enrichedTracks = tracks.map((t) => ({
    ...t,
    currentBalance: t.balance,
    monthlyPayment: spitzerPayment(t.balance, t.interestRate, t.remainingMonths),
  }));

  const principalRemaining = Math.round(enrichedTracks.reduce((s, t) => s + t.balance, 0));
  const currentMonthlyPayment = Math.round(enrichedTracks.reduce((s, t) => s + t.monthlyPayment, 0));

  const interestRemaining = Math.round(
    enrichedTracks.reduce((s, t) => s + Math.max(0, t.monthlyPayment * t.remainingMonths - t.balance), 0)
  );
  const totalRemainingPayments = principalRemaining + interestRemaining;

  const weightedIRR = principalRemaining > 0
    ? Math.round((enrichedTracks.reduce((s, t) => s + t.interestRate * t.balance, 0) / principalRemaining) * 100) / 100
    : 0;

  const maxMonths = Math.max(0, ...enrichedTracks.map((t) => t.remainingMonths));
  const remainingYears = Math.round((maxMonths / 12) * 10) / 10;

  const currentYear = new Date().getFullYear();
  const years = Math.ceil(maxMonths / 12);
  const forecast: Array<{ year: string; payment: number }> = [];
  for (let y = 0; y < years; y++) {
    const monthsElapsed = y * 12;
    const payment = Math.round(
      enrichedTracks
        .filter((t) => t.remainingMonths > monthsElapsed)
        .reduce((s, t) => s + t.monthlyPayment, 0)
    );
    forecast.push({ year: String(currentYear + y), payment });
  }
  const peakMonthlyPayment = Math.max(currentMonthlyPayment, ...forecast.map((f) => f.payment));

  return {
    bankName: raw.bankName,
    originalAmount: raw.originalAmount,
    currentBalance: principalRemaining,
    principalRemaining,
    interestRemaining,
    totalRemainingPayments,
    weightedIRR,
    currentMonthlyPayment,
    peakMonthlyPayment,
    remainingYears,
    tracks: enrichedTracks,
    forecast,
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "*";
  try {
    const { pdfBase64 } = (await request.json()) as { pdfBase64: string };
    if (!pdfBase64) {
      return Response.json({ error: "No PDF" }, { status: 400, headers: cors(origin) });
    }

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
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (resp.status === 529 || resp.status === 429) {
      return Response.json(
        { error: "השרת עמוס כרגע. אנא המתן מספר דקות ונסה שוב." },
        { status: 429, headers: cors(origin) }
      );
    }

    if (!resp.ok) {
      const txt = await resp.text();
      return Response.json({ error: `Claude ${resp.status}`, details: txt.slice(0, 500) }, { status: 502, headers: cors(origin) });
    }

    const data = await resp.json();
    const rawText = data?.content?.[0]?.text;
    if (typeof rawText !== "string") {
      return Response.json({ error: "Unexpected Claude response", details: JSON.stringify(data).slice(0, 500) }, { status: 502, headers: cors(origin) });
    }

    let parsed: RawAnalysis;
    try {
      const cleaned = rawText.replace(/```json|```/gi, "").trim();
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      const jsonStr = first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
      parsed = JSON.parse(jsonStr);
    } catch {
      return Response.json({ error: "JSON parse failed", details: rawText.slice(0, 500) }, { status: 502, headers: cors(origin) });
    }

    const analysis = enrichAnalysis(parsed);
    return Response.json(analysis, { headers: cors(origin) });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: cors(origin) });
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || "*";
  return new Response(null, { status: 204, headers: cors(origin) });
}
