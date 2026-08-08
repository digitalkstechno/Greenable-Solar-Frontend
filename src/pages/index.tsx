"use client";

import { useEffect, useState, useRef } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  User,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Star,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  PhoneCall,
  Mail as MailIcon,
  MessageSquare,
  PieChartIcon,
  RefreshCw,
} from "lucide-react";
import { FiEye } from 'react-icons/fi';
import axios from "axios";
import { baseUrl, getAuthToken } from "@/config";
import moment from "moment";
import ChartsSection from "@/components/dashboard/ChartsSection";
import DashboardLeadUpdateDialog from "@/components/leads/DashboardLeadUpdateDialog";
import Calendar from "@/components/ui/Calendar";

interface StatusCount {
  statusId: string;
  statusName: string;
  count: number;
}

interface LeadSummary {
  totalLeads: number;
  currentMonthLeads: number;
  totalRevenue: number;
  followUps: number;
  statusWiseCounts: StatusCount[];
}

interface SummaryCard {
  key: string;
  label: string;
  value: number | string;
  trend?: number;
  tone?: "up" | "down" | "neutral";
  Icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  type: "total" | "month" | "status" | "revenue" | "custom";
  statusId?: string;
  fill?: string;
  name?: string;
  description?: string;
}

const ITEMS_PER_PAGE = 5;
export default function Dashboard() {
  const router = useRouter();

  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [leadsBySource, setLeadsBySource] = useState<
    { name: string; value: number; fill: string }[]
  >([]);
  const [staffPerformance, setStaffPerformance] = useState<
    { name: string; converted: number; pending: number; lost: number }[]
  >([]);

  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1);
  const [upcomingFollowups, setUpcomingFollowups] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [visibleStatusNames, setVisibleStatusNames] = useState<string[] | null>(
    null,
  );
  const [duePage, setDuePage] = useState(1);
  const [dueTotalPages, setDueTotalPages] = useState(1);
  const [dueFollowups, setDueFollowups] = useState<any[]>([]);
  const [dueLoading, setDueLoading] = useState(false);

  const [isUpdateLeadDialogOpen, setIsUpdateLeadDialogOpen] = useState(false);
  const [selectedLeadForUpdate, setSelectedLeadForUpdate] = useState<any>(null);

  const [updateSource, setUpdateSource] = useState<"upcoming" | "due" | null>(null);

  const [permissions, setPermissions] = useState<{
    readAll: boolean;
    readOwn: boolean;
  }>({ readAll: false, readOwn: false });
  const [dashboardPermission, setDashboardPermission] = useState<boolean | null>(null); // null = loading
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const roleStr =
    `${user?.role?.roleName || ""} ${user?.role?.name || ""} ${user?.roleName || ""} ${typeof user?.department === "string" ? user.department : ""} ${user?.department?.roleName || ""} ${user?.department?.name || ""} ${user?.departmentName || ""}`.toLowerCase();
  const isSalesUser = roleStr.includes("sales");
  const isCallingUser =
    (
      user?.role?.roleName ||
      user?.roleName ||
      user?.department ||
      ""
    ).toLowerCase() === "calling";
  const userScope: "admin" | "sales" | "calling" = isCallingUser
    ? "calling"
    : isSalesUser
      ? "sales"
      : "admin";

  const datePresetToRange = (preset: typeof datePreset): string | undefined => {
    if (!preset) return undefined;
    const map: Record<string, string> = {
      "today": "today",
      "this-month": "thisMonth",
      "prev-month": "previousMonth",
      "this-year": "thisYear",
      "custom": "custom",
    };
    return map[preset];
  };

  const getInitialDates = (
    preset: "today" | "this-month" | "prev-month" | "this-year" | "custom",
  ) => {
    const now = new Date();
    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${date}`;
    };

    if (preset === "today") {
      return { from: format(now), to: format(now) };
    } else if (preset === "this-month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: format(start), to: format(end) };
    } else if (preset === "prev-month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: format(start), to: format(end) };
    } else if (preset === "this-year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { from: format(start), to: format(end) };
    }
    return { from: "", to: "" };
  };

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [datePreset, setDatePreset] = useState<
    "today" | "this-month" | "prev-month" | "this-year" | "custom" | null
  >(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [statusView, setStatusView] = useState<"pie" | "graph">("pie");

  const applyDatePreset = (
    preset: "today" | "this-month" | "prev-month" | "this-year" | "custom",
  ) => {
    if (datePreset === preset) {
      setDatePreset(null);
      setFromDate("");
      setToDate("");
    } else {
      setDatePreset(preset);
      const currentYear = new Date().getFullYear();
      setKwFilter(currentYear);
      setRevenueFilter(currentYear);
      if (preset === "custom") return;
      const dates = getInitialDates(preset);
      setFromDate(dates.from);
      setToDate(dates.to);
    }
  };

  const [kwGrowthData, setKwGrowthData] = useState<any[]>([]);
  const [kwFilter, setKwFilter] = useState<number>(new Date().getFullYear());
  const [staffWinRate, setStaffWinRate] = useState<any[]>([]);
  const [staffFilter, setStaffWinFilter] = useState<
    "all" | "week" | "month" | "year"
  >("all");
  const [totalKw, setTotalKw] = useState(0);
  const [totalStaffLeads, setTotalStaffLeads] = useState(0);
  const [revenueGrowthData, setRevenueGrowthData] = useState<any[]>([]);
  const [revenueFilter, setRevenueFilter] = useState<number>(
    new Date().getFullYear(),
  );
  const [totalRevenueChart, setTotalRevenueChart] = useState(0);
  const [followUpChartData, setFollowUpChartData] = useState<any[]>([]);
  const [followUpYearFilter, setFollowUpYearFilter] = useState<number>(
    new Date().getFullYear(),
  );
  const last3Years = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  const token = typeof window !== "undefined" ? getAuthToken() : null;

  useEffect(() => {
    if (!token) return;
    axios
      .get(baseUrl.currentStaff, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const staff = res.data?.data || {};
        setUser(staff);
        const role = staff.role || {};
        const rawPerms = Array.isArray(role.permissions)
          ? role.permissions[0]
          : role.permissions || {};
        const lp = rawPerms.lead || {};
        setPermissions({
          readAll: !!lp.readAll,
          readOwn: !!lp.readOwn,
        });
        const dp = rawPerms.dashboard || {};
        setDashboardPermission(!!dp.readAll);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "crm_user",
            JSON.stringify({ token, staff }),
          );
        }
      })
      .catch(() => {
        setDashboardPermission(false);
      });
  }, [token]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentToken = getAuthToken();
      const saved = window.localStorage.getItem("crm_user");
      if (saved && currentToken) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.token === currentToken) {
            const staff = parsed.staff || {};
            setUser(staff);
            const role = staff.role || {};
            const rawPerms = Array.isArray(role.permissions)
              ? role.permissions[0]
              : role.permissions || {};
            const lp = rawPerms.lead || {};
            setPermissions({
              readAll: !!lp.readAll,
              readOwn: !!lp.readOwn,
            });
            const dp = rawPerms.dashboard || {};
            setDashboardPermission(!!dp.readAll);
          }
        } catch (err) {
          console.error("Failed to restore cached user info:", err);
        }
      }
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  useEffect(() => {
    if (dashboardPermission === false) {
      router.replace("/leads");
    }
  }, [dashboardPermission, router]);

  const statusChartContainerRef = useRef<HTMLDivElement>(null);
  const [statusChartWidth, setStatusChartWidth] = useState(800);
  const staffChartContainerRef = useRef<HTMLDivElement>(null);
  const [staffChartWidth, setStaffChartWidth] = useState(800);

  useEffect(() => {
    const updateWidths = () => {
      if (statusChartContainerRef.current)
        setStatusChartWidth(statusChartContainerRef.current.offsetWidth);
      if (staffChartContainerRef.current)
        setStaffChartWidth(staffChartContainerRef.current.offsetWidth);
    };
    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, [statusView, staffWinRate]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-700 border-blue-200",
      Contacted: "bg-purple-100 text-purple-700 border-purple-200",
      "Follow-Up": "bg-orange-100 text-orange-700 border-orange-200",
      Interested: "bg-green-100 text-green-700 border-green-200",
      Qualified: "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Not Interested": "bg-gray-100 text-gray-700 border-gray-200",
      Lost: "bg-red-100 text-red-700 border-red-200",
      Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

 



  const colorPalette = [
    "#F59E0B",
    "#EF4444",
    "#f97316",
    "#fb923c",
    "#c2410c",
    "#ea580c",
    "#fdba74",
    "#fed7aa",
    "#d87612",
    "#d87612",
  ];

  const fetchDashboard = async () => {
    if (!token) return;
    try {
      const range = datePresetToRange(datePreset);
      const res = await axios.get(baseUrl.dashboard, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          range: range || undefined,
          from: datePreset === "custom" ? fromDate : undefined,
          to: datePreset === "custom" ? toDate : undefined,
        },
      });
      const { counts, charts } = res.data?.data || {};

      setSummary({
        totalLeads: counts?.totalLeads || 0,
        currentMonthLeads: 0,
        totalRevenue: counts?.totalRevenue || 0,
        followUps: counts?.followUps || 0,
        statusWiseCounts: (charts?.leadStatus || []).map((s: any) => ({
          statusId: "",
          statusName: s.status,
          count: s.count,
        })),
      });

      if (charts?.salesExecutive) {
        const staffData = charts.salesExecutive.map((s: any) => ({
          name: s.salesName,
          Won: s.won || 0,
          Lost: s.lost || 0,
          "In Progress": 0,
          "New Lead": s.newLead || 0,
        }));
        setStaffWinRate(staffData);
        setTotalStaffLeads(
          staffData.reduce(
            (sum: number, s: any) => sum + s.Won + s.Lost + s["New Lead"],
            0,
          ),
        );
      }

      if (charts?.leadSource) {
        setLeadsBySource(
          charts.leadSource.map((s: any, idx: number) => ({
            name: s.source,
            value: s.count,
            fill: colorPalette[idx % colorPalette.length],
          })),
        );
      }

      if (charts?.leadAssignment) {
        const staffData = charts.leadAssignment.map((s: any) => ({
          name: s.salesName,
          Won: s.won || 0,
          Lost: s.lost || 0,
          "In Progress": 0,
          "New Lead": s.newLead || 0,
        }));
        setStaffWinRate(staffData);
        setTotalStaffLeads(
          staffData.reduce(
            (sum: number, s: any) => sum + s.Won + s.Lost + s["New Lead"],
            0,
          ),
        );
      }
    } catch (err) {
      console.error("Dashboard API error:", err);
    }
  };

  const fetchRevenueChart = async (yearFilter: number) => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.dashboardRevenue, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: yearFilter },
      });
      const { chart, totalRevenue } = res.data?.data || {};
      const chartData = (chart || []).map((d: any) => ({
        name: d.month,
        amt: d.revenue || 0,
      }));
      const maxAmt = Math.max(...chartData.map((d: any) => d.amt), 0);
      const chartDataWithLine = chartData.map((d: any) => ({
        ...d,
        lineAmt: d.amt > 0 ? d.amt + maxAmt * 0.1 : 0,
      }));
      setTotalRevenueChart(totalRevenue || 0);
      setRevenueGrowthData(chartDataWithLine);
    } catch (err) {
      console.error("Revenue Chart error:", err);
    }
  };

  const fetchKwGrowthChart = async (yearFilter: number) => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.dashboardKwGrowth, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: yearFilter },
      });
      const { chart, totalKwGrowth } = res.data?.data || {};
      const chartData = (chart || []).map((d: any) => ({
        name: d.month,
        kw: d.kw || 0,
      }));
      setTotalKw(totalKwGrowth || 0);
      setKwGrowthData(chartData);
    } catch (err) {
      console.error("KW Growth Chart error:", err);
    }
  };

  const fetchFollowupAnalysis = async (yearFilter: number) => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.dashboardFollowupAnalysis, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: yearFilter },
      });
      const { chart } = res.data?.data || {};
      const chartData = (chart || []).map((d: any) => ({
        name: d.month,
        upcoming: d.upcoming || 0,
        completed: d.completed || 0,
      }));
      setFollowUpChartData(chartData);
    } catch (err) {
      console.error("Follow-up Analysis error:", err);
    }
  };

  const fetchUpcomingFollowups = async (page: number) => {
    if (!token) return;
    setUpcomingLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly
        ? baseUrl.leadUpcomingFollowupsMy
        : baseUrl.leadUpcomingFollowups;
      const res = await axios.get(
        `${url}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const { data, pagination } = res.data;
      setUpcomingFollowups(data || []);
      setUpcomingTotalPages(pagination?.totalPages || 1);
      setUpcomingPage(pagination?.currentPage || 1);
    } catch (err) {
      console.error("Upcoming followups error:", err);
      setUpcomingFollowups([]);
    } finally {
      setUpcomingLoading(false);
    }
  };

  const fetchDueFollowups = async (page?: number) => {
    if (!token) return;
    setDueLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly
        ? baseUrl.leadDueFollowupsMy
        : baseUrl.leadDueFollowups;
      const res = await axios.get(
        `${url}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const { data, pagination } = res.data;
      setDueFollowups(data || []);
      setDueTotalPages(pagination?.totalPages || 1);
      setDuePage(pagination?.currentPage || 1);
    } catch (err) {
      console.error("Due followups error:", err);
      setDueFollowups([]);
    } finally {
      setDueLoading(false);
    }
  };

  const handleFromDateChange = (date: Date | null) => {
    if (!date) {
      setFromDate("");
    } else {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      setFromDate(`${y}-${m}-${d}`);
      if (toDate) {
        const currentToDate = new Date(toDate + "T00:00:00");
        if (currentToDate < date) {
          setToDate("");
        }
      }
    }
  };

  const handleToDateChange = (date: Date | null) => {
    if (!date) {
      setToDate("");
    } else {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      setToDate(`${y}-${m}-${d}`);
    }
  };

  const handleResetDates = () => {
    setFromDate("");
    setToDate("");
  };

  useEffect(() => {
    if (!hasLoadedFromStorage || !token || !user?._id || dashboardPermission !== true) return;
    fetchDashboard();
    // fetchUpcomingFollowups(1);
    // fetchDueFollowups();
  }, [token, user?._id, fromDate, toDate, datePreset, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage || !token || !user?._id || dashboardPermission !== true) return;
    fetchUpcomingFollowups(1);
    fetchDueFollowups();
  }, [token, user?._id, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage || !token || !user?._id || dashboardPermission !== true) return;
    if (userScope === "calling") return;
    fetchRevenueChart(revenueFilter);
  }, [token, user?._id, userScope, revenueFilter, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage || !token || !user?._id || dashboardPermission !== true) return;
    if (userScope === "calling") return;
    fetchKwGrowthChart(kwFilter);
  }, [token, user?._id, userScope, kwFilter, hasLoadedFromStorage]);


  useEffect(() => {
    if (!hasLoadedFromStorage || !token || !user?._id || dashboardPermission !== true) return;
    if (userScope === "admin") return; 
    fetchFollowupAnalysis(followUpYearFilter);
  }, [token, user?._id, userScope, followUpYearFilter, hasLoadedFromStorage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPreset = window.localStorage.getItem("dashboardDatePreset");
      const storedFromDate = window.localStorage.getItem("dashboardFromDate");
      const storedToDate = window.localStorage.getItem("dashboardToDate");

      if (
        storedPreset !== null ||
        storedFromDate !== null ||
        storedToDate !== null
      ) {
        setDatePreset(storedPreset as any);
        setFromDate(storedFromDate || "");
        setToDate(storedToDate || "");
      } else {
        const initial = getInitialDates("this-month");
        setFromDate(initial.from);
        setToDate(initial.to);
        setDatePreset("this-month");
      }
      setHasLoadedFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedFromStorage && typeof window !== "undefined") {
      if (datePreset) {
        window.localStorage.setItem("dashboardDatePreset", datePreset);
      } else {
        window.localStorage.removeItem("dashboardDatePreset");
      }
      window.localStorage.setItem("dashboardFromDate", fromDate);
      window.localStorage.setItem("dashboardToDate", toDate);
    }
  }, [fromDate, toDate, datePreset, hasLoadedFromStorage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("kanbanVisibleStatusNames");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setVisibleStatusNames(parsed.filter((x) => typeof x === "string"));
          }
        } catch { }
      }
    }
  }, []);

  const statusColorPalette = [
    "#d87612",
    "#f97316",
    "#fb923c",
    "#c2410c",
    "#ea580c",
    "#f59e0b",
    "#fdba74",
    "#fed7aa", 
  ];

  const getStatusCount = (statusName: string) => {
    if (!summary?.statusWiseCounts) return 0;
    const found = summary.statusWiseCounts.find(
      (s: any) =>
        s.statusName?.toLowerCase().replace(/\s+/g, "") ===
        statusName.toLowerCase().replace(/\s+/g, ""),
    );
    return found ? found.count : 0;
  };

  const getStatusId = (statusName: string) => {
    if (!summary?.statusWiseCounts) return "";
    const found = summary.statusWiseCounts.find(
      (s: any) =>
        s.statusName?.toLowerCase().replace(/\s+/g, "") ===
        statusName.toLowerCase().replace(/\s+/g, ""),
    );
    return found ? String(found.statusId) : "";
  };

  const summaryCards: any[] = summary
    ? [
      {
        key: "total",
        label: "Total Leads",
        value: summary.totalLeads,
        tone: "up",
        Icon: Users,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
        type: "total",
        fill: "#3B82F6",
        name: "Total Leads",
      },
      {
        key: "new",
        label: "Total New Leads",
        value: getStatusCount("New Lead"),
        tone: "up",
        Icon: TrendingUp,
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-500",
        type: "status",
        statusId: getStatusId("New Lead"),
        fill: "#8B5CF6",
        name: "New Leads",
      },
      {
        key: "won",
        label: "Total Won Leads",
        value: getStatusCount("Won"),
        trend: 0,
        tone: "neutral",
        Icon: CheckCircle2,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
        type: "status",
        statusId: getStatusId("Won"),
        fill: "#10B981",
        name: "Won Leads",
      },
      {
        key: "lost",
        label: "Total Lost Leads",
        value: getStatusCount("Lost"),
        trend: 0,
        tone: "neutral",
        Icon: XCircle,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
        type: "status",
        statusId: getStatusId("Lost"),
        fill: "#EF4444",
        name: "Lost Leads",
      },
      {
        key: "followups",
        label: "Follow-ups",
        value: summary.followUps,
        trend: 0,
        tone: "neutral",
        Icon: PhoneCall,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
        type: "custom",
        fill: "#F59E0B",
        name: "Follow-ups",
      },
      ...(!isCallingUser
        ? [
          {
            key: "revenue",
            label: "Total Revenue",
            value: `₹${(summary.totalRevenue || 0).toLocaleString()}`,
            trend: 15.4,
            tone: "up",
            Icon: Activity,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            type: "revenue",
            fill: "#F59E0B",
            name: "Revenue",
            description: "Total from won leads",
          },
        ]
        : []),
    ]
    : [];

  const statusChartData =
    summary?.statusWiseCounts?.map((s, idx) => ({
      name: s.statusName,
      value: s.count,
      fill: statusColorPalette[idx % statusColorPalette.length],
    })) || [];

  const pieChartData = statusChartData.filter((s) => s.value > 0);



  const renderFollowupTable = (
    title: string,
    items: any[],
    loading: boolean,
    page: number,
    totalPages: number,
    setPage: (p: number) => void,
    dateHeader: string = "Follow up Date",
  ) => (
    <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden h-full flex flex-col transition-all hover:shadow-lg">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${dateHeader === "Follow up Date" ? "bg-orange-50" : "bg-red-50"}`}
            >
              {dateHeader === "Follow up Date" ? (
                <Clock className="h-5 w-5 text-[#d87612]" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${dateHeader === "Follow up Date"
              ? "bg-orange-50 text-[#d87612] border border-orange-100"
              : "bg-red-50 text-red-700 border border-red-100"
              }`}
          >
            {items.length} {items.length === 1 ? "Lead" : "Leads"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex-1 flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#d87612] border-r-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-gray-50 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No follow-ups found</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto overflow-y-auto max-h-[360px] flex-1 p-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm text-gray-500 font-semibold tracking-wider"
                  >
                    Lead Name & Contact
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm text-gray-500 font-semibold tracking-wider"
                  >
                    Schedule
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm text-gray-500 font-semibold tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-sm text-gray-500 font-semibold tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.map((lead, index) => (
                  <tr
                    key={lead._id || lead.id || index}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm">
                        {lead.fullName || "Unknown"}
                      </div>
                      {lead.contact && (
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 font-medium">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {lead.contact}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        {lead.nextFollowupDate
                          ? moment(lead.nextFollowupDate).format("DD-MM-YYYY")
                          : "-"}
                      </div>
                      {lead.nextFollowupTime && (
                        <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                          {lead.nextFollowupTime}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${getStatusColor(
                          lead.leadStatus?.name || "",
                        )}`}
                      >
                        {lead.leadStatus?.name || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadForUpdate(lead);
                            setIsUpdateLeadDialogOpen(true);
                            setUpdateSource(dateHeader === "Follow up Date" ? "upcoming" : "due");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-100 text-[#d87612] border border-orange-200/30 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <FiEye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <span className="text-xs font-medium text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (dashboardPermission === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#d87612] border-r-transparent"></div>
      </div>
    );
  }

  if (dashboardPermission === false) {
    return null; 
  }

  const dashboardProps = { summary, setSummary, leadsBySource, setLeadsBySource, staffPerformance, setStaffPerformance, upcomingPage, setUpcomingPage, upcomingTotalPages, setUpcomingTotalPages, upcomingFollowups, setUpcomingFollowups, upcomingLoading, setUpcomingLoading, visibleStatusNames, setVisibleStatusNames, duePage, setDuePage, dueTotalPages, setDueTotalPages, dueFollowups, setDueFollowups, dueLoading, setDueLoading, isUpdateLeadDialogOpen, setIsUpdateLeadDialogOpen, selectedLeadForUpdate, setSelectedLeadForUpdate, updateSource, setUpdateSource, permissions, setPermissions, dashboardPermission, setDashboardPermission, user, setUser, greeting, setGreeting, fromDate, setFromDate, toDate, setToDate, datePreset, setDatePreset, hasLoadedFromStorage, setHasLoadedFromStorage, statusView, setStatusView, kwGrowthData, setKwGrowthData, kwFilter, setKwFilter, staffWinRate, setStaffWinRate, staffFilter, setStaffWinFilter, totalKw, setTotalKw, totalStaffLeads, setTotalStaffLeads, revenueGrowthData, setRevenueGrowthData, revenueFilter, setRevenueFilter, totalRevenueChart, setTotalRevenueChart, followUpChartData, setFollowUpChartData, followUpYearFilter, setFollowUpYearFilter, last3Years, statusChartContainerRef, statusChartWidth, setStatusChartWidth, staffChartContainerRef, staffChartWidth, setStaffChartWidth, isSalesUser, isCallingUser, pieChartData, statusChartData };

  return (
    <div className="flex flex-col min-h-screen dashboard-page">
      <style>{`
        .dashboard-page .dashboard-scrollbar {
          scrollbar-width: thin !important;
          scrollbar-color: #4b5563 #f1f5f9 !important;
        }
        .dashboard-page .dashboard-scrollbar::-webkit-scrollbar {
          width: 6px !important;
          height: 8px !important;
        }
        .dashboard-page .dashboard-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 9999px !important;
        }
        .dashboard-page .dashboard-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 9999px !important;
        }
        .dashboard-page .dashboard-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
      `}</style>
      <div className="flex-1 space-y-8 min-w-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {greeting &&
                (user
                  ? `${greeting}, ${user?.fullName?.split(" ")[0] || "Admin"}! 👋`
                  : `${greeting}! 👋`)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's what's happening with your leads today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 self-stretch md:self-auto justify-end">
            {(
              [
                "today",
                "this-month",
                "prev-month",
                "this-year",
                "custom",
              ] as const
            ).map((p) => {
              const labelMap = {
                today: "Today",
                "this-month": "This Month",
                "prev-month": "Previous Month",
                "this-year": "This Year",
                custom: "Custom",
              };
              return (
                <button
                  key={p}
                  onClick={() => applyDatePreset(p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${datePreset === p
                    ? "bg-[#d87612] text-white shadow-sm shadow-[#d87612]/20"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                    }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}

            {datePreset === "custom" && (
              <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-2xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative w-40">
                    <label className="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-[#d87612] uppercase tracking-widest z-10">
                      From Date
                    </label>
                    <Calendar
                      value={fromDate ? new Date(fromDate + "T00:00:00") : null}
                      onChange={handleFromDateChange}
                      placeholder="Select from date"
                      className="!py-1.5 !border-[#d87612]/30 hover:!border-[#d87612]"
                    />
                  </div>
                  <div className="relative w-40">
                    <label className="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-[#d87612] uppercase tracking-widest z-10">
                      To Date
                    </label>
                    <Calendar
                      value={toDate ? new Date(toDate + "T00:00:00") : null}
                      onChange={handleToDateChange}
                      minDate={
                        fromDate ? new Date(fromDate + "T00:00:00") : undefined
                      }
                      placeholder="Select to date"
                      className="!py-1.5 !border-[#d87612]/30 hover:!border-[#d87612]"
                      align="right"
                    />
                  </div>
                </div>
                {(fromDate || toDate) && (
                  <button
                    onClick={handleResetDates}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-lg cursor-pointer"
                    title="Reset Filter"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className={`grid grid-cols-2 md:grid-cols-3 ${isCallingUser ? "xl:grid-cols-5" : "xl:grid-cols-6"} gap-6`}
        >
          {summaryCards.map((card) => (
            <div
              key={card.key}
              className={`group flex items-center gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 min-w-0 cursor-pointer ${card.type === "status" && card.statusId
                ? "hover:border-gray-300"
                : ""
                }`}
            >
              <div
                className={`p-3 rounded-xl ${card.iconBg} ${card.iconColor} transition-transform duration-300 group-hover:scale-110 shrink-0`}
              >
                <card.Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] text-gray-500 tracking-wider truncate">
                  {card.label}
                </h3>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl text-gray-900">{card.value}</span>
                  {card.subtitle && (
                    <span className="text-xs text-gray-400">
                      {card.subtitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

<ChartsSection props={dashboardProps} />

        
        {/* Row 2: Follow-ups */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          id="upcoming-followups-section"
        >
          <div className="h-full min-h-[450px]">
            {renderFollowupTable(
              "Upcoming Follow-ups",
              upcomingFollowups,
              upcomingLoading,
              upcomingPage,
              upcomingTotalPages,
              (p) => {
                if (p >= 1 && p <= upcomingTotalPages)
                  fetchUpcomingFollowups(p);
              },
              "Follow up Date",
            )}
          </div>
          <div className="h-full min-h-[450px]">
            {renderFollowupTable(
              "Overdue Follow-ups",
              dueFollowups,
              dueLoading,
              duePage,
              dueTotalPages,
              (p) => {
                if (p >= 1 && p <= dueTotalPages) fetchDueFollowups(p);
              },
              "Due Date",
            )}
          </div>
        </div>
      </div>

      {isUpdateLeadDialogOpen && (
        <DashboardLeadUpdateDialog
          isOpen={isUpdateLeadDialogOpen}
          onClose={() => {
            setIsUpdateLeadDialogOpen(false);
            setSelectedLeadForUpdate(null);
            setUpdateSource(null);
          }}
          lead={selectedLeadForUpdate}
          // onSuccess={() => {
          //   fetchDashboard();
          //   fetchUpcomingFollowups(upcomingPage);
          //   fetchDueFollowups(duePage);
          // }}
          onSuccess={() => {
            if (updateSource === "upcoming") {
              fetchUpcomingFollowups(upcomingPage);
            } else if (updateSource === "due") {
              fetchDueFollowups(duePage);
            }
          }}
        />
      )}
    </div>
  );
}
