import React, { useState, useEffect, useMemo } from "react";
import { dashboardAPI } from "../api/dashboard";
import { useTheme } from "../context/ThemeContext";
import BulkLeadDistributeModal from "../components/BulkLeadDistributeModal";
import {
  FileText,
  RefreshCw,
  AlertCircle,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  PhoneCall,
  UserCheck,
  PlusCircle,
  TrendingUp,
  UserX
} from "lucide-react";

export default function LeadAssignmentReport() {
  const { themeColors: c } = useTheme();
  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalLeads: 0,
    assignedCount: 0,
    unassignedCount: 0,
    pendingCallsCount: 0,
    callsDoneCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeDatePreset, setActiveDatePreset] = useState("all");

  const isDark = c.mode === "dark";

  // Helper to format local YYYY-MM-DD
  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const applyPreset = (preset) => {
    setActiveDatePreset(preset);
    const today = new Date();

    if (preset === "today") {
      const ymd = formatYMD(today);
      setStartDate(ymd);
      setEndDate(ymd);
    } else if (preset === "yesterday") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const ymd = formatYMD(yest);
      setStartDate(ymd);
      setEndDate(ymd);
    } else if (preset === "thisWeek") {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      setStartDate(formatYMD(monday));
      setEndDate(formatYMD(new Date()));
    } else if (preset === "thisMonth") {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(new Date()));
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit: 10 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await dashboardAPI.getLeadReport(params);
      setReportData(res?.data?.report || []);
      if (res?.summary) {
        setSummaryData(res.summary);
      }
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Failed to load lead assignment report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [page, startDate, endDate]);

  const groupedData = useMemo(() => {
    const groups = {};
    reportData.forEach((row) => {
      const key = row.assigneeId || row.assignee;
      if (!groups[key]) {
        groups[key] = {
          assigneeId: row.assigneeId,
          assignee: row.assignee,
          assigneeRole: row.assigneeRole,
          leadsAssigned: 0,
          callsDone: 0,
          pendingCalls: 0,
        };
      }
      groups[key].leadsAssigned += row.leadsAssigned || 0;
      groups[key].callsDone += row.callsDone || 0;
      groups[key].pendingCalls += row.pendingCalls || 0;
    });
    return Object.values(groups).sort((a, b) => b.leadsAssigned - a.leadsAssigned);
  }, [reportData]);

  // Spotlight telecallers (Jyoti, Alpana)
  const spotlightUsers = useMemo(() => {
    return groupedData.filter(
      (u) =>
        u.assignee &&
        (u.assignee.toLowerCase().includes("jyoti") ||
          u.assignee.toLowerCase().includes("alpana"))
    );
  }, [groupedData]);

  const handleApplyFilter = () => {
    setPage(1);
    fetchReport();
  };

  const handleClearFilter = () => {
    setActiveDatePreset("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="w-full pb-20 space-y-6">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${c.primary}18`, color: c.primary }}
            >
              <FileText size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: c.text }}>
              Lead Assignment & Distribution
            </h1>
          </div>
          <p className="mt-1 text-sm font-medium" style={{ color: c.textSecondary }}>
            Track real-time lead counts assigned to Jyoti, Alpana, and calling team with calling progress.
          </p>
        </div>

        {/* Action Button for Preeti */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: c.primary }}
          >
            <PlusCircle size={18} />
            Bulk Paste & Distribute Leads
          </button>
        </div>
      </div>

      {/* ══════════ KPI METRICS SUMMARY ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Leads */}
        <div
          className="p-4 rounded-2xl border transition-all hover:shadow-sm"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>
              Total Handled
            </span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${c.primary}15`, color: c.primary }}
            >
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2" style={{ color: c.text }}>
            {summaryData.totalLeads.toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-gray-400">Total in timeframe</span>
        </div>

        {/* Assigned Leads */}
        <div
          className="p-4 rounded-2xl border transition-all hover:shadow-sm"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Total Assigned
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-cyan-600 dark:text-cyan-400">
            {summaryData.assignedCount.toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-gray-400">Distributed to agents</span>
        </div>

        {/* Pending Calls */}
        <div
          className="p-4 rounded-2xl border transition-all hover:shadow-sm"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Calls
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
            {summaryData.pendingCallsCount.toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-gray-400">Awaiting telecaller call</span>
        </div>

        {/* Completed Calls */}
        <div
          className="p-4 rounded-2xl border transition-all hover:shadow-sm"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Calls Done
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            {summaryData.callsDoneCount.toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-gray-400">Successfully called</span>
        </div>

        {/* Unassigned Leads */}
        <div
          className="p-4 rounded-2xl border col-span-2 lg:col-span-1 transition-all hover:shadow-sm"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-500">
              Unassigned
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-950/50 text-red-500">
              <UserX size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-red-500">
            {summaryData.unassignedCount.toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-gray-400">Needs telecaller</span>
        </div>
      </div>

      {/* ══════════ JYOTI & ALPANA SPOTLIGHT CARDS ══════════ */}
      {spotlightUsers.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>
            Primary Telecaller Progress (Jyoti & Alpana)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spotlightUsers.map((user) => {
              const callRate =
                user.leadsAssigned > 0
                  ? Math.round((user.callsDone / user.leadsAssigned) * 100)
                  : 0;

              return (
                <div
                  key={user.assigneeId || user.assignee}
                  className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
                  style={{ backgroundColor: c.surface, borderColor: c.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-md"
                        style={{ backgroundColor: c.primary }}
                      >
                        {user.assignee.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base" style={{ color: c.text }}>
                          {user.assignee}
                        </h3>
                        <span className="text-xs font-semibold text-gray-400 uppercase">
                          {user.assigneeRole || "Telecaller"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black" style={{ color: c.primary }}>
                        {user.leadsAssigned}
                      </span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-center" style={{ borderColor: c.border }}>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        Calls Done
                      </span>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {user.callsDone}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                        Pending
                      </span>
                      <p className="text-base font-black text-amber-600 dark:text-amber-400">
                        {user.pendingCalls}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                        Completion
                      </span>
                      <p className="text-base font-black text-cyan-600 dark:text-cyan-400">
                        {callRate}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${callRate}%`,
                        backgroundColor: callRate > 70 ? "#10b981" : c.primary,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════ FILTERS ══════════ */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: c.surface, borderColor: c.border }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick preset pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: c.textSecondary }}>
              Timeframe:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "thisWeek", label: "This Week" },
              { id: "thisMonth", label: "This Month" },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeDatePreset === preset.id
                    ? "shadow-sm text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                style={{
                  backgroundColor: activeDatePreset === preset.id ? c.primary : "transparent",
                  color: activeDatePreset === preset.id ? "#fff" : c.textSecondary,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date range pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: c.textSecondary }} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setActiveDatePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: isDark ? "#1f2937" : "#fff",
                  borderColor: c.border,
                  color: c.text,
                  "--tw-ring-color": c.primary,
                }}
              />
            </div>
            <span style={{ color: c.textSecondary }} className="text-xs font-bold">
              to
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setActiveDatePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: isDark ? "#1f2937" : "#fff",
                  borderColor: c.border,
                  color: c.text,
                  "--tw-ring-color": c.primary,
                }}
              />
            </div>

            <button
              onClick={handleApplyFilter}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow hover:opacity-90 transition-all flex items-center gap-1.5"
              style={{ backgroundColor: c.primary }}
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : "Apply"}
            </button>

            {(startDate || endDate || activeDatePreset !== "all") && (
              <button
                onClick={handleClearFilter}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                style={{ borderColor: c.border, color: c.textSecondary }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ TABLE ══════════ */}
      <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: c.border }}>
          <h3 className="font-bold text-sm" style={{ color: c.text }}>
            Assignee Performance Breakdown
          </h3>
          <span className="text-xs font-medium" style={{ color: c.textSecondary }}>
            {groupedData.length} active assignees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: isDark ? `${c.border}40` : "#f9fafb", borderBottom: `1px solid ${c.border}` }}>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>
                  Assignee Name
                </th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>
                  Role
                </th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-right" style={{ color: c.textSecondary }}>
                  Total Assigned
                </th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-right" style={{ color: c.textSecondary }}>
                  Calls Done
                </th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-right" style={{ color: c.textSecondary }}>
                  Pending Calls
                </th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>
                  Calling Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && reportData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                        style={{ borderColor: c.border, borderTopColor: c.primary }}
                      />
                      <span className="text-xs font-semibold" style={{ color: c.textSecondary }}>
                        Loading distribution data…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : groupedData.length > 0 ? (
                groupedData.map((row, index) => {
                  const callPercentage =
                    row.leadsAssigned > 0
                      ? Math.round((row.callsDone / row.leadsAssigned) * 100)
                      : 0;

                  return (
                    <tr
                      key={index}
                      style={{ borderBottom: `1px solid ${c.border}` }}
                      className="hover:bg-gray-500/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-bold flex items-center gap-2.5" style={{ color: c.text }}>
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: `${c.primary}18`, color: c.primary }}
                        >
                          {row.assignee ? row.assignee.charAt(0) : "U"}
                        </div>
                        {row.assignee}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border"
                          style={{
                            backgroundColor: `${c.primary}15`,
                            borderColor: `${c.primary}30`,
                            color: c.primary,
                          }}
                        >
                          {row.assigneeRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-right" style={{ color: c.text }}>
                        {row.leadsAssigned}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-right text-emerald-600 dark:text-emerald-400">
                        {row.callsDone}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-right text-amber-600 dark:text-amber-400">
                        {row.pendingCalls}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${callPercentage}%`,
                                backgroundColor: callPercentage >= 80 ? "#10b981" : c.primary,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold shrink-0" style={{ color: c.textSecondary }}>
                            {callPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm" style={{ color: c.textSecondary }}>
                    No assignment records found for the selected timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════ PAGINATION ══════════ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-xl text-sm font-bold border transition-all disabled:opacity-50"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
          >
            Previous
          </button>
          <span className="text-sm font-semibold" style={{ color: c.textSecondary }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-xl text-sm font-bold border transition-all disabled:opacity-50"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
          >
            Next
          </button>
        </div>
      )}

      {/* ══════════ BULK LEAD DISTRIBUTE MODAL ══════════ */}
      <BulkLeadDistributeModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          fetchReport();
        }}
      />
    </div>
  );
}
