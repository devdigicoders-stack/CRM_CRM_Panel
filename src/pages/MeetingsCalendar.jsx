import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import axiosInstance from "../api/axiosInstance";
import {
  Calendar, Clock, User, Phone, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, X
} from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const getPriorityColor = (p) =>
  p === "high" ? "#dc2626" : p === "medium" ? "#f59e0b" : "#10b981";

const getStatusColor = (s) => {
  if (s === "converted") return "#10b981";
  if (s === "interested") return "#3b82f6";
  if (s === "not_interested") return "#dc2626";
  return "#6b7280";
};

export default function MeetingsCalendar() {
  const { themeColors: c } = useTheme();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split("T")[0];
      const res = await axiosInstance.get("/calendar", { params: { startDate, endDate } });
      setMeetings(res?.data?.data?.events || []);
    } catch (err) {
      console.error("Calendar error:", err);
      setError("Meetings load nahi hui.");
      toast.error("Meetings load nahi hui.");
    } finally {
      setLoading(false);
    }
  };

  // Group by date "YYYY-MM-DD"
  const byDate = {};
  meetings.forEach((m) => {
    if (!m.followUpDate) return;
    const key = new Date(m.followUpDate).toISOString().split("T")[0];
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(m);
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDay({ dateStr, day, meetings: byDate[dateStr] || [] });
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: c.border, borderTopColor: c.primary }} />
        <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading meetings…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle size={40} color="#dc2626" />
        <p style={{ color: c.text }}>{error}</p>
        <button onClick={fetchData} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: c.primary }}>
          <RefreshCw size={14} className="inline mr-2" /> Retry
        </button>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-4" style={{ minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <Calendar size={24} style={{ color: c.primary }} /> Meetings Calendar
          </h1>
          <p className="text-sm mt-0.5" style={{ color: c.textSecondary }}>
            {meetings.length} follow-ups scheduled
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border hover:opacity-80 transition"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Calendar Card ── */}
      <div className="flex-1 rounded-2xl border overflow-hidden flex flex-col"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>

        {/* Month Nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: c.border }}>
          <button onClick={prevMonth} className="p-2 rounded-xl hover:opacity-70 transition" style={{ color: c.text }}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-black" style={{ color: c.text }}>
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:opacity-70 transition" style={{ color: c.text }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: c.border }}>
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-bold" style={{ color: c.textSecondary }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "minmax(90px, 1fr)" }}>
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-r"
              style={{ borderColor: c.border, backgroundColor: c.background, opacity: 0.5 }} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayMeetings = byDate[dateStr] || [];
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = selectedDay?.dateStr === dateStr;

            return (
              <div key={day} onClick={() => handleDayClick(day)}
                className="border-b border-r p-1.5 cursor-pointer transition-all hover:opacity-90"
                style={{
                  borderColor: c.border,
                  backgroundColor: isSelected ? c.primary + "22" : c.surface,
                  outline: isSelected ? `2px solid ${c.primary}` : "none",
                  outlineOffset: "-2px",
                }}>
                {/* Day number */}
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mb-1"
                  style={{ backgroundColor: isToday ? c.primary : "transparent", color: isToday ? "#fff" : c.text }}>
                  {day}
                </span>

                {/* Meeting chips */}
                <div className="space-y-0.5">
                  {dayMeetings.slice(0, 2).map((m) => (
                    <div key={m._id}
                      className="rounded px-1 py-0.5 text-[10px] font-semibold text-white truncate"
                      style={{ backgroundColor: getPriorityColor(m.priority) }}
                      title={`${m.name} — ${new Date(m.followUpDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}>
                      {new Date(m.followUpDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} {m.name}
                    </div>
                  ))}
                  {dayMeetings.length > 2 && (
                    <div className="text-[10px] font-bold px-1" style={{ color: c.primary }}>
                      +{dayMeetings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 flex items-center gap-4 border-t" style={{ borderColor: c.border }}>
          <span className="text-xs font-semibold" style={{ color: c.textSecondary }}>Priority:</span>
          {[["High", "#dc2626"], ["Medium", "#f59e0b"], ["Low", "#10b981"]].map(([label, color]) => (
            <span key={label} className="flex items-center gap-1 text-xs font-semibold" style={{ color: c.textSecondary }}>
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Selected Day Detail Panel ── */}
      {selectedDay && (
        <div className="rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: c.border }}>
            <h3 className="font-black text-base" style={{ color: c.text }}>
              📅{" "}
              {new Date(selectedDay.dateStr).toLocaleDateString("en-IN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
              <span className="ml-2 text-sm font-semibold" style={{ color: c.textSecondary }}>
                ({selectedDay.meetings.length} meeting{selectedDay.meetings.length !== 1 ? "s" : ""})
              </span>
            </h3>
            <button onClick={() => setSelectedDay(null)} style={{ color: c.textSecondary }}>
              <X size={18} />
            </button>
          </div>

          {selectedDay.meetings.length === 0 ? (
            <div className="py-10 text-center" style={{ color: c.textSecondary }}>
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Is din koi meeting nahi hai</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: c.border }}>
              {selectedDay.meetings.map((m) => (
                <div key={m._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="font-bold text-base" style={{ color: c.text }}>{m.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: getPriorityColor(m.priority) }}>
                        {m.priority?.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: getStatusColor(m.status) }}>
                        {m.status?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: c.textSecondary }}>
                        <Phone size={13} /> {m.phone}
                      </span>
                      {m.email && (
                        <span className="flex items-center gap-1.5 text-sm" style={{ color: c.textSecondary }}>
                          <User size={13} /> {m.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date & Time Box */}
                  <div className="flex flex-col items-center justify-center rounded-xl px-4 py-3 min-w-[120px] text-center"
                    style={{ backgroundColor: c.primary + "18", border: `1px solid ${c.primary}44` }}>
                    <div className="flex items-center gap-1 text-xs font-semibold mb-1" style={{ color: c.primary }}>
                      <Calendar size={12} />
                      {new Date(m.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-black" style={{ color: c.primary }}>
                      <Clock size={13} />
                      {new Date(m.followUpDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
