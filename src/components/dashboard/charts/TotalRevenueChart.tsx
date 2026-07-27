import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";
import { YearSelect, TruncatedNameTick } from "./Shared";

interface TotalRevenueChartProps {
  revenueFilter: number;
  setRevenueFilter: (val: number) => void;
  last3Years: number[];
  totalRevenueChart: number;
  revenueGrowthData: any[];
}

export default function TotalRevenueChart({ revenueFilter, setRevenueFilter, last3Years, totalRevenueChart, revenueGrowthData }: TotalRevenueChartProps) {
  return (
  
    <div className="min-h-[450px] rounded-3xl border border-gray-200 p-6 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow justify-between">
      <div className="flex flex-col mb-2 shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-gray-900">Total Revenue</p>
          <YearSelect
            value={revenueFilter}
            onChange={setRevenueFilter}
            options={last3Years}
          />
        </div>
        <h3 className="text-lg text-gray-500 mt-1">
          ₹{(totalRevenueChart || 0).toLocaleString()}
        </h3>
      </div>

      <div className="flex-1 mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={revenueGrowthData}
            margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
            barCategoryGap="30%"
          >
            <defs>
              <linearGradient id="colorAmtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fdba74" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#d87612" stopOpacity={0.9} />
              </linearGradient>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#b45309" />
              </marker>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              padding={{ left: 15, right: 15 }}
              tick={{ fontSize: 12, fill: "#4b5563", fontWeight: "600", dy: 8 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, (max: number) => max * 1.05]}
              tickFormatter={(val) => {
                if (val === 0) return "0";
                if (val >= 100000) {
                  const lakhs = val / 100000;
                  return lakhs % 1 === 0 ? `${lakhs}L` : `${lakhs.toFixed(1)}L`;
                }
                if (val >= 1000) {
                  const k = Math.round(val / 1000);
                  return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
                }
                return String(val);
              }}
              width={50}
              tick={{ fontSize: 11, fill: "#4b5563", dx: -8 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                      <p className="font-bold text-gray-900">
                        {payload[0].payload.name}
                      </p>
                      <p className="font-semibold" style={{ color: "#d87612" }}>
                        ₹{Number(payload[0].payload.amt).toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="amt"
              fill="url(#colorAmtGrad)"
              radius={[4, 4, 0, 0]}
              barSize={35}
            />
            <Line
              type="monotone"
              dataKey="lineAmt"
              stroke="#b45309"
              strokeWidth={3}
              dot={false}
              activeDot={false}
              markerEnd="url(#arrow)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
