import { Card, CardContent } from '@/components/ui/card';
import type { MortgageAnalysis } from '@/types/mortgage';
import { Price, PriceInline } from './Price';

export function SummaryCards({ data }: { data: MortgageAnalysis }) {
  const principalPct = Math.round((data.principalRemaining / data.totalRemainingPayments) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      {/* Main card: donut + totals */}
      <div className="lg:col-span-2">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row-reverse items-center gap-6">
              <div className="shrink-0">
                <DonutSvg principal={principalPct} />
              </div>
              <div className="flex-1 text-right space-y-3">
                <p className="text-sm text-gray-400">סך כל התשלומים הצפויים שנותרו</p>
                <Price amount={data.totalRemainingPayments} className="text-3xl font-bold text-gray-900" />
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <PriceInline amount={data.principalRemaining} className="text-gray-700 font-medium" />
                    <span className="text-gray-400">:קרן</span>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#1e3a6e' }} />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <PriceInline amount={data.interestRemaining} className="text-gray-700 font-medium" />
                    <span className="text-gray-400">:ריבית והצמדה</span>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#93c5fd' }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side cards: original amount + IRR */}
      <div className="flex flex-col gap-4">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-5 text-right space-y-1">
            <Price amount={data.originalAmount} className="text-2xl font-bold text-gray-900" />
            <p className="text-xs text-gray-400">סכום המשכנתא המקורית</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-5 text-right space-y-1">
            <p className="text-2xl font-bold text-gray-900">{data.weightedIRR.toFixed(2)}%</p>
            <p className="text-xs text-gray-400">ריבית שנתית משוקללת (IRR)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DonutSvg({ principal }: { principal: number }) {
  const r = 60;
  const circumference = 2 * Math.PI * r;
  const principalDash = (principal / 100) * circumference;
  const interestDash = circumference - principalDash;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="#93c5fd" strokeWidth="22" />
      <circle
        cx="80" cy="80" r={r}
        fill="none"
        stroke="#1e3a6e"
        strokeWidth="22"
        strokeDasharray={`${principalDash} ${interestDash}`}
        strokeLinecap="butt"
        transform="rotate(-90 80 80)"
      />
    </svg>
  );
}
