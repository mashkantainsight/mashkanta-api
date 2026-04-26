import { Card, CardContent } from '@/components/ui/card';
import type { MortgageAnalysis } from '@/types/mortgage';
import { Price } from './Price';

export function BottomStats({ data }: { data: MortgageAnalysis }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 items-stretch">
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-4 sm:p-6 text-center sm:text-right space-y-1 flex flex-col items-center sm:items-start">
          <p className="text-lg sm:text-2xl font-bold text-gray-900"><span className="font-numeric">{data.remainingYears}</span> שנים</p>
          <p className="text-xs font-medium text-gray-500">תקופת המשכנתה שנותרה</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-4 sm:p-6 text-center sm:text-right space-y-1 flex flex-col items-center sm:items-start">
          <Price amount={data.peakMonthlyPayment} className="text-lg sm:text-2xl font-bold text-gray-900" />
          <p className="text-xs font-medium text-gray-500">החזר חודשי בשיא (צפוי)</p>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-4 sm:p-6 text-center sm:text-right space-y-1 flex flex-col items-center sm:items-start">
          <Price amount={data.currentMonthlyPayment} className="text-lg sm:text-2xl font-bold text-gray-900" />
          <p className="text-xs font-medium text-gray-500">החזר חודשי צפוי</p>
        </CardContent>
      </Card>
      {/* 4th card — mobile only to complete 2×2 grid */}
      <Card className="rounded-xl border-0 shadow-sm sm:hidden">
        <CardContent className="p-4 text-center space-y-1 flex flex-col items-center">
          <p className="text-lg font-bold text-gray-900"><span className="font-numeric">{data.weightedIRR.toFixed(2)}%</span></p>
          <p className="text-xs font-medium text-gray-500">ריבית שנתית משוקללת</p>
        </CardContent>
      </Card>
    </div>
  );
}
