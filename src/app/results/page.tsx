'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SummaryCards } from '@/components/Dashboard/SummaryCards';
import { TracksTable } from '@/components/Dashboard/TracksTable';
import { BottomStats } from '@/components/Dashboard/BottomStats';
import { PaymentForecast } from '@/components/Dashboard/PaymentForecast';
import type { MortgageAnalysis } from '@/types/mortgage';

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill="#FEF3EC"/>
        <path d="M18 7L6 17H9V29H15V21H21V29H27V17H30L18 7Z" fill="#e8742b"/>
        <path d="M18 7L6 17H9V29H15V21H21V29H27V17H30L18 7Z" fill="url(#roof)" fillOpacity="0.15"/>
        <defs>
          <linearGradient id="roof" x1="18" y1="7" x2="18" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"/>
            <stop offset="1" stopColor="#e8742b"/>
          </linearGradient>
        </defs>
      </svg>
      <span className="font-bold text-gray-700 text-lg leading-tight">
        משכנתא<span className="text-[#e8742b]"> חדשה</span>
      </span>
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAnalysis(raw: any): MortgageAnalysis {
  const n = (v: unknown, fb = 0) => (v as number) ?? fb;
  const tracks = (raw.tracks ?? []).map((t: any) => ({
    type: t.type,
    originalAmount: t.originalAmount ?? t.balance ?? 0,
    currentBalance: t.currentBalance ?? t.balance ?? 0,
    interestRate: t.interestRate ?? 0,
    remainingMonths: t.remainingMonths ?? 0,
    linkageIndex: t.linkageIndex,
    rateResetMonths: t.rateResetMonths,
  }));
  const forecast = (raw.forecast ?? []).map((f: any) => ({
    month: f.month ?? String(f.year ?? ''),
    payment: f.payment ?? 0,
  }));
  const principalRemaining = n(raw.principalRemaining ?? raw.currentBalance);
  const interestRemaining = n(raw.interestRemaining);
  return {
    bankName: raw.bankName,
    originalAmount: n(raw.originalAmount),
    currentBalance: n(raw.currentBalance ?? principalRemaining),
    weightedIRR: n(raw.weightedIRR),
    tracks,
    totalRemainingPayments: n(raw.totalRemainingPayments, principalRemaining + interestRemaining),
    principalRemaining,
    interestRemaining,
    remainingYears: n(raw.remainingYears),
    currentMonthlyPayment: n(raw.currentMonthlyPayment),
    peakMonthlyPayment: n(raw.peakMonthlyPayment),
    forecast,
  };
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<MortgageAnalysis | null>(null);
  const [firstName, setFirstName] = useState('');
  const today = new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    const raw = localStorage.getItem('mtool_analysis');
    if (!raw) { router.replace('/'); return; }
    try {
      const parsed = JSON.parse(raw);
      setFirstName(parsed._user?.firstName ?? '');
      setAnalysis(normalizeAnalysis(parsed));
    } catch {
      router.replace('/');
    }
  }, [router]);

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Logo />
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-500">
              <RotateCcw className="h-4 w-4" />
              ניתוח חדש
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-[800px] mx-auto flex flex-col gap-4">

          <div className="order-1 rounded-xl bg-[#FEF3EC] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-8">
            <div className="text-right">
              {firstName && (
                <p className="text-sm font-semibold text-[#e8742b] mb-0.5">
                  שלום {firstName}, {timeGreeting()}
                </p>
              )}
              <p className="text-base sm:text-xl font-extrabold text-gray-800 leading-snug">
                המספרים שלפניכם שווים כסף<br />בואו נעשה איתם משהו.
              </p>
            </div>
            <p className="hidden sm:block text-xs text-gray-400 shrink-0">
              {analysis.bankName ? `${analysis.bankName} · ` : ''}המשכנתא שלך · {today}
            </p>
          </div>

          <div className="order-3 sm:order-2"><BottomStats data={analysis} /></div>
          <div className="order-2 sm:order-3"><SummaryCards data={analysis} /></div>
          <div className="order-4"><TracksTable tracks={analysis.tracks} /></div>
          {analysis.forecast.length > 0 && (
            <div className="order-5"><PaymentForecast data={analysis} /></div>
          )}

          <div className="order-6 rounded-xl bg-[#FEF3EC] px-6 py-6 text-center">
            <p className="text-base sm:text-xl font-bold text-[#e8742b] leading-relaxed">
              כל חודש אתם משלמים יותר ממה שצריך. בואו נשנה את זה.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} משכנתא חדשה · אין באמור ייעוץ פיננסי
      </footer>
    </div>
  );
}
