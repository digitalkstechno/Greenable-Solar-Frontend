import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, Line, LineChart } from "recharts";

interface YearSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
}

function YearSelect({ value, onChange, options }: YearSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-24 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-800 shadow-sm hover:border-orange-300 focus:outline-none transition-all cursor-pointer"
      >
        <span>{value}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 ${isOpen ? "rotate-180 text-[#d87612]" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-24 rounded-xl shadow-lg bg-white border border-gray-100 focus:outline-none z-50 overflow-hidden py-1">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-all ${option === value
                ? "bg-[#d87612] text-white"
                : "text-gray-700 hover:bg-orange-50 hover:text-[#d87612]"
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TruncatedNameTick = (props: any) => {
  const { x, y, payload } = props;
  const fullName = String(payload?.value ?? '');
  const firstName = fullName.split(' ')[0] || fullName;
  const displayText = fullName.length > firstName.length ? `${firstName}...` : firstName;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#4b5563"
        fontSize={12}
        fontWeight="600"
        style={{ cursor: 'default' }}
      >
        {displayText}
        <title>{fullName}</title>
      </text>
    </g>
  );
};


export default function ChartsSection({ props }: { props: any }) {
  const { summary, setSummary, leadsBySource, setLeadsBySource, staffPerformance, setStaffPerformance, upcomingPage, setUpcomingPage, upcomingTotalPages, setUpcomingTotalPages, upcomingFollowups, setUpcomingFollowups, upcomingLoading, setUpcomingLoading, visibleStatusNames, setVisibleStatusNames, duePage, setDuePage, dueTotalPages, setDueTotalPages, dueFollowups, setDueFollowups, dueLoading, setDueLoading, isUpdateLeadDialogOpen, setIsUpdateLeadDialogOpen, selectedLeadForUpdate, setSelectedLeadForUpdate, updateSource, setUpdateSource, permissions, setPermissions, dashboardPermission, setDashboardPermission, user, setUser, greeting, setGreeting, fromDate, setFromDate, toDate, setToDate, datePreset, setDatePreset, hasLoadedFromStorage, setHasLoadedFromStorage, statusView, setStatusView, kwGrowthData, setKwGrowthData, kwFilter, setKwFilter, staffWinRate, setStaffWinRate, staffFilter, setStaffWinFilter, totalKw, setTotalKw, totalStaffLeads, setTotalStaffLeads, revenueGrowthData, setRevenueGrowthData, revenueFilter, setRevenueFilter, totalRevenueChart, setTotalRevenueChart, followUpChartData, setFollowUpChartData, followUpYearFilter, setFollowUpYearFilter, last3Years, statusChartContainerRef, statusChartWidth, setStatusChartWidth, staffChartContainerRef, staffChartWidth, setStaffChartWidth, isSalesUser, isCallingUser, pieChartData, statusChartData } = props;

  const salesExecutiveCard = (
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

  const totalRevenueCard = (
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

  const leadStatusCard = (
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

  const totalKwCard = (
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

  const followUpCard = (
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
  const leadSourceCard = (
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

  const assignedUserLeadStatusCard = (
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


  return (
    <>
        {/* Charts Section */}
        {isSalesUser ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {totalRevenueCard}
              {totalKwCard}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {leadStatusCard}
              {followUpCard}
            </div>
          </div>
        ) : isCallingUser ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {leadSourceCard}
              {assignedUserLeadStatusCard}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {leadStatusCard}
              {followUpCard}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[450px]">
              {salesExecutiveCard}
              {totalRevenueCard}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {leadStatusCard}
              {totalKwCard}
            </div>
          </>
        )}

    </>
  );
}
