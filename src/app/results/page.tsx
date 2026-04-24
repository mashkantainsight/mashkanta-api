'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SummaryCards } from '@/components/Dashboard/SummaryCards';
import { TracksTable } from '@/components/Dashboard/TracksTable';
import { BottomStats } from '@/components/Dashboard/BottomStats';
import { PaymentForecast } from '@/components/Dashboard/PaymentForecast';
import type { MortgageAnalysis } from '@/types/mortgage';

function normalizeAnalysis(raw: Record<string, unknown>): MortgageAnalysis {
  // Normalize tracks: API returns { balance } but type expects { currentBalance, originalAmount }
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

  // Normalize forecast: API returns { year } but type expects { month }
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

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<MortgageAnalysis | null>(null);
  const today = new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    const raw = localStorage.getItem('mtool_analysis');
    if (!raw) {
      router.replace('/');
      return;
    }
    try {
      setAnalysis(normalizeAnalysis(JSON.parse(raw)));
    } catch {
      router.replace('/');
    }
  }, [router]);

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">MortgageIQ</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              <ArrowRight className="h-4 w-4" />
              חזרה
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
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
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 text-center text-xs text-gray-400">
        © 2025 MortgageIQ · אין באמור ייעוץ פיננסי
      </footer>
    </div>
  );
}
