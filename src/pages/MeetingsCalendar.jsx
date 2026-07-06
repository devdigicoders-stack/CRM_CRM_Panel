import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import axiosInstance from "../api/axiosInstance";
import {
  Calendar, Clock, User, Phone, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, X, FileText
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
  
  const [selectedEventForRemark, setSelectedEventForRemark] = useState(null);
  const [remarkData, setRemarkData] = useState({ note: '', status: '', followUpDate: '' });
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedEventForRemark) {
      let tzDate = '';
      if (selectedEventForRemark.followUpDate) {
        const d = new Date(selectedEventForRemark.followUpDate);
        tzDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
      setRemarkData({
        note: '',
        status: selectedEventForRemark.status || 'new',
        followUpDate: tzDate
      });
    }
  }, [selectedEventForRemark]);

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

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkData.note.trim()) return toast.error("Remark note is required");
    
    setIsSubmittingRemark(true);
    try {
      const payload = {
        note: remarkData.note,
        status: remarkData.status
      };
      
      if (remarkData.followUpDate) {
        payload.followUpDate = new Date(remarkData.followUpDate).toISOString();
      }

      const res = await axiosInstance.post(`/leads/${selectedEventForRemark._id}/remarks`, payload);
      
      if (res.data.status === "success") {
        toast.success("Lead updated successfully!");
        setSelectedEventForRemark(null);
        setSelectedDay(null);
        fetchData();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update lead");
    } finally {
      setIsSubmittingRemark(false);
    }
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
                    {m.meetingNote && (
                      <div className="mt-2.5 p-3 rounded-xl border text-sm"
                        style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}>
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] uppercase tracking-wider" style={{ color: c.textSecondary }}>
                          <FileText size={12} /> Notes / Description
                        </div>
                        <p>{m.meetingNote}</p>
                      </div>
                    )}
                    <div className="mt-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedEventForRemark(m); }}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                        style={{ backgroundColor: c.primary }}
                      >
                        Update Lead
                      </button>
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
      
      {/* Update Lead / Add Remark Modal */}
      {selectedEventForRemark && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md flex flex-col rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: '1px' }}
          >
            <div className="flex justify-between items-center p-4 border-b shrink-0" style={{ borderColor: c.border }}>
              <h2 className="text-lg font-bold" style={{ color: c.text }}>
                Update Lead
              </h2>
              <button onClick={() => setSelectedEventForRemark(null)} className="p-2 rounded-full hover:bg-black/5" style={{ color: c.textSecondary }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="px-4 py-3 border-b bg-black/5 dark:bg-white/5" style={{ borderColor: c.border }}>
               <h3 className="font-bold truncate" style={{ color: c.text }}>{selectedEventForRemark.name}</h3>
               <p className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{selectedEventForRemark.phone}</p>
            </div>

            <form onSubmit={handleAddRemark} className="p-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: c.text }}>Status</label>
                <select 
                  className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                  style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}
                  value={remarkData.status}
                  onChange={e => setRemarkData({...remarkData, status: e.target.value})}
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_process">In Process</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="call_done">Call Done</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: c.text }}>Next Follow-up (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                  style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}
                  value={remarkData.followUpDate}
                  onChange={e => setRemarkData({...remarkData, followUpDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: c.text }}>Remark Note <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  className="w-full p-2.5 rounded-lg border focus:ring-2 focus:outline-none transition-all min-h-[100px] resize-none"
                  style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}
                  placeholder="Enter conversation details..."
                  value={remarkData.note}
                  onChange={e => setRemarkData({...remarkData, note: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedEventForRemark(null)} className="px-4 py-2 rounded-lg font-bold transition-all border" style={{ borderColor: c.border, color: c.text }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingRemark} className="px-4 py-2 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-70" style={{ backgroundColor: c.primary }}>
                  {isSubmittingRemark ? 'Saving...' : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
