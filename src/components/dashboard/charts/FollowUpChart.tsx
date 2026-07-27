import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";
import { YearSelect, TruncatedNameTick } from "./Shared";

interface FollowUpChartProps {
  followupFilter: number;
  setFollowupFilter: (val: number) => void;
  last5Years: number[];
  followUpChartData: any[];
  isSalesUser: boolean;
}

export default function FollowUpChart({ followupFilter, setFollowupFilter, last5Years, followUpChartData, isSalesUser }: FollowUpChartProps) {
  return (
  
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow min-h-[450px] flex flex-col">
      <div className="flex flex-col mb-2 shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-gray-900">
            Follow-up Analysis
          </p>
          <YearSelect
            value={followUpYearFilter}
            onChange={setFollowUpYearFilter}
            options={last3Years}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Upcoming and completed follow-ups
        </p>
      </div>

      <div className="flex-1 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={followUpChartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              padding={{ left: 15, right: 15 }}
              tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600, dy: 8 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              width={28}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280", dx: -4 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-100 px-3 py-2 rounded-xl shadow-lg text-xs">
                      <p className="font-bold text-gray-800 mb-1">
                        {item.name}
                      </p>
                      <p className="font-semibold" style={{ color: "#10B981" }}>
                        ✓ Completed: {item.completed}
                      </p>
                      <p className="font-semibold" style={{ color: "#d87612" }}>
                        ↑ Upcoming: {item.upcoming}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed Follow-ups"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 4, stroke: "#10B981", strokeWidth: 2, fill: "white" }}
              activeDot={{
                r: 6,
                stroke: "#10B981",
                strokeWidth: 2,
                fill: "#10B981",
              }}
            />
            <Line
              type="monotone"
              dataKey="upcoming"
              name="Upcoming Follow-ups"
              stroke="#d87612"
              strokeWidth={2.5}
              dot={{ r: 4, stroke: "#d87612", strokeWidth: 2, fill: "white" }}
              activeDot={{
                r: 6,
                stroke: "#d87612",
                strokeWidth: 2,
                fill: "#d87612",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend box at the bottom */}
      <div className="mt-2 shrink-0 flex items-center justify-center gap-6 py-1 px-4 ">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#10B981]"></span>
          <span className="text-[12px] font-semibold text-gray-500">
            Completed Follow-ups
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#d87612]"></span>
          <span className="text-[12px] font-semibold text-gray-500">
            Upcoming Follow-ups
          </span>
        </div>
      </div>
    </div>
  );
}
