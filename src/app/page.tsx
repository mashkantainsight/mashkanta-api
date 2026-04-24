'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadForm } from '@/components/LeadForm';
import { SummaryCards } from '@/components/Dashboard/SummaryCards';
import { TracksTable } from '@/components/Dashboard/TracksTable';
import { BottomStats } from '@/components/Dashboard/BottomStats';
import { PaymentForecast } from '@/components/Dashboard/PaymentForecast';
import { TrendingDown, Shield, Clock, BarChart3, RotateCcw } from 'lucide-react';
import type { MortgageAnalysis } from '@/types/mortgage';

const FEATURES = [
  { icon: BarChart3, title: 'ריבית אפקטיבית (IRR)', desc: 'כמה המשכנתא שלך עולה לך באמת' },
  { icon: TrendingDown, title: 'פילוח קרן/ריבית', desc: 'כמה כסף הולך לריבית לעומת קרן' },
  { icon: Clock, title: 'תחזית תשלומים', desc: 'גרף ההחזרים לאורך כל חיי ההלוואה' },
  { icon: Shield, title: 'ניתוח מסלולים', desc: 'פירוט כל מסלול — יתרה, ריבית, תאריך סיום' },
];

function normalizeAnalysis(raw: Record<string, unknown>): MortgageAnalysis {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracks = ((raw.tracks as any[]) || []).map((t: any) => ({
    type: t.type,
    originalAmount: t.originalAmount ?? t.balance ?? 0,
    currentBalance: t.currentBalance ?? t.balance ?? 0,
    interestRate: t.interestRate ?? 0,
    remainingMonths: t.remainingMonths ?? 0,
    linkageIndex: t.linkageIndex,
    rateResetMonths: t.rateResetMonths,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forecast = ((raw.forecast as any[]) || []).map((f: any) => ({
    month: f.month ?? String(f.year ?? ''),
    payment: f.payment ?? 0,
  }));

  const principalRemaining = (raw.principalRemaining as number) ?? (raw.currentBalance as number) ?? 0;
  const interestRemaining = (raw.interestRemaining as number) ?? 0;

  return {
    bankName: raw.bankName as string | undefined,
    originalAmount: (raw.originalAmount as number) ?? (raw.currentBalance as number) ?? 0,
    currentBalance: (raw.currentBalance as number) ?? principalRemaining,
    weightedIRR: (raw.weightedIRR as number) ?? 0,
    tracks,
    totalRemainingPayments: (raw.totalRemainingPayments as number) ?? (principalRemaining + interestRemaining),
    principalRemaining,
    interestRemaining,
    remainingYears: (raw.remainingYears as number) ?? 0,
    currentMonthlyPayment: (raw.currentMonthlyPayment as number) ?? 0,
    peakMonthlyPayment: (raw.peakMonthlyPayment as number) ?? 0,
    forecast,
  };
}

export default function HomePage() {
  const [analysis, setAnalysis] = useState<MortgageAnalysis | null>(null);
  const today = new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  function handleSuccess(raw: Record<string, unknown>) {
    setAnalysis(normalizeAnalysis(raw));
  }

  return (
    <main className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">MortgageIQ</span>
          </div>
          {analysis ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-500"
              onClick={() => setAnalysis(null)}
            >
              <RotateCcw className="h-4 w-4" />
              ניתוח חדש
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs">בטא</Badge>
          )}
        </div>
      </header>

      {analysis ? (
        <div className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">המשכנתא שלך</h1>
              <p className="text-sm text-gray-400">נכון לתאריך {today}</p>
              {analysis.bankName && (
                <p className="text-sm text-gray-500">{analysis.bankName}</p>
              )}
            </div>

            <SummaryCards data={analysis} />
            <TracksTable tracks={analysis.tracks} />
            <BottomStats data={analysis} />
            {analysis.forecast.length > 0 && <PaymentForecast data={analysis} />}

            <div className="rounded-xl bg-white shadow-sm p-6 text-center space-y-3 border-0">
              <p className="text-gray-700 leading-relaxed">
                קיבלנו את המשכנתא שלך לבדיקת כלכלן ונחזור אליך כמה שיותר מהר עם בשורות טובות אמן
                <span className="text-gray-400 text-sm"> (מקסימום נגיד לך שאין חיסכון, בכיף)</span>
              </p>
              <Button variant="outline" size="sm" onClick={() => setAnalysis(null)} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                נתח משכנתא נוספת
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <section className="flex-1 flex items-center py-12 px-4">
          <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <div>
                <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                  חינם לגמרי · ניתוח מיידי
                </Badge>
                <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                  גלה כמה<br />
                  <span className="text-blue-600">המשכנתא שלך</span><br />
                  באמת עולה לך
                </h1>
              </div>
              <p className="text-gray-500 text-lg leading-relaxed">
                העלה את דוח <strong className="text-gray-700">אישור יתרות לסילוק</strong> מהבנק וקבל ניתוח מקצועי תוך דקות — בלי לדבר עם אף אחד.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Shield className="h-3 w-3 shrink-0" />
                הקובץ מוצפן ומשמש לניתוח בלבד. לא נשמרים פרטים רגישים.
              </p>
            </div>

            <div className="order-1 lg:order-2">
              <Card className="shadow-lg border-0 rounded-2xl">
                <CardHeader className="pb-2 pt-6 px-6">
                  <h2 className="text-xl font-bold text-gray-900">קבל ניתוח משכנתא חינם</h2>
                  <p className="text-gray-500 text-sm">ממלאים, מעלים PDF ואנחנו עושים את השאר.</p>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <LeadForm onSuccess={handleSuccess} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-gray-100 bg-white py-4 px-6 text-center text-xs text-gray-400">
        © 2025 MortgageIQ · כל הזכויות שמורות · אין באמור ייעוץ פיננסי
      </footer>
    </main>
  );
}
