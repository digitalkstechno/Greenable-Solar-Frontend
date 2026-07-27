import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";
import { YearSelect, TruncatedNameTick } from "./Shared";

interface LeadStatusChartProps {
  statusFilter: number;
  setStatusFilter: (val: number) => void;
  last5Years: number[];
  statusChartData: any[];
  isSalesUser: boolean;
}

export default function LeadStatusChart({ statusFilter, setStatusFilter, last5Years, statusChartData, isSalesUser }: LeadStatusChartProps) {
  return (
  
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full min-h-[450px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Lead Status Overview
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Performance by status categories
          </p>
        </div>
        {!(isSalesUser || isCallingUser) && (
          <div className="flex flex-wrap items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
            <button
              onClick={() => setStatusView("pie")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusView === "pie"
                ? "bg-[#d87612] text-white"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              Pie
            </button>
            <button
              onClick={() => setStatusView("graph")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusView === "graph"
                ? "bg-[#d87612] text-white"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              Graph
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {statusView === "pie" || isSalesUser || isCallingUser ? (
          <div className="flex flex-col xl:flex-row items-center justify-center gap-6 xl:gap-8">
            <div
              className="relative h-[260px] w-[350px] shrink-0"
              style={{ perspective: "800px" }}
            >
              {/* 2D Donut Chart */}
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={125}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const matchedStatus = statusChartData.find(
                            (s) =>
                              s.name?.toLowerCase().replace(/\s+/g, "") ===
                              payload[0].name
                                ?.toLowerCase()
                                .replace(/\s+/g, ""),
                          );
                          const actualColor = matchedStatus?.fill || "#d87612";
                          return (
                            <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-gray-900">
                                {payload[0].name}
                              </p>
                              <p
                                className="font-semibold"
                                style={{ color: actualColor }}
                              >
                                {payload[0].value} Leads
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 flex-1 w-full dashboard-scrollbar">
              {statusChartData.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 ml-1 p-2 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-default"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: s.fill }}
                  ></div>
                  <span className="text-sm font-bold text-gray-700 flex-1 truncate">
                    {s.name}
                  </span>
                  <span
                    className="text-sm font-semibold bg-white px-2.5 py-1 rounded-lg border border-gray-100 shrink-0"
                    style={{ color: s.fill }}
                  >
                    {s.value} {s.value === 1 ? "Lead" : "Leads"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative h-[280px] w-full">
            {/* Fixed Y-Axis */}
            <div className="absolute left-0 top-0 h-[260px] z-10 bg-white pr-2 pointer-events-none">
              <BarChart
                width={35}
                height={260}
                data={statusChartData}
                margin={{ top: 10, right: 0, left: 5, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Bar dataKey="value" opacity={0} />
              </BarChart>
            </div>
            {/* Scrollable Chart */}
            <div
              ref={statusChartContainerRef}
              className="h-[280px] w-full overflow-x-auto scrollbar-thin dashboard-scrollbar"
            >
              <BarChart
                width={Math.max(
                  statusChartWidth,
                  statusChartData.length * (statusChartWidth / 8),
                )}
                height={260}
                data={statusChartData}
                margin={{ top: 10, right: 10, left: 35, bottom: 5 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#4b5563", fontWeight: "600" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                  width={0}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const actualColor =
                        statusChartData.find((s) => s.name === payload[0].name)
                          ?.fill || "#d87612";
                      return (
                        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-gray-900">
                            {payload[0].name}
                          </p>
                          <p
                            className="font-semibold"
                            style={{ color: actualColor }}
                          >
                            {payload[0].value} Leads
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
