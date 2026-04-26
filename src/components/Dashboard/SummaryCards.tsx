import { Card, CardContent } from '@/components/ui/card';
import type { MortgageAnalysis } from '@/types/mortgage';
import { Price, PriceInline } from './Price';

export function SummaryCards({ data }: { data: MortgageAnalysis }) {
  const principalPct = Math.round((data.principalRemaining / data.totalRemainingPayments) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      {/* Main card: donut + totals */}
      <div className="lg:col-span-2 h-full">
        <Card className="rounded-xl border-0 shadow-sm h-full">
          <CardContent className="p-6 h-full flex items-center">
            <div className="flex flex-col sm:flex-row-reverse items-center gap-6 w-full">
              <div className="shrink-0">
                <DonutSvg principal={principalPct} />
              </div>
              <div className="flex-1 w-full text-center sm:text-right space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">סך כל התשלומים הצפויים שנותרו</p>
                <Price amount={data.totalRemainingPayments} className="text-3xl font-bold text-gray-900 !text-center sm:!text-right" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#e8742b' }} />
                    <span className="text-xs font-medium text-gray-500">:קרן</span>
                    <PriceInline amount={data.principalRemaining} className="text-gray-800 font-semibold" />
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#F4B47A' }} />
                    <span className="text-xs font-medium text-gray-500">:ריבית והצמדה</span>
                    <PriceInline amount={data.interestRemaining} className="text-gray-800 font-semibold" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side cards: original amount + IRR */}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
        <Card className="rounded-xl border-0 shadow-sm ">
          <CardContent className="p-6 text-center sm:text-right space-y-1 h-full flex flex-col justify-center items-center sm:items-start">
            <Price amount={data.originalAmount} className="text-2xl font-bold text-gray-900" />
            <p className="text-xs font-medium text-gray-500">סכום המשכנתא המקורית</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm ">
          <CardContent className="p-6 text-center sm:text-right space-y-1 h-full flex flex-col justify-center items-center sm:items-start">
            <p className="text-2xl font-bold text-gray-900">{data.weightedIRR.toFixed(2)}%</p>
            <p className="text-xs font-medium text-gray-500">ריבית שנתית משוקללת (IRR)</p>
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
      <circle cx="80" cy="80" r={r} fill="none" stroke="#F4B47A" strokeWidth="22" />
      <circle
        cx="80" cy="80" r={r}
        fill="none"
        stroke="#e8742b"
        strokeWidth="22"
        strokeDasharray={`${principalDash} ${interestDash}`}
        strokeLinecap="butt"
        transform="rotate(-90 80 80)"
      />
    </svg>
  );
}
