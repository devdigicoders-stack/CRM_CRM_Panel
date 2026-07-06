import React, { useState, useEffect } from "react";
import { dashboardAPI } from "../api/dashboard";
import { useTheme } from "../context/ThemeContext";
import { FileText, RefreshCw, AlertCircle, Calendar } from "lucide-react";

export default function LeadAssignmentReport() {
  const { themeColors: c } = useTheme();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isDark = c.mode === "dark";

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { page, limit: 10 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await dashboardAPI.getLeadReport(params);
      setReportData(res?.data?.report || []);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (err) {
      setError("Failed to load lead assignment report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [page]);

  const handleApplyFilter = () => {
    setPage(1);
    fetchReport();
  };

  /* ── Loading ── */
  if (loading && reportData.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>
        Loading report…
      </p>
    </div>
  );

  /* ── Error ── */
  if (error && reportData.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${c.danger}18`, color: c.danger }}>
        <AlertCircle size={32} />
      </div>
      <div>
        <h3 className="text-lg font-bold" style={{ color: c.text }}>Failed to load</h3>
        <p className="text-sm mt-1" style={{ color: c.textSecondary }}>{error}</p>
      </div>
      <button onClick={fetchReport}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
        style={{ backgroundColor: c.primary, color: "#fff" }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2"
            style={{ color: c.text }}>
            <FileText size={26} style={{ color: c.primary }} />
            Lead Assignment Report
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Date-wise report of lead assignments to team members.
          </p>
        </div>
      </div>

      {/* ══════════ FILTERS ══════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar size={18} style={{ color: c.textSecondary }} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: isDark ? "#1f2937" : "#fff",
              borderColor: c.border,
              color: c.text,
              '--tw-ring-color': c.primary
            }}
          />
        </div>
        <span style={{ color: c.textSecondary }} className="font-semibold text-sm">to</span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar size={18} style={{ color: c.textSecondary }} />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: isDark ? "#1f2937" : "#fff",
              borderColor: c.border,
              color: c.text,
              '--tw-ring-color': c.primary
            }}
          />
        </div>
        <button
          onClick={handleApplyFilter}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ backgroundColor: c.primary, color: "#fff" }}
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : "Apply Filter"}
        </button>
      </div>

      {/* ══════════ TABLE ══════════ */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: c.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: isDark ? `${c.border}40` : "#f9fafb", borderBottom: `1px solid ${c.border}` }}>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>Assignee Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>Leads Assigned</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${c.border}` }} className="hover:bg-opacity-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: c.text }}>{row.date}</td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: c.text }}>{row.assignee}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border"
                        style={{
                          backgroundColor: `${c.primary}15`,
                          borderColor: `${c.primary}30`,
                          color: c.primary
                        }}>
                        {row.assigneeRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black" style={{ color: c.text }}>{row.leadsAssigned}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm" style={{ color: c.textSecondary }}>
                    No assignment records found for the selected dates.
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
    </div>
  );
}
