'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { MortgageAnalysis } from '@/types/mortgage';

function toChartData(forecast: MortgageAnalysis['forecast']) {
  if (forecast.length <= 60) {
    // yearly data from API — use as-is
    return forecast.map((p) => ({ year: p.month, payment: p.payment }));
  }
  // monthly data — sample every 12th
  return forecast
    .filter((_, i) => i % 12 === 0)
    .map((p, i) => ({
      year: i === 0 ? 'היום' : String(new Date().getFullYear() + i),
      payment: p.payment,
    }));
}

export function PaymentForecast({ data }: { data: MortgageAnalysis }) {
  const chartData = toChartData(data.forecast);

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-gray-500 mb-4 text-center">צפי החזרים חודשיים</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v) => [`₪ ${Number(v).toLocaleString('he-IL')}`, 'החזר חודשי']}
                contentStyle={{ direction: 'rtl', borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Area
                type="monotone" dataKey="payment" stroke="#3b82f6" strokeWidth={2}
                fill="url(#payGrad)" dot={false} activeDot={{ r: 4, fill: '#2563eb' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
