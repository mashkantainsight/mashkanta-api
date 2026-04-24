export const runtime = "edge";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

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

    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
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
      return Response.json({ error: `Claude ${resp.status}`, details: txt }, { status: 502, headers: cors(origin) });
    }

    const data = await resp.json();
    const raw = data.content[0].text as string;
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
