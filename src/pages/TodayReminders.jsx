import React, { useState, useEffect } from 'react';
import WhatsAppChooserModal from '../components/WhatsAppChooserModal';
import { useTheme } from '../context/ThemeContext';
import {
  Phone, MessageCircle, Clock, CalendarClock,
  ChevronLeft, ChevronRight, AlertCircle,
  RefreshCw, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { dashboardAPI } from '../api/dashboard';

const ITEMS = 10;

export default function TodayReminders() {
  const [waModalLead, setWaModalLead] = useState(null);

  const { themeColors: c } = useTheme();
  const [reminders, setReminders]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchReminders(); }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true); setError(null);
      const res = await dashboardAPI.getTodayReminders();
      setReminders(res?.data?.leads || res?.leads || []);
    } catch {
      setError("Failed to load today's reminders.");
      toast.error('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(reminders.length / ITEMS) || 1;
  const paginated  = reminders.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);
  const isDark     = c.mode === 'dark';

  const fmtDate = (d) => d
    ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  const priorityStyle = {
    high:   { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    medium: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
    low:    { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  };

  const statusStyle = {
    interested:     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    assigned:       { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
    pending:        { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    converted:      { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    not_interested: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    closed:         { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' },
  };

  const getBadge = (map, key, fallback = 'N/A') => {
    const st = map[key?.toLowerCase()] || { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' };
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide border"
        style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
        {key || fallback}
      </span>
    );
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: '#2563eb' }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>
        Loading today's reminders…
      </p>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
        <AlertCircle size={32} />
      </div>
      <div>
        <h3 className="text-lg font-bold" style={{ color: c.text }}>Failed to load</h3>
        <p className="text-sm mt-1" style={{ color: c.textSecondary }}>{error}</p>
      </div>
      <button onClick={fetchReminders}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
        style={{ backgroundColor: '#2563eb', color: '#fff' }}>
        <RefreshCw size={14} /> Try Again
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#2563eb' }}>
            Today's Reminders
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Leads scheduled for follow-up today.
          </p>
        </div>
        <button onClick={fetchReminders}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl
            text-sm font-bold border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ══════════ STATS BANNER ══════════ */}
      <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-6 flex items-center gap-4 sm:gap-6"
        style={{
          backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
          borderColor: '#bfdbfe',
        }}>
        {/* Decorative watermark */}
        <div className="absolute -right-4 -top-4 opacity-10">
          <Clock size={120} color="#2563eb" />
        </div>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
          <CalendarClock size={26} />
        </div>

        <div className="z-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3b82f6' }}>
            Scheduled for Today
          </p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black"
              style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>
              {reminders.length}
            </span>
            <span className="text-sm font-semibold mb-1" style={{ color: '#3b82f6' }}>reminders</span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-12 mx-2" style={{ backgroundColor: '#bfdbfe' }} />

        <div className="hidden sm:block z-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3b82f6' }}>
            High Priority
          </p>
          <span className="text-3xl font-black"
            style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>
            {reminders.filter(l => l.priority?.toLowerCase() === 'high').length}
          </span>
        </div>
      </div>

      {/* ══════════ EMPTY STATE ══════════ */}
      {reminders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black" style={{ color: c.text }}>All Clear!</h3>
            <p className="text-sm mt-1 max-w-xs" style={{ color: c.textSecondary }}>
              No reminders scheduled for today. Have a great day!
            </p>
          </div>
        </div>
      )}

      {/* ══════════ CONTENT ══════════ */}
      {reminders.length > 0 && (
        <div className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>

          {/* ── MOBILE CARDS (< md) ── */}
          <div className="block md:hidden divide-y" style={{ borderColor: c.border }}>
            {paginated.map((lead) => (
              <MobileCard key={lead._id} lead={lead} c={c}
                fmtDate={fmtDate} getBadge={getBadge}
                priorityStyle={priorityStyle} statusStyle={statusStyle}
                isDark={isDark} />
            ))}
          </div>

          {/* ── DESKTOP TABLE (md+) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr style={{
                  backgroundColor: isDark ? '#1e3a5f33' : '#eff6ff',
                  borderBottom: `1px solid ${c.border}`
                }}>
                  {['Lead', 'Contact', 'Status', 'Priority', 'Scheduled Time', 'Last Remark', 'Assigned To', 'Actions'].map(h => (
                    <th key={h}
                      className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: h === 'Scheduled Time' ? '#2563eb' : c.textSecondary }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((lead) => {
                  const remark = lead.remarks?.length
                    ? lead.remarks[lead.remarks.length - 1].note : '—';
                  return (
                    <tr key={lead._id}
                      className="border-b transition-colors duration-150"
                      style={{ borderColor: c.border }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? '#1e3a5f22' : '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>

                      {/* Lead */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-bold" style={{ color: c.text }}>{lead.name || '—'}</p>
                        <p className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{lead.source || '—'}</p>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-semibold" style={{ color: c.text }}>{lead.phone || '—'}</p>
                        <p className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: c.textSecondary }}>
                          {lead.email || '—'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getBadge(statusStyle, lead.status)}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getBadge(priorityStyle, lead.priority)}
                      </td>

                      {/* Scheduled Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                          style={{ backgroundColor: isDark ? '#1e3a5f' : '#dbeafe', color: '#2563eb', borderColor: '#93c5fd' }}>
                          <Clock size={12} />
                          {fmtDate(lead.followUpDate)}
                        </span>
                      </td>

                      {/* Last Remark */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs truncate" style={{ color: c.textSecondary }} title={remark}>
                          {remark}
                        </p>
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                              style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                              {(lead.assignedTo?.name || lead.assignedTo)?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold" style={{ color: c.text }}>
                              {lead.assignedTo?.name || lead.assignedTo}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: c.textSecondary }}>Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a href={`tel:${lead.phone}`}
                            className="p-2 rounded-lg border transition-all hover:scale-105"
                            style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
                            title="Call">
                            <Phone size={15} />
                          </a>
                          {lead.integrations?.whatsappLink && (
                            <button onClick={() => setWaModalLead(lead)}
                              className="p-2 rounded-lg border transition-all hover:scale-105"
                              style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                              title="WhatsApp">
                              <MessageCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          <div className="px-4 sm:px-5 py-4 border-t flex flex-col xs:flex-row items-center justify-between gap-3"
            style={{
              borderColor: c.border,
              backgroundColor: isDark ? `${c.background}80` : `${c.background}60`,
            }}>
            <p className="text-xs sm:text-sm font-medium order-2 xs:order-1" style={{ color: c.textSecondary }}>
              Showing{' '}
              <span className="font-bold" style={{ color: c.text }}>
                {(currentPage - 1) * ITEMS + 1}
              </span>{' '}–{' '}
              <span className="font-bold" style={{ color: c.text }}>
                {Math.min(currentPage * ITEMS, reminders.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold" style={{ color: c.text }}>{reminders.length}</span>
            </p>

            <div className="flex items-center gap-1.5 order-1 xs:order-2">
              <PageBtn onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1} c={c}>
                <ChevronLeft size={15} />
              </PageBtn>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '…'
                    ? <span key={`e${idx}`} className="px-1 text-xs" style={{ color: c.textSecondary }}>…</span>
                    : (
                      <button key={item} onClick={() => setCurrentPage(item)}
                        className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: currentPage === item ? '#2563eb' : c.background,
                          color: currentPage === item ? '#fff' : c.text,
                          border: `1px solid ${currentPage === item ? '#2563eb' : c.border}`,
                        }}>
                        {item}
                      </button>
                    )
                )}

              <PageBtn onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages} c={c}>
                <ChevronRight size={15} />
              </PageBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MOBILE CARD
───────────────────────────────────────── */
function MobileCard({ lead, c, fmtDate, getBadge, priorityStyle, statusStyle, isDark }) {
  const remark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : null;

  return (
    <div className="p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: c.text }}>{lead.name || '—'}</p>
          <p className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{lead.source || '—'}</p>
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          {getBadge(priorityStyle, lead.priority)}
          {getBadge(statusStyle, lead.status)}
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-wrap gap-3 text-xs font-semibold" style={{ color: c.textSecondary }}>
        <span className="flex items-center gap-1"><Phone size={11} /> {lead.phone || '—'}</span>
        {lead.email && (
          <span className="flex items-center gap-1 truncate max-w-[180px]">✉ {lead.email}</span>
        )}
      </div>

      {/* Scheduled time */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border w-fit"
        style={{
          backgroundColor: isDark ? '#1e3a5f' : '#dbeafe',
          color: '#2563eb',
          borderColor: '#93c5fd',
        }}>
        <Clock size={11} />
        {fmtDate(lead.followUpDate)}
      </span>

      {/* Remark */}
      {remark && (
        <p className="text-xs rounded-lg px-3 py-2 border truncate"
          style={{ backgroundColor: c.background, borderColor: c.border, color: c.textSecondary }}>
          💬 {remark}
        </p>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-1">
        {lead.assignedTo ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
              {(lead.assignedTo?.name || lead.assignedTo)?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold" style={{ color: c.textSecondary }}>
              {lead.assignedTo?.name || lead.assignedTo}
            </span>
          </div>
        ) : (
          <span className="text-xs italic" style={{ color: c.textSecondary }}>Unassigned</span>
        )}

        <div className="flex gap-2">
          <a href={`tel:${lead.phone}`}
            className="p-2 rounded-lg border transition-all"
            style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}>
            <Phone size={14} />
          </a>
          {lead.integrations?.whatsappLink && (
            <button onClick={() => setWaModalLead(lead)}
              className="p-2 rounded-lg border transition-all"
              style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
              <MessageCircle size={14} />
            </button>
          )}
        </div>
      </div>
      <WhatsAppChooserModal link={waModalLead?.integrations?.whatsappLink} phone={waModalLead?.phone} isOpen={!!waModalLead} onClose={() => setWaModalLead(null)} />
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE BUTTON
───────────────────────────────────────── */
function PageBtn({ children, onClick, disabled, c }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all
        disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
      style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}>
      {children}
    </button>
      
  );
}
