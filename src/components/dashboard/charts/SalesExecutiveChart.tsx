import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";
import { YearSelect, TruncatedNameTick } from "./Shared";

interface SalesExecutiveChartProps {
  salesExecutiveFilter: number;
  setSalesExecutiveFilter: (val: number) => void;
  allSalesExecutives: any[];
  salesExecutiveChartData: any[];
}

export default function SalesExecutiveChart({ salesExecutiveFilter, setSalesExecutiveFilter, allSalesExecutives, salesExecutiveChartData }: SalesExecutiveChartProps) {
  return (
  
    <div className="flex flex-col rounded-2xl border border-gray-100 p-6 min-w-0 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-h-[450px]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-semibold text-gray-900">
              Sales Executive
            </h3>
            <span className="inline-flex items-center bg-orange-50 text-[#d87612] border border-orange-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {totalStaffLeads} Total Leads
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Lead status performance by assigned executive
          </p>
        </div>
      </div>

      <div className="relative w-full">
        {/* Fixed Y-Axis */}
        <div className="absolute left-0 top-0 h-[320px] z-10 bg-white pr-2 pointer-events-none">
          <BarChart
            width={35}
            height={320}
            data={staffWinRate}
            margin={{ top: 5, right: 0, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#4b5563" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#4b5563" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Bar dataKey="New lead" stackId="a" opacity={0} />
            <Bar dataKey="Lost" stackId="a" opacity={0} />
            <Bar dataKey="Won" stackId="a" opacity={0} />
          </BarChart>
        </div>
        {/* Scrollable Chart */}
        <div
          ref={staffChartContainerRef}
          className="h-[335px] w-full overflow-x-auto scrollbar-thin dashboard-scrollbar"
        >
          <BarChart
            width={Math.max(
              staffChartWidth,
              staffWinRate.length * (staffChartWidth / 6),
            )}
            height={320}
            data={staffWinRate}
            margin={{ top: 5, right: 10, left: 35, bottom: 5 }}
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
            <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
            <Tooltip
              cursor={false}
              wrapperStyle={{ zIndex: 100 }}
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-gray-900 mb-2">
                        {payload[0]?.payload?.name}
                      </p>
                      {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.fill }}>
                          {p.name}: <span className="font-bold">{p.value}</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
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
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="New Lead"
              stackId="a"
              fill="#fb923c"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </div>

        {/* Custom Legend */}
        <div className="flex items-center justify-center gap-6 text-[11px] font-semibold text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" />
            <span>New Lead</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B22222]" />
            <span>Lost</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00bc7d]" />
            <span>Won</span>
          </div>
        </div>
      </div>
    </div>
  );
}
