import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Lock, User, Mail, Phone, ShieldCheck,
  Eye, EyeOff, Save, AlertCircle, CheckCircle2,
  Briefcase, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../api/auth';
import { profileAPI } from '../api/profile';

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Profile() {
  const { themeColors } = useTheme();
  const { admin } = useAuth();

  const [activeTab, setActiveTab]       = useState('general');
  const [loading, setLoading]           = useState(true);
  const [savingProfile, setSavingProfile]   = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', role: '' });
  const [passwords, setPasswords]     = useState({ current: '', new: '', confirm: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileAPI.getProfile();
      if (res?.data?.user) {
        const u = res.data.user;
        setProfileData({ name: u.name || '', email: u.email || '', phone: u.phone || '', role: u.role || '' });
      }
    } catch {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await profileAPI.updateProfile({ name: profileData.name, email: profileData.email, phone: profileData.phone });
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error('New passwords do not match!');
    if (passwords.new.length < 6) return toast.error('Password must be at least 6 characters.');
    setSavingPassword(true);
    try {
      const data = await authAPI.changePassword(passwords.current, passwords.new);
      toast.success(data?.message || 'Password updated!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const c = themeColors;
  const isDark = c.mode === 'dark';

  /* shared input style */
  const inputSt = {
    backgroundColor: c.background,
    color: c.text,
    borderColor: c.border,
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: c.border, borderTopColor: c.primary }} />
        <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading profile…</p>
      </div>
    </div>
  );

  return (
    <div className="w-full pb-20">

      {/* ══════════════════════════════
          HERO BANNER
      ══════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden mb-5 border"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>

        {/* Gradient stripe */}
        <div className="h-28 sm:h-36 w-full relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primary}cc 40%, ${c.accent}99 100%)`,
          }}>
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20"
            style={{ backgroundColor: '#ffffff' }} />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10"
            style={{ backgroundColor: '#ffffff' }} />
          <div className="absolute top-4 right-20 w-12 h-12 rounded-full opacity-10"
            style={{ backgroundColor: '#ffffff' }} />
        </div>

        {/* Avatar + Info */}
        <div className="px-4 sm:px-6 pb-5 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5 -mt-10 sm:-mt-12">

          {/* Avatar circle */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center
              text-2xl sm:text-3xl font-black border-4 shadow-xl shrink-0 z-10"
            style={{
              backgroundColor: c.primary,
              color: '#fff',
              borderColor: c.surface,
            }}>
            {getInitials(profileData.name)}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0 sm:pb-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate"
              style={{ color: c.text }}>
              {profileData.name || 'Admin User'}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Role badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                  text-[11px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${c.primary}20`, color: c.primary }}>
                <Briefcase size={10} />
                {profileData.role || 'Admin'}
              </span>

              {/* Active badge */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: c.success }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: c.success }} />
                Active
              </span>
            </div>
          </div>

          {/* Email pill — hidden on small, visible sm+ */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border
              text-xs font-semibold self-end mb-1 shrink-0"
            style={{ backgroundColor: c.background, borderColor: c.border, color: c.textSecondary }}>
            <Mail size={12} />
            <span className="max-w-[180px] truncate">{profileData.email || '—'}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          QUICK INFO CARDS
      ══════════════════════════════ */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Full Name',  value: profileData.name  || '—', icon: User,       color: c.primary },
          { label: 'Phone',      value: profileData.phone || '—', icon: Phone,      color: c.success },
          { label: 'Role',       value: profileData.role  || '—', icon: ShieldCheck, color: c.accent  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label}
            className="flex items-center gap-3 p-3.5 rounded-xl border"
            style={{ backgroundColor: c.surface, borderColor: c.border }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18`, color }}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: c.textSecondary }}>{label}</p>
              <p className="text-sm font-bold truncate" style={{ color: c.text }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════
          TABS
      ══════════════════════════════ */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-full sm:w-fit border overflow-x-auto"
        style={{ backgroundColor: c.background, borderColor: c.border }}>
        {[
          { key: 'general',  label: 'Personal Info', icon: User        },
          { key: 'security', label: 'Security',       icon: ShieldCheck },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2
              px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
              duration-200 whitespace-nowrap"
            style={{
              backgroundColor: activeTab === key ? c.surface : 'transparent',
              color:            activeTab === key ? c.primary : c.textSecondary,
              border:           activeTab === key ? `1px solid ${c.border}` : '1px solid transparent',
              boxShadow:        activeTab === key ? `0 2px 8px ${c.primary}18` : 'none',
            }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════
          CONTENT CARD
      ══════════════════════════════ */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: c.surface, borderColor: c.border }}>

        {/* Card header */}
        <div className="px-4 sm:px-6 py-4 border-b flex items-center gap-3"
          style={{
            borderColor: c.border,
            backgroundColor: isDark ? `${c.background}99` : `${c.background}70`,
          }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: activeTab === 'general'
                ? `${c.primary}18` : `${c.danger}18`,
              color: activeTab === 'general' ? c.primary : c.danger,
            }}>
            {activeTab === 'general' ? <User size={15} /> : <Lock size={15} />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold" style={{ color: c.text }}>
              {activeTab === 'general' ? 'Personal Information' : 'Security Settings'}
            </h2>
            <p className="text-xs" style={{ color: c.textSecondary }}>
              {activeTab === 'general'
                ? 'Update your name, email and phone number.'
                : 'Change your account password securely.'}
            </p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 sm:p-6">

          {/* ── Personal Info Tab ── */}
          {activeTab === 'general' && (
            <form onSubmit={handleProfileSubmit}
              className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <InputField label="Full Name" icon={User} inputSt={inputSt}>
                  <input required type="text" name="name"
                    value={profileData.name}
                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm
                      font-medium outline-none transition-all"
                    style={inputSt}
                  />
                </InputField>

                <InputField label="Phone Number" icon={Phone} inputSt={inputSt}>
                  <input required type="tel" name="phone"
                    value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm
                      font-medium outline-none transition-all"
                    style={inputSt}
                  />
                </InputField>
              </div>

              <InputField label="Email Address" icon={Mail} inputSt={inputSt}>
                <input required type="email" name="email"
                  value={profileData.email}
                  onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="e.g. rahul@crm.com"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm
                    font-medium outline-none transition-all"
                  style={inputSt}
                />
              </InputField>

              {/* Role — read only */}
              <InputField label="Role (Read Only)" icon={Briefcase} inputSt={inputSt}>
                <input readOnly type="text"
                  value={profileData.role || 'Admin'}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm
                    font-medium outline-none cursor-not-allowed opacity-60"
                  style={inputSt}
                />
              </InputField>

              <div className="pt-4 border-t flex flex-col xs:flex-row justify-end gap-3"
                style={{ borderColor: c.border }}>
                <button type="submit" disabled={savingProfile}
                  className="w-full xs:w-auto flex items-center justify-center gap-2
                    px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                    disabled:opacity-60 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: c.primary, color: '#fff' }}>
                  {savingProfile
                    ? <><Spinner /> Saving…</>
                    : <><Save size={15} /> Save Changes</>}
                </button>
              </div>
            </form>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit}
              className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Info alert */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border text-xs sm:text-sm"
                style={{
                  backgroundColor: `${c.info}12`,
                  borderColor: `${c.info}30`,
                  color: c.info,
                }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="font-medium">
                  Use a strong password — min. 6 characters with numbers &amp; symbols.
                </span>
              </div>

              {/* Current password */}
              <PwdField
                label="Current Password" name="current"
                value={passwords.current} visible={show.current}
                onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                c={c} inputSt={inputSt}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <PwdField
                  label="New Password" name="new"
                  value={passwords.new} visible={show.new}
                  onToggle={() => setShow(s => ({ ...s, new: !s.new }))}
                  onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                  c={c} inputSt={inputSt}
                />
                <PwdField
                  label="Confirm New Password" name="confirm"
                  value={passwords.confirm} visible={show.confirm}
                  onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                  c={c} inputSt={inputSt}
                  error={passwords.confirm && passwords.new !== passwords.confirm
                    ? 'Passwords do not match' : ''}
                  success={passwords.confirm && passwords.new === passwords.confirm && passwords.new
                    ? 'Passwords match!' : ''}
                />
              </div>

              {/* Password strength bar */}
              {passwords.new && (
                <StrengthBar password={passwords.new} c={c} />
              )}

              <div className="pt-4 border-t flex flex-col xs:flex-row justify-end gap-3"
                style={{ borderColor: c.border }}>
                <button type="submit"
                  disabled={savingPassword || !passwords.current || !passwords.new || !passwords.confirm}
                  className="w-full xs:w-auto flex items-center justify-center gap-2
                    px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                    disabled:opacity-60 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: c.danger, color: '#fff' }}>
                  {savingPassword
                    ? <><Spinner /> Updating…</>
                    : <><ShieldCheck size={15} /> Update Password</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

function InputField({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wider opacity-60">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Icon size={15} />
        </div>
        {children}
      </div>
    </div>
  );
}

function PwdField({ label, name, value, visible, onToggle, onChange, c, inputSt, error, success }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wider"
        style={{ color: c.textSecondary }}>{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Lock size={15} />
        </div>
        <input required type={visible ? 'text' : 'password'}
          name={name} value={value} onChange={onChange}
          placeholder="••••••••"
          className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border text-sm font-medium outline-none transition-all"
          style={{
            ...inputSt,
            borderColor: error ? c.danger : success ? c.success : inputSt.borderColor,
          }}
        />
        <button type="button" onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center transition-opacity hover:opacity-80"
          style={{ color: c.textSecondary }}>
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs font-semibold" style={{ color: c.danger }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {success && !error && (
        <p className="flex items-center gap-1 text-xs font-semibold" style={{ color: c.success }}>
          <CheckCircle2 size={11} /> {success}
        </p>
      )}
    </div>
  );
}

function StrengthBar({ password, c }) {
  const calc = (p) => {
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const score = calc(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', c.danger, c.warning, c.accent, c.success, c.success];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? colors[score] : c.border }} />
        ))}
      </div>
      {score > 0 && (
        <p className="text-xs font-semibold" style={{ color: colors[score] }}>
          {labels[score]}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}
