import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../api/dashboard";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
  Users, UserCheck, Clock, PhoneOff,
  TrendingUp, RefreshCw, AlertCircle,
  BarChart2, PieChart, Activity, ArrowUpRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { themeColors: c } = useTheme();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const isDark = c.mode === "dark";

  const fetchStats = async () => {
    try {
      setLoading(true); setError(null);
      const res = await dashboardAPI.getDashboardStats();
      setStats(res?.data || res);
    } catch {
      setError("Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>
        Loading dashboard…
      </p>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${c.danger}18`, color: c.danger }}>
        <AlertCircle size={32} />
      </div>
      <div>
        <h3 className="text-lg font-bold" style={{ color: c.text }}>Failed to load</h3>
        <p className="text-sm mt-1" style={{ color: c.textSecondary }}>{error}</p>
      </div>
      <button onClick={fetchStats}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
        style={{ backgroundColor: c.primary, color: "#fff" }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  if (!stats) return null;

  /* ── Stat cards config ── */
  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads ?? 0,
      icon: Users,
      color: "#3b82f6",
      bg: "#eff6ff",
      border: "#bfdbfe",
      path: "/leads",
    },
    {
      title: "Assigned Leads",
      value: stats.assignedLeads ?? 0,
      icon: UserCheck,
      color: "#10b981",
      bg: "#ecfdf5",
      border: "#6ee7b7",
      path: "/leads",
    },
    {
      title: "Today's Reminders",
      value: stats.todayReminders ?? 0,
      icon: Clock,
      color: "#f59e0b",
      bg: "#fffbeb",
      border: "#fcd34d",
      path: "/today-reminders",
    },
    {
      title: "Missed Follow-ups",
      value: stats.missedFollowUps ?? 0,
      icon: PhoneOff,
      color: "#ef4444",
      bg: "#fff1f2",
      border: "#fca5a5",
      path: "/missed-followups",
    },
  ];

  /* ── Highcharts shared theme ── */
  const chartBg   = "transparent";
  const titleStyle = { color: c.text, fontWeight: "700", fontSize: "15px" };
  const tooltipCfg = {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: 10,
    style: { color: c.text, fontSize: "13px" },
  };

  /* ── Donut chart — Lead Categories ── */
  const donutOptions = {
    chart: { type: "pie", backgroundColor: chartBg, style: { fontFamily: "inherit" }, height: 280 },
    title: { text: "Lead Categories", style: titleStyle },
    tooltip: { ...tooltipCfg, pointFormat: "<b>{point.y}</b> leads ({point.percentage:.0f}%)" },
    plotOptions: {
      pie: {
        innerSize: "65%",
        dataLabels: { enabled: false },
        showInLegend: true,
        borderWidth: 3,
        borderColor: c.surface,
      },
    },
    legend: {
      itemStyle: { color: c.textSecondary, fontWeight: "600", fontSize: "12px" },
      itemHoverStyle: { color: c.primary },
    },
    series: [{
      name: "Leads",
      colorByPoint: true,
      data: [
        { name: "Pending",  y: stats.categories?.pending  ?? 0, color: "#f59e0b" },
        { name: "Closed",   y: stats.categories?.closed   ?? 0, color: "#10b981" },
        { name: "Negative", y: stats.categories?.negative ?? 0, color: "#ef4444" },
        { name: "Missed",   y: stats.categories?.missed   ?? 0, color: "#8b5cf6" },
      ],
    }],
    credits: { enabled: false },
  };

  /* ── Column chart — Lead Flow ── */
  const columnOptions = {
    chart: { type: "column", backgroundColor: chartBg, style: { fontFamily: "inherit" }, height: 280 },
    title: { text: "Lead Flow", style: titleStyle },
    tooltip: { ...tooltipCfg, pointFormat: "<b>{point.y}</b> leads" },
    xAxis: {
      categories: ["Sales Panel", "Unassigned"],
      labels: { style: { color: c.textSecondary, fontWeight: "600", fontSize: "12px" } },
      lineColor: "transparent",
      tickColor: "transparent",
    },
    yAxis: {
      title: { text: "" },
      labels: { style: { color: c.textSecondary, fontSize: "11px" } },
      gridLineColor: c.border,
      gridLineDashStyle: "Dash",
    },
    plotOptions: {
      column: { borderRadius: 8, borderWidth: 0, pointPadding: 0.15, groupPadding: 0.1 },
    },
    series: [{
      name: "Leads",
      data: [
        { y: stats.leadFlow?.salesPanel  ?? 0, color: { linearGradient: { x1:0,x2:0,y1:0,y2:1 }, stops: [[0,"#3b82f6"],[1,"#93c5fd"]] } },
        { y: stats.leadFlow?.unassigned  ?? 0, color: { linearGradient: { x1:0,x2:0,y1:0,y2:1 }, stops: [[0,"#f59e0b"],[1,"#fcd34d"]] } },
      ],
    }],
    legend: { enabled: false },
    credits: { enabled: false },
  };

  /* ── Status + Priority bar helpers ── */
  const statusColors = {
    new: "#6366f1", assigned: "#3b82f6", interested: "#10b981",
    not_interested: "#ef4444", converted: "#059669", closed: "#6b7280", in_process: "#f59e0b",
  };
  const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

  const maxOf = (obj) => Math.max(...Object.values(obj), 1);

  return (
    <div className="w-full pb-20 space-y-5">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2"
            style={{ color: c.text }}>
            <Activity size={26} style={{ color: c.primary }} />
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Live overview of your CRM performance.
          </p>
        </div>
        <button onClick={fetchStats}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl
            text-sm font-bold border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ══════════ STAT CARDS ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ title, value, icon: Icon, color, bg, border, path }) => (
          <div key={title}
            onClick={() => path && navigate(path)}
            className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 flex items-center justify-between group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
            style={{
              backgroundColor: isDark ? c.surface : bg,
              borderColor: isDark ? c.border : border,
            }}>
            {/* Decorative circle */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
              style={{ backgroundColor: color }} />

            <div className="z-10">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"
                style={{ color: isDark ? c.textSecondary : color }}>
                {title}
                <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </p>
              <p className="text-3xl sm:text-4xl font-black tracking-tight"
                style={{ color: isDark ? c.text : color }}>
                {value}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 z-10
              group-hover:scale-110 transition-transform duration-200"
              style={{ backgroundColor: isDark ? `${color}20` : `${color}20`, color }}>
              <Icon size={22} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* ══════════ CHARTS ROW ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="rounded-2xl border p-4 sm:p-5"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${c.primary}18`, color: c.primary }}>
              <PieChart size={14} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: c.text }}>Lead Categories</p>
              <p className="text-[11px]" style={{ color: c.textSecondary }}>Pending, Closed, Negative, Missed</p>
            </div>
          </div>
          <HighchartsReact highcharts={Highcharts} options={donutOptions} />
        </div>

        {/* Column */}
        <div className="rounded-2xl border p-4 sm:p-5"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${c.primary}18`, color: c.primary }}>
              <BarChart2 size={14} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: c.text }}>Lead Flow</p>
              <p className="text-[11px]" style={{ color: c.textSecondary }}>Sales Panel, Unassigned</p>
            </div>
          </div>
          <HighchartsReact highcharts={Highcharts} options={columnOptions} />
        </div>
      </div>

      {/* ══════════ BREAKDOWN ROW ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── By Status ── */}
        <div className="rounded-2xl border p-4 sm:p-5"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-bold" style={{ color: c.text }}>Status Breakdown</p>
              <p className="text-[11px]" style={{ color: c.textSecondary }}>Lead volume per pipeline stage</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
              style={{ backgroundColor: `${c.primary}12`, borderColor: `${c.primary}25`, color: c.primary }}>
              {Object.values(stats.breakdown?.byStatus || {}).reduce((a, b) => a + b, 0)} total
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(stats.breakdown?.byStatus || {}).map(([key, val]) => {
              const max  = maxOf(stats.breakdown?.byStatus || {});
              const pct  = max === 0 ? 0 : Math.round((val / max) * 100);
              const clr  = statusColors[key] || c.primary;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clr }} />
                      <span className="text-xs font-semibold capitalize" style={{ color: c.text }}>
                        {key.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs font-black" style={{ color: c.text }}>{val}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: isDark ? c.border : "#f3f4f6" }}>
                    <div className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: clr, opacity: val === 0 ? 0.25 : 1 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── By Priority ── */}
        <div className="rounded-2xl border p-4 sm:p-5"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-bold" style={{ color: c.text }}>Priority Breakdown</p>
              <p className="text-[11px]" style={{ color: c.textSecondary }}>Leads categorized by urgency</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
              style={{ backgroundColor: `${c.accent}12`, borderColor: `${c.accent}25`, color: c.accent }}>
              {Object.values(stats.breakdown?.byPriority || {}).reduce((a, b) => a + b, 0)} total
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(stats.breakdown?.byPriority || {}).map(([key, val]) => {
              const max  = maxOf(stats.breakdown?.byPriority || {});
              const pct  = max === 0 ? 0 : Math.round((val / max) * 100);
              const clr  = priorityColors[key] || c.textSecondary;
              const bgBadge = key === "high" ? "#fee2e2" : key === "medium" ? "#fef3c7" : "#d1fae5";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase border"
                        style={{
                          backgroundColor: isDark ? `${clr}20` : bgBadge,
                          borderColor: `${clr}40`,
                          color: clr,
                        }}>
                        {key}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black" style={{ color: c.text }}>{val}</span>
                      <span className="text-[10px] font-semibold" style={{ color: c.textSecondary }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: isDark ? c.border : "#f3f4f6" }}>
                    <div className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: clr, opacity: val === 0 ? 0.2 : 1 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Priority summary chips */}
          <div className="flex gap-2 mt-5 pt-4 border-t flex-wrap"
            style={{ borderColor: c.border }}>
            {Object.entries(stats.breakdown?.byPriority || {}).map(([key, val]) => {
              const clr = priorityColors[key] || c.textSecondary;
              return (
                <div key={key}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                  style={{ backgroundColor: `${clr}12`, borderColor: `${clr}30` }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clr }} />
                  <span className="text-xs font-bold capitalize" style={{ color: clr }}>{key}</span>
                  <span className="text-xs font-black" style={{ color: clr }}>{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
