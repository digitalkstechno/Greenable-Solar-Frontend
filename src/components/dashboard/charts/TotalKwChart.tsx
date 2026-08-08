import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";
import { YearSelect, TruncatedNameTick } from "./Shared";

interface TotalKwChartProps {
  kwFilter: number;
  setKwFilter: (val: number) => void;
  last3Years: number[];
  totalKwChart: number;
  kwGrowthData: any[];
}

export default function TotalKwChart({ kwFilter, setKwFilter, last3Years, totalKwChart, kwGrowthData }: TotalKwChartProps) {
  return (
  
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow min-h-[450px] flex flex-col">
      <div className="flex flex-col mb-2 shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-gray-900">Total KW Growth</p>
          <YearSelect
            value={kwFilter}
            onChange={setKwFilter}
            options={last3Years}
          />
        </div>
        <h3 className="text-lg text-gray-500 mt-1">{totalKw.toFixed(2)} KW</h3>
      </div>

      <div className="flex-1 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={kwGrowthData}
            margin={{ top: 10, right: 3, left: -5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorKwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d87612" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#d87612" stopOpacity={0} />
              </linearGradient>
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
                        {Number(payload[0].value).toFixed(2)} KW
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="kw"
              stroke="#d87612"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorKwGrad)"
              dot={{ r: 4, stroke: "#d87612", strokeWidth: 2, fill: "white" }}
              activeDot={{
                r: 6,
                stroke: "#d87612",
                strokeWidth: 2,
                fill: "#d87612",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
