"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Home,
  Users,
  TrendingUp,
  TrendingDown,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  LandPlot,
  Handshake,
  Key,
  DollarSign,
  FileText,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

// ============ MOCK DATA ============

// Monthly sales & revenue (real estate)
const revenueData = [
  { month: "Jan", sales: 3200000, target: 3500000, commission: 160000 },
  { month: "Feb", sales: 4100000, target: 3500000, commission: 205000 },
  { month: "Mar", sales: 3800000, target: 4000000, commission: 190000 },
  { month: "Apr", sales: 5200000, target: 4000000, commission: 260000 },
  { month: "May", sales: 4900000, target: 4500000, commission: 245000 },
  { month: "Jun", sales: 6100000, target: 4500000, commission: 305000 },
  { month: "Jul", sales: 5800000, target: 5000000, commission: 290000 },
  { month: "Aug", sales: 7200000, target: 5000000, commission: 360000 },
  { month: "Sep", sales: 6800000, target: 5500000, commission: 340000 },
  { month: "Oct", sales: 8100000, target: 5500000, commission: 405000 },
  { month: "Nov", sales: 9200000, target: 6000000, commission: 460000 },
  { month: "Dec", sales: 10500000, target: 6000000, commission: 525000 },
];

// Property type distribution
const propertyTypes = [
  { name: "Land / Plots", value: 42000000, color: "#6366f1" },
  { name: "Apartments", value: 28000000, color: "#8b5cf6" },
  { name: "Villas", value: 18000000, color: "#ec4899" },
  { name: "Commercial", value: 12000000, color: "#f59e0b" },
  { name: "Rentals", value: 8000000, color: "#10b981" },
];

// Top performing agents
const topAgents = [
  { name: "Rashed Karim", deals: 24, revenue: 8500000, growth: 18.5 },
  { name: "Farhana Ahmed", deals: 19, revenue: 6200000, growth: 12.3 },
  { name: "Tanvir Hasan", deals: 16, revenue: 4800000, growth: -3.1 },
  { name: "Nusrat Jahan", deals: 14, revenue: 3900000, growth: 22.7 },
  { name: "Imran Chowdhury", deals: 11, revenue: 3100000, growth: 8.4 },
];

// Weekly deals (land vs apartment)
const weeklyDeals = [
  { day: "Mon", land: 4, apartment: 3 },
  { day: "Tue", land: 2, apartment: 5 },
  { day: "Wed", land: 6, apartment: 2 },
  { day: "Thu", land: 3, apartment: 4 },
  { day: "Fri", land: 7, apartment: 6 },
  { day: "Sat", land: 9, apartment: 5 },
  { day: "Sun", land: 5, apartment: 4 },
];

// Lead conversion
const conversionData = [{ name: "Conversion", value: 42, fill: "#6366f1" }];

// Recent bookings
const recentBookings = [
  {
    id: "BK-7845",
    client: "Ayesha Rahman",
    property: "Gulshan Plot 12 (5 katha)",
    amount: 12000000,
    status: "Confirmed",
    date: "2024-01-15",
  },
  {
    id: "BK-7844",
    client: "Arif Hossain",
    property: "Bashundhara Apartment 7B",
    amount: 6500000,
    status: "Pending",
    date: "2024-01-15",
  },
  {
    id: "BK-7843",
    client: "Sadia Islam",
    property: "Dhanmondi Commercial Space",
    amount: 9500000,
    status: "Confirmed",
    date: "2024-01-14",
  },
  {
    id: "BK-7842",
    client: "Rakib Khan",
    property: "Uttara Villa 4C",
    amount: 15000000,
    status: "Processing",
    date: "2024-01-14",
  },
  {
    id: "BK-7841",
    client: "Mim Akter",
    property: "Mirpur Plot 22 (3 katha)",
    amount: 7200000,
    status: "Confirmed",
    date: "2024-01-13",
  },
];

const statusColors: Record<string, string> = {
  Confirmed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Processing:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

// ============ COMPONENTS ============

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  prefix = "",
  suffix = "",
}: {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
}) {
  const isPositive = change >= 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            <Icon size={22} />
          </div>
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
              isPositive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={16} />
            ) : (
              <ArrowDownRight size={16} />
            )}
            {Math.abs(change)}%
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {prefix}
          {value}
          {suffix}
        </p>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Custom Tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    color?: string;
    name?: string | number;
    value?: string | number;
  }>;
  label?: string | number;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500 dark:text-gray-400 capitalize">
              {entry.name}:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {typeof entry.value === "number"
                ? `৳${entry.value.toLocaleString()}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Format money to B/M K
function formatMoney(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(0)} L`;
  return `৳${n.toLocaleString()}`;
}

// ============ MAIN DASHBOARD ============

export default function RealEstateDashboard() {
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState("This Year");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real Estate Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of property sales, lands deals & agent performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option>This Year</option>
              <option>Last Year</option>
              <option>Last 6 Months</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <button 
            onClick={() => toast.success("Report exported successfully!")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Download size={16} />
            Export...
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Sales"
          value="74.2M"
          change={12.5}
          icon={DollarSign}
          prefix="৳"
        />
        <StatCard
          title="Properties Sold"
          value="286"
          change={8.2}
          icon={Home}
        />
        <StatCard
          title="Active Listings"
          value="1,247"
          change={-2.4}
          icon={Building2}
        />
        <StatCard
          title="Land Deals Closed"
          value="84"
          change={15.7}
          icon={LandPlot}
        />
      </div>

      {/* MAIN CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Sales Overview */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Sales Overview"
            subtitle="Monthly property sales, target & commission"
            action={
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Sales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Target
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Commission
                </span>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v / 1_000_000}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorSales)" name="Sales" />
                <Area type="monotone" dataKey="target" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorTarget)" name="Target" />
                <Area type="monotone" dataKey="commission" stroke="#34d399" strokeWidth={2.5} fill="url(#colorComm)" name="Commission" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Conversion + Property Types */}
        <div className="space-y-5">
          <ChartCard title="Lead Conversion" subtitle="Closed deals rate">
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={conversionData} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#f3f4f6" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">42%</span>
                <span className="text-xs text-emerald-500 font-medium flex items-center gap-0.5">
                  <TrendingUp size={12} /> +5.2%
                </span>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Property Mix" subtitle="By total value">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={propertyTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {propertyTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => typeof value === "number" ? `৳${value.toLocaleString()}` : `৳${String(value ?? 0)}`} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Weekly Deals */}
        <ChartCard
          title="Weekly Deals"
          subtitle="Land plots vs apartments"
          action={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Land
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Apartment
              </span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyDeals} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="land" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={28} name="Land" />
              <Bar dataKey="apartment" fill="#c4b5fd" radius={[6, 6, 0, 0]} maxBarSize={28} name="Apartment" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Agents */}
        <ChartCard
          title="Top Agents"
          subtitle="By revenue"
          action={
            <button onClick={() => toast("Filter applied")} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <Filter size={12} /> Filter
            </button>
          }
        >
          <div className="space-y-4 mt-2">
            {topAgents.map((agent, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{agent.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{agent.deals} deals closed</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(agent.revenue)}</p>
                  <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${agent.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {agent.growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(agent.growth)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Recent Bookings */}
        <ChartCard
          title="Recent Bookings"
          subtitle="Latest property deals"
          action={
            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View all</button>
          }
        >
          <div className="space-y-3 mt-2 max-h-[260px] overflow-y-auto pr-1">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.id}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.client} · {b.property}</p>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(b.amount)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[b.status]}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Client Growth */}
        <ChartCard title="Client Growth" subtitle="New buyers vs returning investors">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[
                { month: "Jan", new: 120, returning: 80 },
                { month: "Feb", new: 145, returning: 95 },
                { month: "Mar", new: 132, returning: 110 },
                { month: "Apr", new: 168, returning: 125 },
                { month: "May", new: 185, returning: 140 },
                { month: "Jun", new: 210, returning: 165 },
                { month: "Jul", new: 195, returning: 180 },
                { month: "Aug", new: 230, returning: 195 },
              ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="new" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="New Buyers" />
              <Line type="monotone" dataKey="returning" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Returning" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* YoY Sales */}
        <ChartCard title="Sales Growth" subtitle="Year over year comparison">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={[
                { month: "Jan", current: 3200000, previous: 2800000 },
                { month: "Feb", current: 4100000, previous: 3200000 },
                { month: "Mar", current: 3800000, previous: 3500000 },
                { month: "Apr", current: 5200000, previous: 3800000 },
                { month: "May", current: 4900000, previous: 4000000 },
                { month: "Jun", current: 6100000, previous: 4500000 },
              ]}>
              <defs>
                <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v / 1_000_000}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2.5} fill="url(#currentGrad)" name="Current Year" />
              <Area type="monotone" dataKey="previous" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="Previous Year" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}