import { Card, CardContent } from '@/components/ui/card';
import type { MortgageTrack } from '@/types/mortgage';
import { PriceInline } from './Price';

export function TracksTable({ tracks }: { tracks: MortgageTrack[] }) {
  const totalBalance = tracks.reduce((s, t) => s + t.currentBalance, 0);

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                <th className="text-right pb-3 font-medium">סוג המסלול</th>
                <th className="text-left pb-3 font-medium">יתרה לתשלום</th>
                <th className="text-left pb-3 font-medium">אחוז מסך היתרה</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t, i) => {
                const pct = ((t.currentBalance / totalBalance) * 100).toFixed(1);
                return (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-semibold text-gray-800">{t.type}</td>
                    <td className="py-3 text-left">
                      <PriceInline amount={t.currentBalance} className="text-gray-700" />
                    </td>
                    <td className="py-3 text-left text-gray-500">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
