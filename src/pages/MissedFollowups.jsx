import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Phone, MessageCircle, AlertTriangle, CalendarX,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw,
  CheckCircle2, Clock, User, Tag, Inbox
} from 'lucide-react';
import { toast } from 'sonner';
import { dashboardAPI } from '../api/dashboard';

const ITEMS = 10;

export default function MissedFollowups() {
  const { themeColors: c } = useTheme();
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchMissed(); }, []);

  const fetchMissed = async () => {
    try {
      setLoading(true); setError(null);
      const res = await dashboardAPI.getMissedFollowups();
      setLeads(res?.data?.leads || res?.leads || []);
    } catch {
      setError('Failed to load missed follow-ups.');
      toast.error('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages    = Math.ceil(leads.length / ITEMS) || 1;
  const paginated     = leads.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);
  const isDark        = c.mode === 'dark';

  /* ── helpers ── */
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

  /* ─────────── LOADING ─────────── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: '#ef4444' }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading overdue leads…</p>
    </div>
  );

  /* ─────────── ERROR ─────────── */
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
      <button onClick={fetchMissed}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ backgroundColor: '#ef4444', color: '#fff' }}>
        <RefreshCw size={14} /> Try Again
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#dc2626' }}>
            Missed Follow-ups
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Overdue leads that need immediate attention.
          </p>
        </div>
        <button onClick={fetchMissed}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl
            text-sm font-bold border transition-all hover:opacity-80"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ══════════ STATS BANNER ══════════ */}
      <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-6 flex items-center gap-4 sm:gap-6"
        style={{ backgroundColor: isDark ? '#450a0a' : '#fff1f2', borderColor: '#fecaca' }}>
        {/* Decorative icon bg */}
        <div className="absolute -right-4 -top-4 opacity-10">
          <AlertTriangle size={120} color="#ef4444" />
        </div>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
          <AlertTriangle size={26} />
        </div>

        <div className="z-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
            Requires Immediate Action
          </p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black" style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>
              {leads.length}
            </span>
            <span className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>overdue leads</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-12 mx-2" style={{ backgroundColor: '#fca5a5' }} />

        {/* Extra stat */}
        <div className="hidden sm:block z-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>High Priority</p>
          <span className="text-3xl font-black" style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>
            {leads.filter(l => l.priority?.toLowerCase() === 'high').length}
          </span>
        </div>
      </div>

      {/* ══════════ EMPTY STATE ══════════ */}
      {leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black" style={{ color: c.text }}>All Caught Up!</h3>
            <p className="text-sm mt-1 max-w-xs" style={{ color: c.textSecondary }}>
              No missed follow-ups right now. Great work!
            </p>
          </div>
        </div>
      )}

      {/* ══════════ CONTENT ══════════ */}
      {leads.length > 0 && (
        <div className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>

          {/* ── MOBILE CARDS (< md) ── */}
          <div className="block md:hidden divide-y" style={{ borderColor: c.border }}>
            {paginated.map((lead) => (
              <MobileCard key={lead._id} lead={lead} c={c} fmtDate={fmtDate}
                getBadge={getBadge} priorityStyle={priorityStyle} statusStyle={statusStyle} />
            ))}
          </div>

          {/* ── DESKTOP TABLE (md+) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr style={{ backgroundColor: isDark ? '#450a0a22' : '#fff1f2', borderBottom: `1px solid ${c.border}` }}>
                  {['Lead', 'Contact', 'Status', 'Priority', 'Missed Date', 'Last Remark', 'Assigned To', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: h === 'Missed Date' ? '#dc2626' : c.textSecondary }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((lead) => {
                  const remark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : '—';
                  return (
                    <tr key={lead._id}
                      className="border-b transition-colors duration-150"
                      style={{ borderColor: c.border }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? '#450a0a22' : '#fff1f2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>

                      {/* Lead */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-bold" style={{ color: c.text }}>{lead.name || '—'}</p>
                        <p className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{lead.source || '—'}</p>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-semibold" style={{ color: c.text }}>{lead.phone || '—'}</p>
                        <p className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: c.textSecondary }}>{lead.email || '—'}</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getBadge(statusStyle, lead.status)}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getBadge(priorityStyle, lead.priority)}
                      </td>

                      {/* Missed Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                          style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                          <CalendarX size={12} />
                          {fmtDate(lead.followUpDate)}
                        </span>
                      </td>

                      {/* Last Remark */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs truncate" style={{ color: c.textSecondary }} title={remark}>{remark}</p>
                      </td>

                      {/* Assigned */}
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
                            <a href={lead.integrations.whatsappLink} target="_blank" rel="noreferrer"
                              className="p-2 rounded-lg border transition-all hover:scale-105"
                              style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                              title="WhatsApp">
                              <MessageCircle size={15} />
                            </a>
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
            style={{ borderColor: c.border, backgroundColor: isDark ? `${c.background}80` : `${c.background}60` }}>

            <p className="text-xs sm:text-sm font-medium order-2 xs:order-1" style={{ color: c.textSecondary }}>
              Showing{' '}
              <span className="font-bold" style={{ color: c.text }}>
                {(currentPage - 1) * ITEMS + 1}
              </span>{' '}–{' '}
              <span className="font-bold" style={{ color: c.text }}>
                {Math.min(currentPage * ITEMS, leads.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold" style={{ color: c.text }}>{leads.length}</span>
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
                          backgroundColor: currentPage === item ? '#dc2626' : c.background,
                          color: currentPage === item ? '#fff' : c.text,
                          border: `1px solid ${currentPage === item ? '#dc2626' : c.border}`,
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
function MobileCard({ lead, c, fmtDate, getBadge, priorityStyle, statusStyle }) {
  const remark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : null;
  const isDark = c.mode === 'dark';

  return (
    <div className="p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: c.text }}>{lead.name || '—'}</p>
          <p className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{lead.source || '—'}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {getBadge(priorityStyle, lead.priority)}
          {getBadge(statusStyle, lead.status)}
        </div>
      </div>

      {/* Contact row */}
      <div className="flex flex-wrap gap-3 text-xs font-semibold" style={{ color: c.textSecondary }}>
        <span className="flex items-center gap-1"><Phone size={11} /> {lead.phone || '—'}</span>
        {lead.email && <span className="flex items-center gap-1 truncate max-w-[180px]">✉ {lead.email}</span>}
      </div>

      {/* Missed date */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border w-fit"
        style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
        <CalendarX size={11} />
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
            <a href={lead.integrations.whatsappLink} target="_blank" rel="noreferrer"
              className="p-2 rounded-lg border transition-all"
              style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
              <MessageCircle size={14} />
            </a>
          )}
        </div>
      </div>
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
