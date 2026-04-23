import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

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
      "pct":             <אחוז מהסך, עשרוני>,
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

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF" }, { status: 400, headers: corsHeaders });
    }

    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const body = JSON.stringify({
      contents: [{ parts: [
        { inline_data: { mime_type: "application/pdf", data: b64 } },
        { text: PROMPT },
      ]}],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    });

    let resp!: Response;
    for (let attempt = 1; attempt <= 4; attempt++) {
      resp = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (resp.status !== 429 || attempt >= 4) break;
      const wait = parseInt(resp.headers.get("Retry-After") || String(attempt * 20));
      await new Promise((r) => setTimeout(r, wait * 1000));
    }

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: `Gemini ${resp.status}`, details: txt }, { status: 502, headers: corsHeaders });
    }

    const data = await resp.json();
    const raw = data.candidates[0].content.parts[0].text as string;
    const analysis = JSON.parse(raw.replace(/```json|```/gi, "").trim());

    return NextResponse.json(analysis, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
