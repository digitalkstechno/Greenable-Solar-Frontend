import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";
import { YearSelect, TruncatedNameTick } from "./Shared";

interface LeadSourceChartProps {
  sourceFilter: number;
  setSourceFilter: (val: number) => void;
  last3Years: number[];
  sourceChartData: any[];
}

export default function LeadSourceChart({ sourceFilter, setSourceFilter, last3Years, sourceChartData }: LeadSourceChartProps) {
  return (
  
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow min-h-[450px] flex flex-col justify-between">
      <div className="flex flex-col mb-4 shrink-0">
        <p className="text-xl font-semibold text-gray-900">
          Lead Source Overview
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Leads distribution by acquisition source
        </p>
      </div>

      <div className="flex-1 mt-4" style={{ minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            width={Math.max(
              staffChartWidth,
              leadsBySource.length * (staffChartWidth / 8),
            )}
            data={leadsBySource}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280", dx: -4 }}
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
                      <p className="font-semibold text-blue-600">
                        {payload[0].value} Leads
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
              {leadsBySource.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
