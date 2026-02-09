import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Label
} from 'recharts';
import { REBATE_TIERS } from '../constants';

interface RebateChartProps {
  currentPremium: number;
  hasBundle: boolean;
}

export const RebateChart: React.FC<RebateChartProps> = ({ currentPremium, hasBundle }) => {
  // 1. Construct Data for Stepped Chart
  // We map the 'min' of each tier as a point where the step occurs.
  // We explicitly type this array so that tierName can be a string (allowing 'Max' later).
  const data: { premium: number; rate: number; tierName: string }[] = REBATE_TIERS.map(tier => ({
    premium: tier.min,
    rate: (hasBundle ? tier.rateBundle : tier.rateBasic) * 100,
    tierName: tier.level
  }));

  // Add an endpoint to extend the chart line horizontally after the last tier
  // If current premium is very high, extend further
  const maxDomain = Math.max(currentPremium * 1.15, 250000);
  const lastTierRate = data[data.length - 1].rate;

  // Push a final point to draw the line out
  data.push({
    premium: maxDomain,
    rate: lastTierRate,
    tierName: 'Max'
  });

  // Calculate current user rate for the dot
  const currentTier = REBATE_TIERS.find(t => currentPremium >= t.min && currentPremium <= t.max) || REBATE_TIERS[0];
  const currentRate = (hasBundle ? currentTier.rateBundle : currentTier.rateBasic) * 100;

  return (
    <div className="h-72 w-full mt-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-4 px-2">
        <h4 className="text-sm font-bold text-gray-700">回贈階梯分佈 (Sweet Spot Analysis)</h4>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">X軸: 保費金額 / Y軸: 回贈率</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

          <XAxis
            dataKey="premium"
            type="number"
            domain={[0, maxDomain]}
            tickFormatter={(value) => value === 0 ? '$0' : `$${value / 1000}k`}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />

          <YAxis
            unit="%"
            domain={[0, 25]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-200 shadow-xl rounded-lg text-sm">
                    <p className="font-bold text-gray-800 mb-1">達到 ${d.premium.toLocaleString()} 門檻</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-gray-600">回贈率跳升至:</span>
                      <span className="font-bold text-red-600 text-base">{d.rate}%</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          {/* The Stepped Line Area */}
          <Area
            type="stepAfter"
            dataKey="rate"
            stroke="#dc2626"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRate)"
            animationDuration={1000}
          />

          {/* Current Premium Reference Line */}
          <ReferenceLine
            x={currentPremium}
            stroke="#2563eb"
            strokeDasharray="4 4"
            strokeWidth={2}
            isFront={true}
          >
            <Label
              value="您的位置"
              position="insideTopRight"
              offset={10}
              fill="#2563eb"
              fontSize={12}
              fontWeight="bold"
              className="bg-white"
            />
          </ReferenceLine>

          {/* Dot for Current Position */}
          <ReferenceDot
            x={currentPremium}
            y={currentRate}
            r={6}
            fill="#2563eb"
            stroke="#fff"
            strokeWidth={2}
            isFront={true}
          />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};