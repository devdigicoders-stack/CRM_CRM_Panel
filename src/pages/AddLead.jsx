import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  User, Phone, Mail, FileText, Zap,
  Globe, Facebook, PhoneCall, Users, ChevronDown,
  CheckCircle2, AlertCircle, Sparkles, PlusCircle, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { leadAPI } from '../api/lead';
import { userAPI } from '../api/user';
import { dashboardAPI } from '../api/dashboard';

const EMPTY = { name: '', phone: '', email: '', source: '', priority: '', remark: '', assignedTo: '', tags: '' };

const PRIORITY_META = {
  high:   { color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', desc: 'Urgent' },
  medium: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d', desc: 'Normal' },
  low:    { color: '#10b981', bg: '#d1fae5', border: '#6ee7b7', desc: 'Relaxed' },
};

const SOURCE_COLORS = ['#4285f4','#1877f2','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];

export default function AddLead() {
  const { themeColors: c } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [salesList, setSalesList] = useState([]);
  const [sources, setSources] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [leadTags, setLeadTags] = useState([]);
  const [phoneConflict, setPhoneConflict] = useState(null);

  const isDark = c.mode === 'dark';

  useEffect(() => {
    const phone = formData.phone?.trim();
    const cleanPhone = phone?.replace(/\D/g, '');
    
    if (!phone || cleanPhone.length < 10) {
      setPhoneConflict(null);
      return;
    }

    const delayDebounce = setTimeout(() => {
      leadAPI.checkPhone(phone)
        .then(res => {
          if (res?.exists) {
            const lead = res.lead;
            setPhoneConflict({
              exists: true,
              name: lead.name,
              assignedToName: lead.assignedTo?.name || null,
              assignedToRole: lead.assignedTo?.role || null,
            });
          } else {
            setPhoneConflict(null);
          }
        })
        .catch(() => {
          setPhoneConflict(null);
        });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [formData.phone]);

  useEffect(() => {
    userAPI.getSalesList()
      .then(res => setSalesList(res?.data?.users || []))
      .catch(() => setSalesList([]));

    dashboardAPI.getSettings()
      .then(res => {
        const s = res?.data?.settings;
        if (s) {
          setSources(s.leadSources || []);
          setPriorities(s.priorities || []);
          setLeadTags(s.leadTags || []);
          setFormData(prev => ({
            ...prev,
            source: s.leadSources?.[0] || '',
            priority: s.priorities?.[0] || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadAPI.createLead(formData);
      toast.success('Lead added successfully!');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setFormData(EMPTY);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputSt = {
    backgroundColor: c.background,
    color: c.text,
    borderColor: c.border,
  };

  return (
    <div className="w-full pb-20 space-y-5">

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2"
            style={{ color: c.text }}>
            <PlusCircle size={28} style={{ color: c.primary }} />
            Add New Lead
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Fill in the details below to register a new lead in the CRM.
          </p>
        </div>

        {/* Success badge */}
        {submitted && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold animate-in fade-in duration-300"
            style={{ backgroundColor: '#d1fae5', borderColor: '#6ee7b7', color: '#065f46' }}>
            <CheckCircle2 size={16} />
            Lead saved!
          </div>
        )}
      </div>

      {/* ══════════ FORM CARD ══════════ */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>

        {/* Card header */}
        <div className="px-4 sm:px-6 py-4 border-b flex items-center gap-3"
          style={{
            borderColor: c.border,
            backgroundColor: isDark ? `${c.background}99` : `${c.background}70`,
          }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${c.primary}18`, color: c.primary }}>
            <Sparkles size={15} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: c.text }}>Lead Information</h2>
            <p className="text-xs" style={{ color: c.textSecondary }}>All fields marked * are required.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">

          {/* ── ROW 1 : Name + Phone ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Full Name *" icon={User} c={c}>
              <input
                required type="text" name="name"
                value={formData.name} onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all"
                style={inputSt}
              />
            </Field>

            <Field label="Phone Number *" icon={Phone} c={c}>
              <input
                required type="tel" name="phone"
                maxLength={10} pattern="[0-9]{10}"
                value={formData.phone} onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all"
                style={inputSt}
              />
              {phoneConflict && (
                <div className="mt-2 flex items-start gap-2.5 p-3 rounded-xl border text-xs font-bold animate-in fade-in duration-200"
                  style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#b91c1c' }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <span>⚠️ Yeh lead/mobile number pehle se hi added hai under lead <b>{phoneConflict.name}</b>.</span>
                    {phoneConflict.assignedToName ? (
                      <span> Assigned to: <b className="capitalize">{phoneConflict.assignedToName}</b> ({phoneConflict.assignedToRole || 'sales'})</span>
                    ) : (
                      <span> (Not assigned yet)</span>
                    )}
                  </div>
                </div>
              )}
            </Field>
          </div>

          {/* ── ROW 2 : Email ── */}
          <Field label="Email Address" icon={Mail} c={c}>
            <input
              type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="e.g. rahul@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all"
              style={inputSt}
            />
          </Field>

          {/* ── DIVIDER ── */}
          <div className="border-t" style={{ borderColor: c.border }} />

          {/* ── LEAD SOURCE ── */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider"
              style={{ color: c.textSecondary }}>Lead Source *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {sources.map((src, i) => {
                const active = formData.source === src;
                const color = SOURCE_COLORS[i % SOURCE_COLORS.length];
                return (
                  <button key={src} type="button"
                    onClick={() => setFormData(p => ({ ...p, source: src }))}
                    className="flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      backgroundColor: active ? `${color}15` : c.background,
                      borderColor: active ? color : c.border,
                      boxShadow: active ? `0 0 0 2px ${color}30` : 'none',
                    }}>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-bold truncate"
                      style={{ color: active ? color : c.text }}>{src}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── PRIORITY ── */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider"
              style={{ color: c.textSecondary }}>Priority Level *</label>
            <div className="grid grid-cols-3 gap-3">
              {priorities.map((p) => {
                const meta = PRIORITY_META[p] || { color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', desc: '' };
                const active = formData.priority === p;
                return (
                  <button key={p} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                    className="flex items-center gap-2.5 p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      backgroundColor: active ? meta.bg : c.background,
                      borderColor: active ? meta.border : c.border,
                      boxShadow: active ? `0 0 0 2px ${meta.color}25` : 'none',
                    }}>
                    <div className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: active ? meta.color : c.border }} />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold capitalize truncate"
                        style={{ color: active ? meta.color : c.text }}>{p}</p>
                      <p className="text-[10px] hidden sm:block"
                        style={{ color: active ? meta.color : c.textSecondary }}>{meta.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TAGS ── */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider"
              style={{ color: c.textSecondary }}>Tags</label>
            <div className="relative">
              <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto pointer-events-none"
                style={{ color: c.textSecondary }} />
              <select name="tags" value={formData.tags} onChange={handleChange}
                className="w-full pl-4 pr-8 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all appearance-none"
                style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}>
                <option value="">-- Select Tag --</option>
                {leadTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── ASSIGNED TO ── */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider"
              style={{ color: c.textSecondary }}>
              Assigned To (Sales)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                style={{ color: c.textSecondary }}>
                <UserCheck size={15} />
              </div>
              <ChevronDown size={14} className="absolute inset-y-0 right-3 my-auto pointer-events-none"
                style={{ color: c.textSecondary }} />
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all appearance-none"
                style={{ backgroundColor: c.background, color: c.text, borderColor: c.border }}>
                <option value="">-- Select Sales Person --</option>
                {salesList.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className="border-t" style={{ borderColor: c.border }} />

          {/* ── REMARKS ── */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider"
              style={{ color: c.textSecondary }}>
              Initial Notes / Remarks
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none"
                style={{ color: c.textSecondary }}>
                <FileText size={15} />
              </div>
              <textarea
                name="remark" value={formData.remark} onChange={handleChange}
                rows={4}
                placeholder="Any initial requirements, conversation notes or context about this lead..."
                className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all resize-none"
                style={inputSt}
              />
            </div>
            <p className="text-[10px]" style={{ color: c.textSecondary }}>
              {formData.remark.length} characters
            </p>
          </div>

          {/* ── FORM FOOTER ── */}
          <div className="pt-2 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
            style={{ borderColor: c.border }}>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2">
              {formData.name && (
                <Chip icon={User} label={formData.name} c={c} />
              )}
              {formData.source && (
                <Chip icon={Zap} label={formData.source} c={c} />
              )}
              {formData.priority && (
                <Chip
                  icon={AlertCircle}
                  label={formData.priority}
                  c={c}
                  color={PRIORITY_META[formData.priority]?.color}
                />
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 shrink-0">
              <button type="button"
                onClick={() => setFormData(EMPTY)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
                style={{ backgroundColor: c.background, borderColor: c.border, color: c.textSecondary }}>
                Clear
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 hover:opacity-90 active:scale-95 min-w-[130px]"
                style={{ backgroundColor: c.primary, color: '#fff' }}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : <><PlusCircle size={15} /> Save Lead</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ══════════ TIPS CARD ══════════ */}
      <div className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
        style={{ backgroundColor: isDark ? `${c.primary}10` : `${c.primary}08`, borderColor: `${c.primary}25` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${c.primary}20`, color: c.primary }}>
          <AlertCircle size={16} />
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: c.text }}>Quick Tips</p>
          <ul className="space-y-1">
            {[
              'Name aur Phone number required fields hain.',
              'Sahi source select karo taaki analytics accurate rahe.',
              'High priority leads ko aaj hi follow up karo.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: c.textSecondary }}>
                <span className="mt-0.5 shrink-0" style={{ color: c.primary }}>•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function Field({ label, icon: Icon, c, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wider"
        style={{ color: c.textSecondary }}>{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          style={{ color: c.textSecondary }}>
          <Icon size={15} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label, c, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold"
      style={{
        backgroundColor: color ? `${color}12` : c.background,
        borderColor: color ? `${color}30` : c.border,
        color: color || c.textSecondary,
      }}>
      <Icon size={10} />
      {label}
    </span>
  );
}
