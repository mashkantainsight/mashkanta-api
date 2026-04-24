export const runtime = "edge";

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
  GEMINI_KEY;

const PROMPT = `אתה מנתח מסמכי משכנתא ישראליים.
המסמך המצורף הוא "אישור יתרות לסילוק" מבנק ישראלי.
חלץ את כל הנתונים והחזר JSON בלבד — ללא markdown, ללא הסברים.

{
  "bankName":              "<שם הבנק בעברית כפי שמופיע בכותרת>",
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

חוקים: forecast = שורה לכל שנה עד סיום. JSON תקני בלבד ללא \`\`\`.`;

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

    const body = JSON.stringify({
      contents: [{ parts: [
        { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
        { text: PROMPT },
      ]}],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    });

    const resp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (resp.status === 429) {
      return Response.json(
        { error: "השרת עמוס כרגע. אנא המתן מספר דקות ונסה שוב." },
        { status: 429, headers: cors(origin) }
      );
    }

    if (!resp.ok) {
      const txt = await resp.text();
      return Response.json({ error: `Gemini ${resp.status}`, details: txt }, { status: 502, headers: cors(origin) });
    }

    const data = await resp.json();
    const raw = data.candidates[0].content.parts[0].text as string;
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
