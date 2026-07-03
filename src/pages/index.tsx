"use client";

import { useEffect, useState, useRef } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
  RadialBarChart, RadialBar,
  ComposedChart, Line, LineChart
} from "recharts";
import {
  Users,
  Award,
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
import axios from "axios";
import { baseUrl, getAuthToken } from "@/config";
import moment from "moment";
import Link from 'next/link';
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
          className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180 text-[#d87612]' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
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
                ? 'bg-[#d87612] text-white'
                : 'text-gray-700 hover:bg-orange-50 hover:text-[#d87612]'
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

export default function Dashboard() {
  const router = useRouter();

  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [leadsBySource, setLeadsBySource] = useState<
    { name: string; value: number; fill: string }[]
  >([]);
  const [staffPerformance, setStaffPerformance] = useState<
    { name: string; converted: number; pending: number; lost: number }[]
  >([]);

  // Upcoming Follow-ups (paginated)
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1);
  const [upcomingFollowups, setUpcomingFollowups] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [visibleStatusNames, setVisibleStatusNames] = useState<string[] | null>(null);
  // Due Follow-ups (paginated)
  const [duePage, setDuePage] = useState(1);
  const [dueTotalPages, setDueTotalPages] = useState(1);
  const [dueFollowups, setDueFollowups] = useState<any[]>([]);
  const [dueLoading, setDueLoading] = useState(false);

  // Today's Tasks
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [isUpdateLeadDialogOpen, setIsUpdateLeadDialogOpen] = useState(false);
  const [selectedLeadForUpdate, setSelectedLeadForUpdate] = useState<any>(null);

  const [permissions, setPermissions] = useState<{ readAll: boolean; readOwn: boolean }>({ readAll: false, readOwn: false });
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const isSalesUser = (user?.role?.roleName || user?.roleName || user?.department || '').toLowerCase() === 'sales executive' || (user?.role?.roleName || user?.roleName || user?.department || '').toLowerCase() === 'sales';
  const isCallingUser = (user?.role?.roleName || user?.roleName || user?.department || '').toLowerCase() === 'calling';
  const getInitialDates = (preset: 'today' | 'this-month' | 'prev-month' | 'this-year' | 'custom') => {
    const now = new Date();
    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${date}`;
    };

    if (preset === 'today') {
      return { from: format(now), to: format(now) };
    } else if (preset === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: format(start), to: format(end) };
    } else if (preset === 'prev-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: format(start), to: format(end) };
    } else if (preset === 'this-year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { from: format(start), to: format(end) };
    }
    return { from: "", to: "" };
  };

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [datePreset, setDatePreset] = useState<'today' | 'this-month' | 'prev-month' | 'this-year' | 'custom' | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [statusView, setStatusView] = useState<'pie' | 'graph'>('pie');

  const applyDatePreset = (preset: 'today' | 'this-month' | 'prev-month' | 'this-year' | 'custom') => {
    if (datePreset === preset) {
      setDatePreset(null);
      setFromDate("");
      setToDate("");
    } else {
      setDatePreset(preset);
      if (preset === 'custom') return;
      const dates = getInitialDates(preset);
      setFromDate(dates.from);
      setToDate(dates.to);
    }
  };

  // Graphs states
  const [kwGrowthData, setKwGrowthData] = useState<any[]>([]);
  const [kwFilter, setKwFilter] = useState<number>(new Date().getFullYear());
  const [staffWinRate, setStaffWinRate] = useState<any[]>([]);
  const [staffFilter, setStaffWinFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [totalKw, setTotalKw] = useState(0);
  const [totalStaffLeads, setTotalStaffLeads] = useState(0);
  const [revenueGrowthData, setRevenueGrowthData] = useState<any[]>([]);
  const [revenueFilter, setRevenueFilter] = useState<number>(new Date().getFullYear());
  const [totalRevenueChart, setTotalRevenueChart] = useState(0);
  const [followUpChartData, setFollowUpChartData] = useState<any[]>([]);
  const [followUpYearFilter, setFollowUpYearFilter] = useState<number>(new Date().getFullYear());
  const last3Years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  const token =
    typeof window !== "undefined" ? getAuthToken() : null;

  // Fetch user info and permissions
  useEffect(() => {
    if (!token) return;
    axios.get(baseUrl.currentStaff, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const staff = res.data?.data || {};
        setUser(staff);
        const role = staff.role || {};
        const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
        const lp = rawPerms.lead || {};
        setPermissions({
          readAll: !!lp.readAll,
          readOwn: !!lp.readOwn,
        });

        // Set greeting based on time
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
      })
      .catch(console.error);
  }, [token]);

  // Redirect if no token
  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const statusChartContainerRef = useRef<HTMLDivElement>(null);
  const [statusChartWidth, setStatusChartWidth] = useState(800);
  const staffChartContainerRef = useRef<HTMLDivElement>(null);
  const [staffChartWidth, setStaffChartWidth] = useState(800);

  useEffect(() => {
    const updateWidths = () => {
      if (statusChartContainerRef.current) setStatusChartWidth(statusChartContainerRef.current.offsetWidth);
      if (staffChartContainerRef.current) setStaffChartWidth(staffChartContainerRef.current.offsetWidth);
    };
    updateWidths();
    window.addEventListener('resize', updateWidths);
    return () => window.removeEventListener('resize', updateWidths);
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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const fetchLeadSummary = async () => {
    if (!token) return;
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.myLeadCountSummary : baseUrl.leadCountSummary;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: fromDate || undefined,
          to: toDate || undefined,
          // limit: 2,
        }
      });

      setSummary(res.data.data);
    } catch (err) {
      console.error("Lead summary error:", err);
    }
  };

  // const fetchLeadSummary = async () => {
  //   if (!token) return;
  //   try {
  //     const isMyOnly = !permissions.readAll && permissions.readOwn;
  //     const url = isMyOnly ? baseUrl.myLeadCountSummary : baseUrl.leadCountSummary;
  //     const res = await axios.get(url, {
  //       headers: { Authorization: `Bearer ${token}` },
  //       params: {
  //         from: fromDate || undefined,
  //         to: toDate || undefined,
  //       }
  //     });
  //     const data = res.data.data;
  //     if (data?.statusWiseCounts) {
  //       data.statusWiseCounts = data.statusWiseCounts.slice(0, 2); 
  //     }
  //     setSummary(data);
  //   } catch (err) {
  //     console.error("Lead summary error:", err);
  //   }
  // };

  // const fetchLeadsBySource = async () => {
  //   if (!token) return;
  //   try {
  //     const res = await axios.get(baseUrl.leadSources, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const colorPalette = [
  //       "#3B82F6", // blue-500
  //       "#10B981", // emerald-500
  //       "#F59E0B", // amber-500
  //       "#EF4444", // red-500
  //       "#8B5CF6", // violet-500
  //       "#EC4899", // pink-500
  //       "#06B6D4", // cyan-500
  //       "#84CC16", // lime-500
  //       "#F97316", // orange-500
  //       "#6366F1", // indigo-500
  //     ];

  //     const chartData = (res.data.data ?? []).map((item: any, idx: number) => ({
  //       name: item.name,
  //        value: item.count ?? item.total ?? item.leadCount ?? item.totalLeads ?? 0,
  //       fill: colorPalette[idx % colorPalette.length],
  //     }));

  //     setLeadsBySource(chartData);
  //   } catch (err) {
  //     console.error("Leads by source error:", err);
  //   }
  // };

  // const fetchLeadsBySource = async () => {
  //   if (!token) return;
  //   try {
  //     const res = await axios.get(baseUrl.getAllLeads, {
  //       headers: { Authorization: `Bearer ${token}` },
  //       params: { limit: 1000 }
  //     });
  //     const leads = res.data?.data || [];

  //     const colorPalette = [
  //       "#fb923c", 
  //       "#f97316", 
  //       "#F59E0B", 
  //       "#EF4444", 
  //       "#c2410c", 
  //       "#ea580c", 
  //       "#fdba74", 
  //       "#fed7aa", 
  //       "#d87612", 
  //       "#d87612", 
  //     ];

  //     // Apply date range filter same as other charts
  //     const filteredLeads = leads.filter((lead: any) => {
  //       const leadDate = new Date(lead.createdAt);
  //       if (fromDate) {
  //         const fromD = new Date(fromDate + 'T00:00:00');
  //         if (leadDate < fromD) return false;
  //       }
  //       if (toDate) {
  //         const toD = new Date(toDate + 'T23:59:59');
  //         if (leadDate > toD) return false;
  //       }
  //       return true;
  //     });

  //     // Group by leadrefrance field
  //     const grouped: Record<string, number> = {};
  //     filteredLeads.forEach((lead: any) => {
  //       const source = lead.leadrefrance || "Unknown";
  //       grouped[source] = (grouped[source] || 0) + 1;
  //     });

  //     const chartData = Object.entries(grouped).map(([name, value], idx) => ({
  //       name,
  //       value,
  //       fill: colorPalette[idx % colorPalette.length],
  //     }));

  //     setLeadsBySource(chartData);
  //   } catch (err) {
  //     console.error("Leads by source error:", err);
  //   }
  // };

  const fetchLeadsBySource = async () => {
    if (!token) return;
    try {
      // 1. Master lead source list (Google Search, Website Signup, Client Referral, LinkedIn Ads)
      const sourcesRes = await axios.get(baseUrl.leadSources, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const masterSources = sourcesRes.data?.data || [];

      // 2. Actual leads data
      const leadsRes = await axios.get(baseUrl.getAllLeads, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      const leads = leadsRes.data?.data || [];

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

      // Apply date range filter
      const filteredLeads = leads.filter((lead: any) => {
        const leadDate = new Date(lead.createdAt);
        if (fromDate) {
          const fromD = new Date(fromDate + 'T00:00:00');
          if (leadDate < fromD) return false;
        }
        if (toDate) {
          const toD = new Date(toDate + 'T23:59:59');
          if (leadDate > toD) return false;
        }
        return true;
      });

      // Count leads per source name
      const countMap: Record<string, number> = {};
      filteredLeads.forEach((lead: any) => {
        const source = lead.leadrefrance || "Unknown";
        countMap[source] = (countMap[source] || 0) + 1;
      });

      // Build chart data from master list first (so all sources always show)
      const chartData = masterSources
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((src: any, idx: number) => ({
          name: src.name,
          value: countMap[src.name] || 0,
          fill: colorPalette[idx % colorPalette.length],
        }));

      // Include any lead source not present in master list (e.g. "Unknown")
      Object.keys(countMap).forEach((sourceName) => {
        if (!chartData.some((c: any) => c.name === sourceName)) {
          chartData.push({
            name: sourceName,
            value: countMap[sourceName],
            fill: colorPalette[chartData.length % colorPalette.length],
          });
        }
      });

      setLeadsBySource(chartData);
    } catch (err) {
      console.error("Leads by source error:", err);
    }
  };

  const fetchStaffPerformance = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.getAllUsers, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      const chartData = (res.data.data ?? []).map((staff: any) => ({
        name: staff.fullName || "Unknown",
        converted: staff.status?.toLowerCase() === "active" ? 1 : 0,
        pending: staff.status?.toLowerCase() === "inactive" ? 1 : 0,
        lost: 0,
      }));
      setStaffPerformance(chartData);
    } catch (err) {
      console.error("Staff performance error:", err);
    }
  };

  const fetchUpcomingFollowups = async (page: number) => {
    if (!token) return;
    setUpcomingLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.leadUpcomingFollowupsMy : baseUrl.leadUpcomingFollowups;
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

  const fetchDueFollowups = async (page: number) => {
    if (!token) return;
    setDueLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.leadDueFollowupsMy : baseUrl.leadDueFollowups;
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

  const fetchTodayTasks = async () => {
    if (!token) return;
    setTasksLoading(true);
    try {
      const res = await axios.get(baseUrl.todayTasks, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayTasks(res.data?.data || []);
    } catch (err) {
      console.error("Today tasks error:", err);
      setTodayTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleFromDateChange = (date: Date | null) => {
    if (!date) {
      setFromDate("");
    } else {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setFromDate(`${y}-${m}-${d}`);
      if (toDate) {
        const currentToDate = new Date(toDate + 'T00:00:00');
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
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setToDate(`${y}-${m}-${d}`);
    }
  };

  const handleResetDates = () => {
    setFromDate("");
    setToDate("");
  };

  //Graphs 
  const fetchKwGrowth = async (filter: number) => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.getAllLeads, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      const leads = res.data?.data || [];

      const now = new Date();
      let grouped: Record<string, number> = {};

      if (datePreset === 'today') {
        const targetYear = now.getFullYear();
        const targetMonth = now.getMonth();
        const targetDate = now.getDate();
        const hourSlots = ['12 AM - 4 AM', '4 AM - 8 AM', '8 AM - 12 PM', '12 PM - 4 PM', '4 PM - 8 PM', '8 PM - 12 AM'];
        const currentHour = now.getHours();
        let limitIdx = 5;
        if (currentHour < 4) limitIdx = 0;
        else if (currentHour < 8) limitIdx = 1;
        else if (currentHour < 12) limitIdx = 2;
        else if (currentHour < 16) limitIdx = 3;
        else if (currentHour < 20) limitIdx = 4;
        else limitIdx = 5;

        const activeSlots = hourSlots.slice(0, Math.max(2, limitIdx + 1));
        activeSlots.forEach(slot => grouped[slot] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (fromDate) {
            const fromD = new Date(fromDate + 'T00:00:00');
            if (leadDate < fromD) return;
          }
          if (toDate) {
            const toD = new Date(toDate + 'T23:59:59');
            if (leadDate > toD) return;
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (
            leadDate.getFullYear() === targetYear &&
            leadDate.getMonth() === targetMonth &&
            leadDate.getDate() === targetDate
          ) {
            const kw = parseFloat(lead.kwRequirement) || 0;
            const hour = leadDate.getHours();
            let slot = '';
            if (hour < 4) slot = hourSlots[0];
            else if (hour < 8) slot = hourSlots[1];
            else if (hour < 12) slot = hourSlots[2];
            else if (hour < 16) slot = hourSlots[3];
            else if (hour < 20) slot = hourSlots[4];
            else slot = hourSlots[5];

            if (grouped[slot] !== undefined) {
              grouped[slot] += kw;
            }
          }
        });
      } else if (datePreset === 'this-month') {
        const targetYear = now.getFullYear();
        const targetMonth = now.getMonth();
        const weekLabels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22+)'];
        let limitIdx = 3;
        const todayDate = now.getDate();
        if (todayDate <= 7) limitIdx = 0;
        else if (todayDate <= 14) limitIdx = 1;
        else if (todayDate <= 21) limitIdx = 2;
        else limitIdx = 3;

        const activeWeeks = weekLabels.slice(0, Math.max(2, limitIdx + 1));
        activeWeeks.forEach(w => grouped[w] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (fromDate) {
            const fromD = new Date(fromDate + 'T00:00:00');
            if (leadDate < fromD) return;
          }
          if (toDate) {
            const toD = new Date(toDate + 'T23:59:59');
            if (leadDate > toD) return;
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (leadDate.getFullYear() === targetYear && leadDate.getMonth() === targetMonth) {
            const kw = parseFloat(lead.kwRequirement) || 0;
            const leadDateVal = leadDate.getDate();
            let wLabel = '';
            if (leadDateVal <= 7) wLabel = weekLabels[0];
            else if (leadDateVal <= 14) wLabel = weekLabels[1];
            else if (leadDateVal <= 21) wLabel = weekLabels[2];
            else wLabel = weekLabels[3];

            if (grouped[wLabel] !== undefined) {
              grouped[wLabel] += kw;
            }
          }
        });
      } else if (datePreset === 'prev-month') {
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const targetYear = prevMonthDate.getFullYear();
        const targetMonth = prevMonthDate.getMonth();
        const weekLabels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22+)'];
        weekLabels.forEach(w => grouped[w] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (fromDate) {
            const fromD = new Date(fromDate + 'T00:00:00');
            if (leadDate < fromD) return;
          }
          if (toDate) {
            const toD = new Date(toDate + 'T23:59:59');
            if (leadDate > toD) return;
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (leadDate.getFullYear() === targetYear && leadDate.getMonth() === targetMonth) {
            const kw = parseFloat(lead.kwRequirement) || 0;
            const leadDateVal = leadDate.getDate();
            let wLabel = '';
            if (leadDateVal <= 7) wLabel = weekLabels[0];
            else if (leadDateVal <= 14) wLabel = weekLabels[1];
            else if (leadDateVal <= 21) wLabel = weekLabels[2];
            else wLabel = weekLabels[3];

            if (grouped[wLabel] !== undefined) {
              grouped[wLabel] += kw;
            }
          }
        });
      } else {
        const targetYear = filter;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const limitMonths = (targetYear === now.getFullYear());
        const activeMonths = limitMonths ? months.slice(0, Math.max(2, now.getMonth() + 1)) : months;
        activeMonths.forEach(m => grouped[m] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (datePreset !== 'custom') {
            if (fromDate) {
              const fromD = new Date(fromDate + 'T00:00:00');
              if (leadDate < fromD) return;
            }
            if (toDate) {
              const toD = new Date(toDate + 'T23:59:59');
              if (leadDate > toD) return;
            }
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (leadDate.getFullYear() === targetYear) {
            const kw = parseFloat(lead.kwRequirement) || 0;
            const mLabel = months[leadDate.getMonth()];
            if (grouped[mLabel] !== undefined) {
              grouped[mLabel] += kw;
            }
          }
        });
      }

      const chartData = Object.entries(grouped).map(([name, kw]) => ({ name, kw }));
      const total = chartData.reduce((sum, d) => sum + d.kw, 0);
      setTotalKw(total);
      setKwGrowthData(chartData);
    } catch (err) {
      console.error("KW Growth error:", err);
    }
  };

  const fetchRevenueGrowth = async (filter: number) => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.getAllLeads, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      const leads = res.data?.data || [];

      const now = new Date();
      let grouped: Record<string, number> = {};

      if (datePreset === 'today') {
        const targetYear = now.getFullYear();
        const targetMonth = now.getMonth();
        const targetDate = now.getDate();
        const hourSlots = ['12 AM - 4 AM', '4 AM - 8 AM', '8 AM - 12 PM', '12 PM - 4 PM', '4 PM - 8 PM', '8 PM - 12 AM'];
        const currentHour = now.getHours();
        let limitIdx = 5;
        if (currentHour < 4) limitIdx = 0;
        else if (currentHour < 8) limitIdx = 1;
        else if (currentHour < 12) limitIdx = 2;
        else if (currentHour < 16) limitIdx = 3;
        else if (currentHour < 20) limitIdx = 4;
        else limitIdx = 5;

        const activeSlots = hourSlots.slice(0, Math.max(2, limitIdx + 1));
        activeSlots.forEach(slot => grouped[slot] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (fromDate) {
            const fromD = new Date(fromDate + 'T00:00:00');
            if (leadDate < fromD) return;
          }
          if (toDate) {
            const toD = new Date(toDate + 'T23:59:59');
            if (leadDate > toD) return;
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (
            leadDate.getFullYear() === targetYear &&
            leadDate.getMonth() === targetMonth &&
            leadDate.getDate() === targetDate
          ) {
            const amt = parseFloat(lead.paymentAmount) || 0;
            const hour = leadDate.getHours();
            let slot = '';
            if (hour < 4) slot = hourSlots[0];
            else if (hour < 8) slot = hourSlots[1];
            else if (hour < 12) slot = hourSlots[2];
            else if (hour < 16) slot = hourSlots[3];
            else if (hour < 20) slot = hourSlots[4];
            else slot = hourSlots[5];

            if (grouped[slot] !== undefined) {
              grouped[slot] += amt;
            }
          }
        });
      } else if (datePreset === 'this-month') {
        const targetYear = now.getFullYear();
        const targetMonth = now.getMonth();
        const weekLabels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22+)'];
        let limitIdx = 3;
        const todayDate = now.getDate();
        if (todayDate <= 7) limitIdx = 0;
        else if (todayDate <= 14) limitIdx = 1;
        else if (todayDate <= 21) limitIdx = 2;
        else limitIdx = 3;

        const activeWeeks = weekLabels.slice(0, Math.max(2, limitIdx + 1));
        activeWeeks.forEach(w => grouped[w] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (fromDate) {
            const fromD = new Date(fromDate + 'T00:00:00');
            if (leadDate < fromD) return;
          }
          if (toDate) {
            const toD = new Date(toDate + 'T23:59:59');
            if (leadDate > toD) return;
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (leadDate.getFullYear() === targetYear && leadDate.getMonth() === targetMonth) {
            const amt = parseFloat(lead.paymentAmount) || 0;
            const leadDateVal = leadDate.getDate();
            let wLabel = '';
            if (leadDateVal <= 7) wLabel = weekLabels[0];
            else if (leadDateVal <= 14) wLabel = weekLabels[1];
            else if (leadDateVal <= 21) wLabel = weekLabels[2];
            else wLabel = weekLabels[3];

            if (grouped[wLabel] !== undefined) {
              grouped[wLabel] += amt;
            }
          }
        });
      } else if (datePreset === 'prev-month') {
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const targetYear = prevMonthDate.getFullYear();
        const targetMonth = prevMonthDate.getMonth();
        const weekLabels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22+)'];
        weekLabels.forEach(w => grouped[w] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (fromDate) {
            const fromD = new Date(fromDate + 'T00:00:00');
            if (leadDate < fromD) return;
          }
          if (toDate) {
            const toD = new Date(toDate + 'T23:59:59');
            if (leadDate > toD) return;
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (leadDate.getFullYear() === targetYear && leadDate.getMonth() === targetMonth) {
            const amt = parseFloat(lead.paymentAmount) || 0;
            const leadDateVal = leadDate.getDate();
            let wLabel = '';
            if (leadDateVal <= 7) wLabel = weekLabels[0];
            else if (leadDateVal <= 14) wLabel = weekLabels[1];
            else if (leadDateVal <= 21) wLabel = weekLabels[2];
            else wLabel = weekLabels[3];

            if (grouped[wLabel] !== undefined) {
              grouped[wLabel] += amt;
            }
          }
        });
      } else {
        const targetYear = filter;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const limitMonths = (targetYear === now.getFullYear());
        const activeMonths = limitMonths ? months.slice(0, Math.max(2, now.getMonth() + 1)) : months;
        activeMonths.forEach(m => grouped[m] = 0);

        leads.forEach((lead: any) => {
          const leadDate = new Date(lead.createdAt);
          if (datePreset !== 'custom') {
            if (fromDate) {
              const fromD = new Date(fromDate + 'T00:00:00');
              if (leadDate < fromD) return;
            }
            if (toDate) {
              const toD = new Date(toDate + 'T23:59:59');
              if (leadDate > toD) return;
            }
          }

          const statusName = lead.leadStatus?.name || (typeof lead.leadStatus === 'string' ? lead.leadStatus : '');
          if (statusName.toLowerCase().replace(/\s+/g, '') !== 'won') return;

          if (leadDate.getFullYear() === targetYear) {
            const amt = parseFloat(lead.paymentAmount) || 0;
            const mLabel = months[leadDate.getMonth()];
            if (grouped[mLabel] !== undefined) {
              grouped[mLabel] += amt;
            }
          }
        });
      }

      const chartData = grouped ? Object.entries(grouped).map(([name, amt]) => ({ name, amt })) : [];
      const total = chartData.reduce((sum, d) => sum + d.amt, 0);
      setTotalRevenueChart(total);
      const maxAmt = Math.max(...chartData.map(d => d.amt), 0);
      const chartDataWithLine = chartData.map(d => ({
        ...d,
        lineAmt: d.amt > 0 ? d.amt + maxAmt * 0.10 : 0
      }));
      setRevenueGrowthData(chartDataWithLine);
    } catch (err) {
      console.error("Revenue Growth error:", err);
    }
  };

  const fetchFollowUpChartData = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.getAllLeads, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      const leads = res.data?.data || [];

      const now = new Date();
      // Set now to start of day for comparison
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const targetYear = followUpYearFilter;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      let grouped: Record<string, { upcoming: number; completed: number }> = {};

      // If it is the current year, limit to the current month. If it's a past year, show all 12 months.
      const isCurrentYear = targetYear === now.getFullYear();
      const activeMonths = isCurrentYear ? months.slice(0, now.getMonth() + 1) : months;

      activeMonths.forEach(m => grouped[m] = { upcoming: 0, completed: 0 });

      // Count each lead's nextFollowupDate as upcoming (future) or completed (past)
      const formatDateStr = (dateVal: any): string | null => {
        if (!dateVal) return null;
        try {
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return null;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const date = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${date}`;
        } catch {
          return null;
        }
      };

      // Count each lead's nextFollowupDate as upcoming (future) or completed (past)
      leads.forEach((lead: any) => {

        const nextDateStr = formatDateStr(lead.nextFollowupDate);
        let upcomingCounted = false;


        // 1. Process all historical follow-ups in lead.followUps
        if (lead.followUps && Array.isArray(lead.followUps)) {
          lead.followUps.forEach((f: any) => {
            const fDate = new Date(f.date || f.createdAt);
            if (fDate.getFullYear() !== targetYear) return;

            const mLabel = months[fDate.getMonth()];
            if (!grouped[mLabel]) return;
            const fDateStr = formatDateStr(f.date || f.createdAt);
            if (nextDateStr && fDateStr === nextDateStr) {
              grouped[mLabel].upcoming++;
              upcomingCounted = true;
            } else {
              grouped[mLabel].completed++;
            }
          });
        }

        // 2. If the lead has an active nextFollowupDate that wasn't counted in followUps
        if (nextDateStr && !upcomingCounted) {
          const nextDateObj = new Date(lead.nextFollowupDate);
          if (nextDateObj.getFullYear() === targetYear) {
            const mLabel = months[nextDateObj.getMonth()];
            if (grouped[mLabel]) {
              grouped[mLabel].upcoming++;
            }
          }
        }
      });

      const chartData = Object.entries(grouped).map(([name, val]) => ({
        name,
        upcoming: val.upcoming,
        completed: val.completed
      }));

      setFollowUpChartData(chartData);
    } catch (err) {
      console.error("Follow-up chart error:", err);
    }
  };

  const fetchStaffWinRate = async (filter: 'all' | 'week' | 'month' | 'year') => {
    if (!token) return;
    try {
      const [leadsRes, usersRes] = await Promise.all([
        axios.get(baseUrl.getAllLeads, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        }),
        axios.get(baseUrl.getAllUsers, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        }).catch(() => ({ data: { data: [] } }))
      ]);

      const leads = leadsRes.data?.data || [];
      const users = usersRes.data?.data || [];

      // Create a map of user ID to department name
      const userDeptMap: Record<string, string> = {};
      users.forEach((u: any) => {
        const deptName = u.role?.roleName || u.roleName || u.department || '';
        userDeptMap[String(u._id)] = deptName;
      });

      // Prepopulate staffMap with users in "Sales Executive" department
      const staffMap: Record<string, { name: string; Won: number; Lost: number; 'In Progress': number; 'New Lead': number }> = {};
      users.forEach((u: any) => {
        const deptName = userDeptMap[String(u._id)] || '';
        if (deptName.toLowerCase() === 'sales executive') {
          const name = u.fullName || 'Unknown';
          staffMap[name] = { name, Won: 0, Lost: 0, 'In Progress': 0, 'New Lead': 0 };
        }
      });

      const now = new Date();
      const filtered = leads.filter((lead: any) => {
        const userId = lead.assignedTo?._id || lead.assignedTo;
        if (!userId) return false;

        // Only count leads assigned to a Sales Executive
        const deptName = userDeptMap[String(userId)] || '';
        if (deptName.toLowerCase() !== 'sales executive') return false;

        // Date range filter
        const leadDate = new Date(lead.createdAt);
        if (fromDate) {
          const fromD = new Date(fromDate + 'T00:00:00');
          if (leadDate < fromD) return false;
        }
        if (toDate) {
          const toD = new Date(toDate + 'T23:59:59');
          if (leadDate > toD) return false;
        }

        if (filter === 'all') return true;
        const d = new Date(lead.createdAt);
        const diff = now.getTime() - d.getTime();
        if (filter === 'week') return diff <= 7 * 24 * 60 * 60 * 1000;
        if (filter === 'month') return diff <= 30 * 24 * 60 * 60 * 1000;
        if (filter === 'year') return d.getFullYear() === now.getFullYear();
        return true;
      });

      setTotalStaffLeads(filtered.length);

      filtered.forEach((lead: any) => {
        const name = lead.assignedTo?.fullName || 'Unknown';
        if (!staffMap[name]) {
          staffMap[name] = { name, Won: 0, Lost: 0, 'In Progress': 0, 'New Lead': 0 };
        }
        const status = lead.leadStatus?.name?.toLowerCase() || '';
        if (status === 'won') staffMap[name].Won++;
        else if (status === 'lost') staffMap[name].Lost++;
        else {
          staffMap[name]['In Progress']++;
          staffMap[name]['New Lead']++;
        }
      });

      setStaffWinRate(Object.values(staffMap));
    } catch (err) {
      console.error("Staff Win Rate error:", err);
    }
  };

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    if (token) {
      fetchKwGrowth(kwFilter);
      fetchStaffWinRate(staffFilter);
      fetchRevenueGrowth(revenueFilter);
      fetchFollowUpChartData();
    }
  }, [token, kwFilter, staffFilter, revenueFilter, fromDate, toDate, followUpYearFilter, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    if (token) {
      fetchLeadSummary();
      fetchUpcomingFollowups(1);
      fetchDueFollowups(1);
      fetchTodayTasks();

      // Only fetch staff stats if they have readAll or if they are a calling user
      if (permissions.readAll || isCallingUser) {
        fetchLeadsBySource();
        fetchStaffPerformance();
      }
    }
  }, [token, permissions, fromDate, toDate, user, hasLoadedFromStorage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPreset = window.localStorage.getItem("dashboardDatePreset");
      const storedFromDate = window.localStorage.getItem("dashboardFromDate");
      const storedToDate = window.localStorage.getItem("dashboardToDate");

      if (storedPreset !== null || storedFromDate !== null || storedToDate !== null) {
        setDatePreset(storedPreset as any);
        setFromDate(storedFromDate || "");
        setToDate(storedToDate || "");
      } else {
        const initial = getInitialDates('this-month');
        setFromDate(initial.from);
        setToDate(initial.to);
        setDatePreset('this-month');
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
        } catch {
        }
      }
    }
  }, []);

  // Color palette for statuses (shades of orange)
  const statusColorPalette = [
    "#d87612", // Primary Brand Orange
    "#f97316", // Bright Orange
    "#fb923c", // Warm Peach Orange
    "#c2410c", // Deep Rust Orange
    "#ea580c", // Red-Orange
    "#f59e0b", // Amber/Gold
    "#fdba74", // Soft Sunset Orange
    "#fed7aa", // Light Apricot
  ];

  const getStatusCount = (statusName: string) => {
    if (!summary?.statusWiseCounts) return 0;
    const found = summary.statusWiseCounts.find(
      (s: any) => s.statusName?.toLowerCase().replace(/\s+/g, '') === statusName.toLowerCase().replace(/\s+/g, '')
    );
    return found ? found.count : 0;
  };

  const getStatusId = (statusName: string) => {
    if (!summary?.statusWiseCounts) return "";
    const found = summary.statusWiseCounts.find(
      (s: any) => s.statusName?.toLowerCase().replace(/\s+/g, '') === statusName.toLowerCase().replace(/\s+/g, '')
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
        value: upcomingFollowups.length,
        trend: 0,
        tone: "neutral",
        Icon: PhoneCall,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
        type: "custom",
        fill: "#F59E0B",
        name: "Follow-ups",
      },
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
        description: "Total from won leads"
      }
      //  {
      //   key: "tasks",
      //   label: "Tasks",
      //   value: todayTasks.length,
      //   trend: 0,
      //   tone: "neutral",
      //   Icon: CheckCircle2,
      //   iconBg: "bg-purple-500/10",
      //   iconColor: "text-purple-500",
      //   type: "custom",
      //   fill: "#8B5CF6",
      //   name: "Tasks",
      //   description: "Tasks for today"
      // },
    ]
    : [];

  const statusChartData = summary?.statusWiseCounts?.map((s, idx) => ({
    name: s.statusName,
    value: s.count,
    fill: statusColorPalette[idx % statusColorPalette.length]
  })) || [];

  const pieChartData = statusChartData.filter(s => s.value > 0);

  const wonColor = statusChartData.find(s => s.name?.toLowerCase() === "won")?.fill || "#15803d";
  const lostColor = statusChartData.find(s => s.name?.toLowerCase() === "lost")?.fill || "#b91c1c";
  const inProgressColor = statusChartData.find(s => s.name?.toLowerCase() === "new lead")?.fill || "#4f46e5";

  const handleQuickFilter = (range: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        break;
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'reset':
        setFromDate("");
        setToDate("");
        return;
    }

    const format = (d: Date) => d.toISOString().split("T")[0];
    setFromDate(format(start));
    setToDate(format(end));
  };

  const handleCardClick = (card: SummaryCard) => {

    if (card.key === "followups") {
      const element = document.getElementById("upcoming-followups-section");
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
  };

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
            <div className={`p-2 rounded-lg ${dateHeader === "Follow up Date" ? "bg-orange-50" : "bg-red-50"}`}>
              {dateHeader === "Follow up Date" ? (
                <Clock className="h-5 w-5 text-[#d87612]" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${dateHeader === "Follow up Date"
            ? "bg-orange-50 text-[#d87612] border border-orange-100"
            : "bg-red-50 text-red-700 border border-red-100"
            }`}>
            {items.length} {items.length === 1 ? 'Lead' : 'Leads'}
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
                  <th scope="col" className="px-4 py-3 text-left text-sm text-gray-500 font-semibold tracking-wider">
                    Lead Name & Contact
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm text-gray-500 font-semibold tracking-wider">
                    Schedule
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm text-gray-500 font-semibold tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-sm text-gray-500 font-semibold tracking-wider">
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

                        {lead.nextFollowupDate ? moment(lead.nextFollowupDate).format("DD-MM-YYYY") : "-"}
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
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-100 text-[#d87612] border border-orange-200/30 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Pending
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
              <span className="text-xs font-medium text-gray-500">Page {page} of {totalPages}</span>
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

  // const renderTodayTasksTable = (
  //   items: any[],
  //   loading: boolean,
  //  ) => (
  //   <div className="rounded-md bg-white border border-gray-200 overflow-hidden h-full flex flex-col transition-all hover:shadow-xl">
  //     <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
  //       <div className="flex items-center justify-between">
  //         <div className="flex items-center gap-3">
  //           <div className="p-2 rounded-lg bg-purple-50">
  //             <CalendarIcon className="h-5 w-5 text-purple-600" />
  //           </div>
  //           <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
  //         </div>
  //         <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-2.5 py-1 text-xs font-medium">
  //           {items.length} {items.length === 1 ? 'Task' : 'Tasks'}
  //         </span>
  //       </div>
  //     </div>

  //     {loading ? (
  //       <div className="p-12 text-center flex-1 flex items-center justify-center">
  //         <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
  //       </div>
  //     ) : items.length === 0 ? (
  //       <div className="p-12 text-center flex-1 flex items-center justify-center">
  //         <div className="flex flex-col items-center gap-2">
  //           <div className="p-3 bg-gray-50 rounded-full">
  //             <CheckCircle2 className="h-8 w-8 text-gray-400" />
  //           </div>
  //           <p className="text-sm text-gray-500">No tasks for today</p>
  //         </div>
  //       </div>
  //     ) : (
  //       <>
  //         <div className="overflow-y-auto flex-1">
  //           <div className="divide-y divide-gray-50">
  //             {items.map((task, index) => (
  //               <div
  //                 key={task._id || index}
  //                 className="p-4 hover:bg-purple-50/20 transition-all cursor-pointer group"
  //                 onClick={() => router.push(`/tasks`)}
  //               >
  //                 <div className="flex items-start justify-between mb-2">
  //                   <div className="flex-1">
  //                     <h4 className="font-semibold text-gray-900 text-sm mb-1">
  //                       {task.subject}
  //                     </h4>
  //                     <div className="flex items-center gap-2">
  //                       <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${task.taskStatus?.name?.toLowerCase() === 'completed'
  //                           ? 'bg-green-100 text-green-700 border-green-200'
  //                           : 'bg-yellow-100 text-yellow-700 border-yellow-200'
  //                         }`}>
  //                         {task.taskStatus?.name || 'In Progress'}
  //                       </span>
  //                       <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${getPriorityColor(task.priority)}`}>
  //                         {task.priority?.toUpperCase() || 'MEDIUM'}
  //                       </span>
  //                     </div>
  //                   </div>
  //                   <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>

  //         <div className="p-3 border-t border-gray-100 bg-gray-50/50">
  //           <Link
  //             href="/tasks"
  //             className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors py-1"
  //           >
  //             View all tasks
  //             <ChevronRight className="h-3 w-3" />
  //           </Link>
  //         </div>
  //       </>
  //     )}
  //   </div>
  // );

  const salesExecutiveCard = (
    <div className="flex flex-col rounded-2xl border border-gray-100 p-6 min-w-0 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-h-[450px]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-semibold text-gray-900">Sales Executive</h3>
            <span className="inline-flex items-center bg-orange-50 text-[#d87612] border border-orange-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {totalStaffLeads} Total Leads
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Lead status performance by assigned executive</p>
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
            <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} width={30} />
            <Bar dataKey="In Progress" stackId="a" opacity={0} />
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
            width={Math.max(staffChartWidth, staffWinRate.length * (staffChartWidth / 8))}
            height={320}
            data={staffWinRate}
            margin={{ top: 5, right: 10, left: 35, bottom: 5 }}
            barSize={35}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '600' }} axisLine={false} tickLine={false} />
            <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-gray-900 mb-2">{payload[0]?.payload?.name}</p>
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
            <Bar dataKey="Won" stackId="a" fill="#00bc7d" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Lost" stackId="a" fill="#B22222" radius={[0, 0, 0, 0]} />
            <Bar dataKey="In Progress" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </div>

        {/* Custom Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-[11px] font-semibold text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" />
            <span>In Progress</span>
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
        <h3 className="text-lg text-gray-500 mt-1">₹{(totalRevenueChart || 0).toLocaleString()}</h3>
      </div>

      <div className="flex-1 mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={revenueGrowthData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }} barCategoryGap="30%">
            <defs>
              <linearGradient id="colorAmtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fdba74" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#d87612" stopOpacity={0.9} />
              </linearGradient>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#b45309" />
              </marker>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" padding={{ left: 15, right: 15 }} tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '600', dy: 8 }} axisLine={false} tickLine={false} />
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
              tick={{ fontSize: 11, fill: '#4b5563', dx: -8 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                      <p className="font-bold text-gray-900">{payload[0].payload.name}</p>
                      <p className="font-semibold" style={{ color: '#d87612' }}>₹{Number(payload[0].payload.amt).toLocaleString()}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amt" fill="url(#colorAmtGrad)" radius={[4, 4, 0, 0]} barSize={35} />
            <Line type="monotone" dataKey="lineAmt" stroke="#b45309" strokeWidth={3} dot={false} activeDot={false} markerEnd="url(#arrow)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const leadStatusCard = (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full min-h-[450px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Lead Status Overview</h3>
          <p className="text-sm text-gray-500 mt-1">Performance by status categories</p>
        </div>
        {!isSalesUser && (
          <div className="flex flex-wrap items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
            <button
              onClick={() => setStatusView('pie')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusView === 'pie'
                ? 'bg-[#d87612] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              Pie
            </button>
            <button
              onClick={() => setStatusView('graph')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusView === 'graph'
                ? 'bg-[#d87612] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              Graph
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {statusView === 'pie' || isSalesUser ? (
          <div className="flex flex-col xl:flex-row items-center justify-center gap-6 xl:gap-8">
            <div className="relative h-[260px] w-[350px] shrink-0" style={{ perspective: '800px' }}>
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
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const matchedStatus = statusChartData.find(
                            s => s.name?.toLowerCase().replace(/\s+/g, '') === payload[0].name?.toLowerCase().replace(/\s+/g, '')
                          );
                          const actualColor = matchedStatus?.fill || '#d87612';
                          return (
                            <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-gray-900">{payload[0].name}</p>
                              <p className="font-semibold" style={{ color: actualColor }}>{payload[0].value} Leads</p>
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
                <div key={i} className="flex items-center gap-2.5 ml-1 p-2 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-default">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.fill }}></div>
                  <span className="text-sm font-bold text-gray-700 flex-1 truncate">{s.name}</span>
                  <span className="text-sm font-semibold bg-white px-2.5 py-1 rounded-lg border border-gray-100 shrink-0" style={{ color: s.fill }}>
                    {s.value} {s.value === 1 ? 'Lead' : 'Leads'}
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
                <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} width={30} />
                <Bar dataKey="value" opacity={0} />
              </BarChart>
            </div>
            {/* Scrollable Chart */}
            <div
              ref={statusChartContainerRef}
              className="h-[280px] w-full overflow-x-auto scrollbar-thin dashboard-scrollbar"
            >
              <BarChart
                width={Math.max(statusChartWidth, statusChartData.length * (statusChartWidth / 8))}
                height={260}
                data={statusChartData}
                margin={{ top: 10, right: 10, left: 35, bottom: 5 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '600' }} axisLine={false} tickLine={false} />
                <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const actualColor = statusChartData.find(s => s.name === payload[0].name)?.fill || '#d87612';
                      return (
                        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-gray-900">{payload[0].name}</p>
                          <p className="font-semibold" style={{ color: actualColor }}>{payload[0].value} Leads</p>
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
          <AreaChart data={kwGrowthData} margin={{ top: 10, right: 3, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorKwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d87612" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#d87612" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" padding={{ left: 15, right: 15 }} tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '600', dy: 8 }} axisLine={false} tickLine={false} />
            <YAxis width={50} tick={{ fontSize: 11, fill: '#4b5563', dx: -8 }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                      <p className="font-bold text-gray-900">{payload[0].payload.name}</p>
                      <p className="font-semibold" style={{ color: '#d87612' }}>{Number(payload[0].value).toFixed(2)} KW</p>
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
              dot={{ r: 4, stroke: '#d87612', strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 6, stroke: '#d87612', strokeWidth: 2, fill: '#d87612' }}
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
          <p className="text-xl font-semibold text-gray-900">Follow-up Analysis</p>
          <YearSelect
            value={followUpYearFilter}
            onChange={setFollowUpYearFilter}
            options={last3Years}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">Upcoming and completed follow-ups</p>
      </div>

      <div className="flex-1 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={followUpChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              padding={{ left: 15, right: 15 }}
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600, dy: 8 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              width={28}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#6b7280', dx: -4 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-100 px-3 py-2 rounded-xl shadow-lg text-xs">
                      <p className="font-bold text-gray-800 mb-1">{item.name}</p>
                      <p className="font-semibold" style={{ color: '#10B981' }}>✓ Completed: {item.completed}</p>
                      <p className="font-semibold" style={{ color: '#d87612' }}>↑ Upcoming: {item.upcoming}</p>
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
              dot={{ r: 4, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#10B981' }}
            />
            <Line
              type="monotone"
              dataKey="upcoming"
              name="Upcoming Follow-ups"
              stroke="#d87612"
              strokeWidth={2.5}
              dot={{ r: 4, stroke: '#d87612', strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 6, stroke: '#d87612', strokeWidth: 2, fill: '#d87612' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend box at the bottom */}
      <div className="mt-4 shrink-0 flex items-center justify-center gap-6 py-2 px-4 ">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#10B981]"></span>
          <span className="text-[12px] font-semibold text-gray-500">Completed Follow-ups</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#d87612]"></span>
          <span className="text-[12px] font-semibold text-gray-500">Upcoming Follow-ups</span>
        </div>
      </div>
    </div>
  )
  const leadSourceCard = (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow min-h-[450px] flex flex-col justify-between">
      <div className="flex flex-col mb-4 shrink-0">
        <p className="text-xl font-semibold text-gray-900">Lead Source Overview</p>
        <p className="text-sm text-gray-500 mt-1">Leads distribution by acquisition source</p>
      </div>

      <div className="flex-1 mt-4" style={{ minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={leadsBySource} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#6b7280', dx: -4 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                      <p className="font-bold text-gray-900">{payload[0].payload.name}</p>
                      <p className="font-semibold text-blue-600">{payload[0].value} Leads</p>
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
        <p className="text-xl font-semibold text-gray-900">Lead Assignment Overview</p>
        <p className="text-sm text-gray-500 mt-1">Lead status performance by assigned executive</p>
      </div>

      <div className="flex-1 mt-4" style={{ minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={staffWinRate} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600, dy: 8 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#6b7280', dx: -4 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-gray-900 mb-2">{payload[0]?.payload?.name}</p>
                      {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.fill }} className="font-semibold">
                          {p.name}: <span className="font-bold text-gray-800">{p.value}</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="New Lead" stackId="a" fill="#fb923c" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Won" stackId="a" fill="#00bc7d" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Lost" stackId="a" fill="#B22222" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 shrink-0 flex items-center justify-center gap-6 py-2 px-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#fb923c]"></span>
          <span className="text-[12px] font-semibold text-gray-500">New Lead</span>
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
      <div className="flex-1 p-8 space-y-8 min-w-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {greeting}, {user?.fullName?.split(' ')[0] || 'Admin'}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">Here's what's happening with your leads today.</p>
          </div>
          {/* Welcome Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 self-stretch md:self-auto justify-end">
            {(['today', 'this-month', 'prev-month', 'this-year', 'custom'] as const).map((p) => {
              const labelMap = {
                'today': 'Today',
                'this-month': 'This Month',
                'prev-month': 'Previous Month',
                'this-year': 'This Year',
                'custom': 'Custom'
              };
              return (
                <button
                  key={p}
                  onClick={() => applyDatePreset(p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${datePreset === p
                    ? 'bg-[#d87612] text-white shadow-sm shadow-[#d87612]/20'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}

            {datePreset === 'custom' && (
              <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-2xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative w-40">
                    <label className="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-[#d87612] uppercase tracking-widest z-10">From Date</label>
                    <Calendar
                      value={fromDate ? new Date(fromDate + 'T00:00:00') : null}
                      onChange={handleFromDateChange}
                      placeholder="Select from date"
                      className="!py-1.5 !border-[#d87612]/30 hover:!border-[#d87612]"
                    />
                  </div>
                  <div className="relative w-40">
                    <label className="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-[#d87612] uppercase tracking-widest z-10">To Date</label>
                    <Calendar
                      value={toDate ? new Date(toDate + 'T00:00:00') : null}
                      onChange={handleToDateChange}
                      minDate={fromDate ? new Date(fromDate + 'T00:00:00') : undefined}
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

        {/* Lead Count Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {summaryCards.map((card) => (
            <div
              key={card.key}
              className={`group flex items-center gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 min-w-0 cursor-pointer ${card.type === "status" && card.statusId ? 'hover:border-gray-300' : ''
                }`}
            >
              <div className={`p-3 rounded-xl ${card.iconBg} ${card.iconColor} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
                <card.Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] text-gray-500 tracking-wider truncate">{card.label}</h3>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl text-gray-900">{card.value}</span>
                  {card.subtitle && <span className="text-xs text-gray-400">{card.subtitle}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>


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

        {/* Row 2: Follow-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="upcoming-followups-section">
          <div className="h-full min-h-[450px]">
            {renderFollowupTable("Upcoming Follow-ups", upcomingFollowups, upcomingLoading, upcomingPage, upcomingTotalPages, (p) => { if (p >= 1 && p <= upcomingTotalPages) fetchUpcomingFollowups(p); }, "Follow up Date")}
          </div>
          <div className="h-full min-h-[450px]">
            {renderFollowupTable("Overdue Follow-ups", dueFollowups, dueLoading, duePage, dueTotalPages, (p) => { if (p >= 1 && p <= dueTotalPages) fetchDueFollowups(p); }, "Due Date")}
          </div>
        </div>

      </div>

      {
        isUpdateLeadDialogOpen && (
          <DashboardLeadUpdateDialog
            isOpen={isUpdateLeadDialogOpen}
            onClose={() => {
              setIsUpdateLeadDialogOpen(false);
              setSelectedLeadForUpdate(null);
            }}
            lead={selectedLeadForUpdate}
            onSuccess={() => {
              fetchUpcomingFollowups(upcomingPage);
              fetchDueFollowups(duePage);
            }}
          />
        )
      }
    </div >
  );
}
