export const runtime = "edge";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const PROMPT = `אתה מנתח מסמכי "אישור יתרות לסילוק" ישראליים.
קרא את המסמך בעיון ומלא את כל השדות בדיוק לפי הנתונים המופיעים בו.
החזר JSON בלבד — ללא markdown, ללא הסברים, ללא \`\`\`.

{
  "bankName":              "<שם הבנק בעברית כפי שמופיע בכותרת המסמך>",
  "originalAmount":        <סכום ההלוואה המקורי המצוין במסמך, מספר שלם בשקלים>,
  "currentBalance":        <סך יתרת הקרן הכוללת של כל המסלולים, מספר שלם>,
  "principalRemaining":    <סך יתרת הקרן — זהה ל-currentBalance, מספר שלם>,
  "interestRemaining":     <סך הריבית הצבורה / ריבית נותרת לתשלום על כל תקופת ההלוואה, מספר שלם>,
  "weightedIRR":           <ריבית שנתית משוקללת: חשב ממוצע משוקלל של ריביות המסלולים לפי יתרתם. עשרוני, למשל 5.06>,
  "currentMonthlyPayment": <סך ההחזר החודשי הנוכחי של כל המסלולים יחד, מספר שלם>,
  "peakMonthlyPayment":    <ההחזר החודשי המקסימלי הצפוי בכל תקופת ההלוואה, מספר שלם>,
  "remainingYears":        <מספר השנים הנותרות עד לסיום ההלוואה, מספר עשרוני כגון 28.9>,
  "tracks": [
    {
      "type":            "<שם המסלול בעברית: קבועה לא צמודה / קבועה צמודה / משתנה לא צמודה / משתנה צמודה / פריים / זכאות>",
      "balance":         <יתרת קרן המסלול, מספר שלם>,
      "interestRate":    <ריבית שנתית של המסלול, עשרוני>,
      "remainingMonths": <מספר חודשים נותרים למסלול זה, מספר שלם>,
      "monthlyPayment":  <החזר חודשי של מסלול זה, מספר שלם>
    }
  ],
  "forecast": [
    { "year": "<YYYY>", "payment": <החזר חודשי צפוי באותה שנה, מספר שלם> }
  ]
}

חוקים:
- כלול את כל המסלולים שמופיעים במסמך ללא יוצא מן הכלל
- forecast: שורה אחת לכל שנה קלנדרית מהיום עד תום ההלוואה
- JSON תקני בלבד, ללא הערות`;

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
        model: "claude-sonnet-4-6",
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
