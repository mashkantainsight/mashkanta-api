import { Card, CardContent } from '@/components/ui/card';
import type { MortgageAnalysis } from '@/types/mortgage';
import { Price } from './Price';

export function BottomStats({ data }: { data: MortgageAnalysis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-5 text-right space-y-1">
          <p className="text-2xl font-bold text-gray-900">{data.weightedIRR.toFixed(2)}%</p>
          <p className="text-xs text-gray-400">ריבית שנתית משוקללת</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-5 text-right space-y-1">
          <Price amount={data.currentMonthlyPayment} className="text-2xl font-bold text-gray-900" />
          <p className="text-xs text-gray-400">החזר חודשי נוכחי</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-5 text-right space-y-1">
          <Price amount={data.peakMonthlyPayment} className="text-2xl font-bold text-gray-900" />
          <p className="text-xs text-gray-400">החזר חודשי בשיא (צפוי)</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-5 text-right space-y-1">
          <p className="text-2xl font-bold text-gray-900">{data.remainingYears} שנים</p>
          <p className="text-xs text-gray-400">תקופה נותרת</p>
        </CardContent>
      </Card>
    </div>
  );
}
