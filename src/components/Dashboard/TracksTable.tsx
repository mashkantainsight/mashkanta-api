import { Card, CardContent } from '@/components/ui/card';
import type { MortgageTrack } from '@/types/mortgage';
import { PriceInline } from './Price';

export function TracksTable({ tracks }: { tracks: MortgageTrack[] }) {
  const totalBalance = tracks.reduce((s, t) => s + t.currentBalance, 0);

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="grid grid-cols-2 sm:grid-cols-3 px-3 sm:px-4 pb-3">
          <span className="text-xs font-semibold text-gray-400 text-right">סוג המסלול</span>
          <span className="text-xs font-semibold text-gray-400 text-left sm:text-center">יתרה לתשלום</span>
          <span className="hidden sm:block text-xs font-semibold text-gray-400 text-left">אחוז מסך היתרה</span>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {tracks.map((t, i) => {
            const pct = ((t.currentBalance / totalBalance) * 100).toFixed(1);
            return (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-3 items-center bg-white rounded-xl px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
                <span className="font-bold text-gray-800 text-right text-sm sm:text-base">{t.type}</span>
                <span className="text-left sm:text-center text-gray-700 text-sm sm:text-base">
                  <PriceInline amount={t.currentBalance} className="text-gray-700" />
                </span>
                <span className="hidden sm:block text-left text-gray-400 text-sm font-numeric">{pct}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
