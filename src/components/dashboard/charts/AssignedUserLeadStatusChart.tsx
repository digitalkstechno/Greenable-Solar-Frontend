import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";
import { YearSelect, TruncatedNameTick } from "./Shared";

interface AssignedUserLeadStatusChartProps {
  userFilter: string;
  setUserFilter: (val: string) => void;
  assignedUsers: { _id: string; name: string }[];
  assignedUserLeadStatusData: any[];
}

export default function AssignedUserLeadStatusChart({ userFilter, setUserFilter, assignedUsers, assignedUserLeadStatusData }: AssignedUserLeadStatusChartProps) {
  return (
  
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow min-h-[450px] flex flex-col justify-between">
      <div className="flex flex-col mb-4 shrink-0">
        <p className="text-xl font-semibold text-gray-900">
          Lead Assignment Overview
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Lead status performance by assigned executive
        </p>
      </div>

      <div className="flex-1 mt-4" style={{ minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* <BarChart data={staffWinRate} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}> */}
          <BarChart
            width={Math.max(
              staffChartWidth,
              staffWinRate.length * (staffChartWidth / 6),
            )}
            height={320}
            data={staffWinRate}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            barSize={35}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              tick={<TruncatedNameTick />}
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
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-gray-900 mb-2">
                        {payload[0]?.payload?.name}
                      </p>
                      {payload.map((p: any) => (
                        <p
                          key={p.name}
                          style={{ color: p.fill }}
                          className="font-semibold"
                        >
                          {p.name}:{" "}
                          <span className="font-bold" style={{ color: p.fill }}>
                            {p.value}
                          </span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="New Lead"
              stackId="a"
              fill="#fb923c"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="Won"
              stackId="a"
              fill="#00bc7d"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="Lost"
              stackId="a"
              fill="#B22222"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 shrink-0 flex items-center justify-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#fb923c]"></span>
          <span className="text-[12px] font-semibold text-gray-500">
            New Lead
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#00bc7d]"></span>
          <span className="text-[12px] font-semibold text-gray-500">Won</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#B22222]"></span>
          <span className="text-[12px] font-semibold text-gray-500">Lost</span>
        </div>
      </div>
    </div>
  );
}
