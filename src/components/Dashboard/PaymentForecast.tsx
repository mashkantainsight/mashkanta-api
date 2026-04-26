'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { MortgageAnalysis } from '@/types/mortgage';

function byYear(forecast: MortgageAnalysis['forecast']) {
  return forecast
    .filter((_, i) => i % 12 === 0)
    .map((p, i) => ({
      year: i === 0 ? 'היום' : String(new Date().getFullYear() + i),
      payment: p.payment,
    }));
}

export function PaymentForecast({ data }: { data: MortgageAnalysis }) {
  const chartData = byYear(data.forecast);

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">צפי החזרים חודשיים</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 16, bottom: 24 }}>
              <defs>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F4B47A" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#F4B47A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={true} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'שנים', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v) => v.toLocaleString('he-IL')}
                width={58}
                label={{ value: 'החזר חודשי צפוי', angle: -90, position: 'insideLeft', offset: 8, fontSize: 11, fill: '#9ca3af' }}
              />
              <Tooltip
                formatter={(v) => [`₪ ${Number(v).toLocaleString('he-IL')}`, 'החזר חודשי']}
                contentStyle={{ direction: 'rtl', borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="payment"
                stroke="#e8742b"
                strokeWidth={2}
                fill="url(#payGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#c85f1f' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
