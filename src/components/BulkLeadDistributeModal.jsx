import React, { useState, useEffect } from "react";
import { userAPI } from "../api/user";
import { leadAPI } from "../api/lead";
import { useTheme } from "../context/ThemeContext";
import {
  X,
  Users,
  Copy,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Send,
  RefreshCw,
  PhoneCall,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

export default function BulkLeadDistributeModal({ isOpen, onClose, onSuccess }) {
  const { themeColors: c } = useTheme();
  const isDark = c.mode === "dark";

  const [rawText, setRawText] = useState("");
  const [telecallers, setTelecallers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [source, setSource] = useState("Bulk CRM User Paste");
  const [loadingTelecallers, setLoadingTelecallers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setResultData(null);
      return;
    }

    const fetchTelecallers = async () => {
      try {
        setLoadingTelecallers(true);
        const res = await userAPI.getTelecallerList();
        const list = res?.data?.users || res?.users || [];
        // Only active telecallers/calling users
        const activeList = list.filter((u) => u.active !== false && u.role !== "crmuser");
        setTelecallers(activeList);
        
        // Auto-select Jyoti and Alpana if present, or all active telecallers
        const jyotiOrAlpana = activeList.filter(u => 
          u.name.toLowerCase().includes("jyoti") || u.name.toLowerCase().includes("alpana")
        ).map(u => u._id);

        if (jyotiOrAlpana.length > 0) {
          setSelectedUserIds(jyotiOrAlpana);
        } else if (activeList.length > 0) {
          setSelectedUserIds(activeList.map(u => u._id));
        }
      } catch (err) {
        console.error("Failed to load telecallers:", err);
        toast.error("Failed to load telecallers list.");
      } finally {
        setLoadingTelecallers(false);
      }
    };

    fetchTelecallers();
  }, [isOpen]);

  // Real-time preview of parsed phone numbers from raw text
  const detectedNumbers = React.useMemo(() => {
    if (!rawText.trim()) return [];
    const lines = rawText.split(/[\n,;]+/);
    const seen = new Set();
    const numbers = [];

    lines.forEach((line) => {
      const clean = line.replace(/\D/g, "");
      if (clean.length >= 10) {
        const last10 = clean.slice(-10);
        if (!seen.has(last10)) {
          seen.add(last10);
          numbers.push(clean.length > 10 ? clean : `+91${clean}`);
        }
      }
    });
    return numbers;
  }, [rawText]);

  const toggleUserSelection = (userId) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) {
        toast.warning("At least one telecaller must be selected for distribution.");
        return;
      }
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === telecallers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(telecallers.map((u) => u._id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (detectedNumbers.length === 0) {
      toast.error("Please paste at least one valid 10-digit phone number.");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one telecaller (e.g. Jyoti, Alpana).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await leadAPI.bulkDistribute({
        rawData: rawText,
        targetUserIds: selectedUserIds,
        skipDuplicates,
        source: source.trim() || "Bulk CRM User",
      });

      if (res?.data) {
        setResultData(res.data);
        toast.success(`Distributed ${res.data.totalAssigned} leads successfully!`);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Bulk distribution failed:", err);
      toast.error(err?.response?.data?.message || "Failed to distribute leads.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setRawText("");
    setResultData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all"
        style={{
          backgroundColor: isDark ? "#111827" : "#ffffff",
          borderColor: isDark ? "#374151" : "#e5e7eb",
          color: c.text,
        }}
      >
        {/* ── Modal Header ── */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: c.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${c.primary}18`, color: c.primary }}
            >
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight" style={{ color: c.text }}>
                Bulk Paste & Distribute Leads
              </h2>
              <p className="text-xs font-medium" style={{ color: c.textSecondary }}>
                Preeti's Direct Distribution Engine for Telecallers (Jyoti, Alpana)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {resultData ? (
            /* ══ RESULT REPORT VIEW ══ */
            <div className="space-y-6">
              <div
                className="p-5 rounded-2xl border flex items-start gap-4"
                style={{
                  backgroundColor: isDark ? "#064e3b20" : "#ecfdf5",
                  borderColor: isDark ? "#065f46" : "#a7f3d0",
                }}
              >
                <CheckCircle size={28} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    Lead Distribution Completed Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                    Leads have been allocated in real time with exact database synchronization.
                  </p>
                </div>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className="p-4 rounded-2xl border text-center"
                  style={{ backgroundColor: c.surface, borderColor: c.border }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Parsed</span>
                  <p className="text-2xl font-black mt-1" style={{ color: c.text }}>
                    {resultData.totalParsed}
                  </p>
                </div>
                <div
                  className="p-4 rounded-2xl border text-center"
                  style={{ backgroundColor: `${c.primary}10`, borderColor: `${c.primary}30` }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Assigned
                  </span>
                  <p className="text-2xl font-black mt-1" style={{ color: c.primary }}>
                    {resultData.totalAssigned}
                  </p>
                </div>
                <div
                  className="p-4 rounded-2xl border text-center"
                  style={{ backgroundColor: isDark ? "#78350f15" : "#fffbeb", borderColor: "#fcd34d" }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Skipped Dupes
                  </span>
                  <p className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">
                    {resultData.totalSkipped}
                  </p>
                </div>
                <div
                  className="p-4 rounded-2xl border text-center"
                  style={{ backgroundColor: c.surface, borderColor: c.border }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Invalid</span>
                  <p className="text-2xl font-black mt-1 text-red-500">
                    {resultData.invalidCount || 0}
                  </p>
                </div>
              </div>

              {/* Exact Telecaller Breakdown */}
              <div
                className="p-5 rounded-2xl border"
                style={{ backgroundColor: c.surface, borderColor: c.border }}
              >
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: c.text }}>
                  Exact Telecaller Assignment Breakdown
                </h4>
                <div className="divide-y" style={{ borderColor: c.border }}>
                  {resultData.distribution?.map((dist) => (
                    <div key={dist.userId} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                          style={{ backgroundColor: `${c.primary}15`, color: c.primary }}
                        >
                          {dist.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: c.text }}>
                            {dist.name}
                          </p>
                          <span className="text-[11px] font-bold text-gray-400 uppercase">
                            {dist.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black" style={{ color: c.primary }}>
                          +{dist.count}
                        </span>
                        <span className="text-xs font-semibold text-gray-400">leads assigned</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skipped Duplicates Details */}
              {resultData.skippedDuplicates?.length > 0 && (
                <div
                  className="p-5 rounded-2xl border space-y-3"
                  style={{
                    backgroundColor: isDark ? "#78350f10" : "#fffbeb",
                    borderColor: "#fde68a",
                  }}
                >
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <ShieldCheck size={18} />
                    <span>Duplicate Lead Protection ({resultData.skippedDuplicates.length} prevented)</span>
                  </div>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    The following numbers already exist in the CRM and were safely protected from duplicate calls:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {resultData.skippedDuplicates.map((dup, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border text-xs flex items-center justify-between bg-white dark:bg-gray-800"
                        style={{ borderColor: c.border }}
                      >
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {dup.phone} <span className="text-gray-400 font-normal">({dup.name})</span>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            Assigned to: {dup.assignedTo?.name || "Unassigned"} ({dup.assignedTo?.role || "N/A"})
                          </span>
                          {dup.status && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                              {dup.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ borderColor: c.border, color: c.text }}
                >
                  Distribute More Numbers
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90 transition-all"
                  style={{ backgroundColor: c.primary }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ══ INPUT FORM VIEW ══ */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Telecaller Selectors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>
                    1. Select Target Telecallers ({selectedUserIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold hover:underline"
                    style={{ color: c.primary }}
                  >
                    {selectedUserIds.length === telecallers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {loadingTelecallers ? (
                  <div className="flex items-center justify-center p-6 text-sm text-gray-400 gap-2">
                    <RefreshCw size={16} className="animate-spin" /> Loading telecallers…
                  </div>
                ) : telecallers.length === 0 ? (
                  <div className="p-4 rounded-xl border text-sm text-amber-500 bg-amber-50/20">
                    No active telecallers found in the system.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {telecallers.map((user) => {
                      const isSelected = selectedUserIds.includes(user._id);
                      const isPriority =
                        user.name.toLowerCase().includes("jyoti") ||
                        user.name.toLowerCase().includes("alpana");

                      return (
                        <div
                          key={user._id}
                          onClick={() => toggleUserSelection(user._id)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? "ring-2 ring-cyan-500/50 shadow-sm"
                              : "opacity-75 hover:opacity-100"
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? isDark
                                ? "#0e749020"
                                : "#ecfeff"
                              : c.surface,
                            borderColor: isSelected ? c.primary : c.border,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                              style={{
                                backgroundColor: isSelected ? c.primary : `${c.border}50`,
                                color: isSelected ? "#fff" : c.textSecondary,
                              }}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold" style={{ color: c.text }}>
                                  {user.name}
                                </span>
                                {isPriority && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-gray-400">
                                {user.phone || user.role}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-cyan-600 text-white border-cyan-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {isSelected && <CheckCircle size={16} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Raw Text Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: c.textSecondary }}>
                    2. Paste Contact Numbers / Leads List
                  </label>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      detectedNumbers.length > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}
                  >
                    {detectedNumbers.length} Valid Numbers Detected
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste numbers here (one per line, comma separated, or raw list)...&#10;Example:&#10;9876543210&#10;9123456780, Amit Sharma&#10;9988776655 - Delhi"
                  className="w-full p-4 rounded-2xl border text-sm font-mono focus:outline-none focus:ring-2 transition-all leading-relaxed"
                  style={{
                    backgroundColor: isDark ? "#1f2937" : "#f9fafb",
                    borderColor: c.border,
                    color: c.text,
                    "--tw-ring-color": c.primary,
                  }}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  💡 Tip: The system will automatically sanitize 10-digit Indian mobile numbers and ignore junk text.
                </p>
              </div>

              {/* Options & Lead Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: c.textSecondary }}>
                    Lead Source Tag
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Bulk CRM User, WhatsApp campaign..."
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      borderColor: c.border,
                      color: c.text,
                      "--tw-ring-color": c.primary,
                    }}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-colors"
                    style={{
                      backgroundColor: skipDuplicates ? (isDark ? "#065f4620" : "#ecfdf5") : c.surface,
                      borderColor: skipDuplicates ? "#10b981" : c.border,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                        Skip Duplicate Leads
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Prevents assigning numbers that are already in CRM
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Projected Distribution Preview */}
              {detectedNumbers.length > 0 && selectedUserIds.length > 0 && (
                <div
                  className="p-4 rounded-2xl border"
                  style={{ backgroundColor: c.surface, borderColor: c.border }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Projected Equal Distribution:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserIds.map((uid) => {
                      const user = telecallers.find((u) => u._id === uid);
                      const perUser = Math.floor(detectedNumbers.length / selectedUserIds.length);
                      return (
                        <div
                          key={uid}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2"
                          style={{
                            backgroundColor: `${c.primary}10`,
                            borderColor: `${c.primary}30`,
                            color: c.primary,
                          }}
                        >
                          <span>{user?.name || "Telecaller"}:</span>
                          <span className="font-black text-sm">~{perUser} leads</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: c.border }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold border hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ borderColor: c.border, color: c.text }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || detectedNumbers.length === 0 || selectedUserIds.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: c.primary }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Distributing...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Distribute {detectedNumbers.length} Leads Now
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
