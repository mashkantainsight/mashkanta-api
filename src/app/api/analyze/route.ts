// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

const GROQ_KEY = process.env.GROQ_API_KEY!;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const PROMPT = `אתה מנתח מסמכי משכנתא ישראליים.
להלן טקסט שחולץ מ"אישור יתרות לסילוק" מבנק ישראלי.
חלץ את כל הנתונים והחזר JSON בלבד — ללא markdown, ללא הסברים.

{
  "bankName":              "<שם הבנק בעברית>",
  "currentBalance":        <יתרת קרן נוכחית, מספר שלם>,
  "originalAmount":        <סכום הלוואה מקורי, מספר שלם>,
  "weightedIRR":           <ריבית שנתית משוקללת, עשרוני>,
  "currentMonthlyPayment": <החזר חודשי נוכחי, מספר שלם>,
  "peakMonthlyPayment":    <החזר חודשי מקסימלי, מספר שלם>,
  "remainingYears":        <שנים נותרות, מספר שלם>,
  "principalRemaining":    <קרן נותרת, מספר שלם>,
  "interestRemaining":     <ריבית נותרת, מספר שלם>,
  "tracks": [
    {
      "type":            "<שם המסלול>",
      "balance":         <יתרה, שלם>,
      "interestRate":    <ריבית, עשרוני>,
      "remainingMonths": <חודשים נותרים, שלם>,
      "monthlyPayment":  <החזר חודשי, שלם>
    }
  ],
  "forecast": [
    { "year": "<YYYY>", "payment": <תשלום חודשי, שלם> }
  ]
}

חוקים: forecast = שורה לכל שנה עד סיום. JSON תקני בלבד.`;

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
    // Clean: remove non-printable chars, collapse whitespace, keep Hebrew+numbers
    const pdfText = (parsed.text || "")
      .replace(/[^\u0020-\u007E\u05D0-\u05EA\u200F\u200E\n\r\t]/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 30000); // ~7,500 tokens — enough for any mortgage doc

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
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: PROMPT + "\n\n---\n" + pdfText }],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 8192,
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
