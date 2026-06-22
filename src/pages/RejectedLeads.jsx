import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Phone, MessageCircle, AlertOctagon,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw,
  CheckCircle2, X, Eye, FileText, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { leadAPI } from '../api/lead';

const ITEMS = 10;

export default function RejectedLeads() {
  const { themeColors: c } = useTheme();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLead, setDetailsLead] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [remarkSelectedLead, setRemarkSelectedLead] = useState(null);
  const [remarkData, setRemarkData] = useState({ note: '', followUpDate: '', tags: '', priority: '', status: '' });
  const [isAddingRemark, setIsAddingRemark] = useState(false);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [updateData, setUpdateData] = useState({ name: '', phone: '', email: '', priority: '', tags: '' });
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leadAPI.getAllLeads();
      let fetchedLeads = [];
      if (Array.isArray(res?.data?.leads)) fetchedLeads = res.data.leads;
      else if (res?.data?.lead) fetchedLeads = [res.data.lead];
      else if (Array.isArray(res?.leads)) fetchedLeads = res.leads;
      else if (res?.lead) fetchedLeads = [res.lead];
      else if (Array.isArray(res)) fetchedLeads = res;
      setLeads(fetchedLeads);
    } catch (err) {
      setError('Failed to load leads.');
      toast.error('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  };

  // Filter rejected leads: status === 'not_interested' or 'rejected' OR verificationStatus === 'rejected'
  const rejectedLeads = leads.filter(lead => {
    const status = (lead.status || '').toLowerCase();
    const verificationStatus = (lead.verificationStatus || '').toLowerCase();
    const isRejected = status === 'not_interested' || status === 'rejected' || verificationStatus === 'rejected';
    
    if (!isRejected) return false;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        (lead.name || '').toLowerCase().includes(query) ||
        (lead.phone || '').toLowerCase().includes(query) ||
        (lead.email || '').toLowerCase().includes(query) ||
        (lead.source || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(rejectedLeads.length / ITEMS) || 1;
  const paginated = rejectedLeads.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);
  const isDark = c.mode === 'dark';

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
    rejected:       { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    closed:         { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' },
  };

  const getBadge = (map, key, fallback = 'N/A') => {
    const st = map[key?.toLowerCase()] || { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' };
    return (
      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border"
        style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
        {key || fallback}
      </span>
    );
  };

  // Modal handlers
  const handleViewDetails = async (id) => {
    try {
      setLoadingDetails(true);
      setIsDetailsModalOpen(true);
      setDetailsLead(null);
      const res = await leadAPI.getLeadById(id);
      if (res?.data?.lead) {
        setDetailsLead(res.data.lead);
      }
    } catch (err) {
      toast.error("Failed to load lead details.");
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openRemarkModal = (lead) => {
    setRemarkSelectedLead(lead);
    setRemarkData({
      note: '',
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
      tags: lead.tags ? lead.tags.join(', ') : '',
      priority: lead.priority || '',
      status: lead.status || ''
    });
    setIsRemarkModalOpen(true);
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkData.note.trim()) return toast.error("Please enter a remark note.");
    
    try {
      setIsAddingRemark(true);
      const payload = {
        note: remarkData.note,
        followUpDate: remarkData.followUpDate || undefined,
        priority: remarkData.priority || undefined,
        status: remarkData.status || undefined
      };
      
      if (remarkData.tags) {
        payload.tags = remarkData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      
      const res = await leadAPI.addLeadRemark(remarkSelectedLead._id, payload);
      const updatedLead = res?.data?.lead || res?.lead;
      
      if (updatedLead) {
        setLeads(leads.map(l => l._id === remarkSelectedLead._id ? { ...l, ...updatedLead } : l));
      }
      toast.success("Remark added successfully!");
      setIsRemarkModalOpen(false);
    } catch (err) {
      toast.error("Failed to add remark.");
    } finally {
      setIsAddingRemark(false);
    }
  };

  const openUpdateModal = (lead) => {
    setSelectedLead(lead);
    setUpdateData({ 
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      priority: lead.priority || '',
      tags: lead.tags ? lead.tags.join(', ') : ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingLead(true);
      const payload = {
        name: updateData.name,
        phone: updateData.phone,
        email: updateData.email,
        priority: updateData.priority,
        tags: updateData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const res = await leadAPI.updateLead(selectedLead._id, payload);
      const updatedLead = res?.data?.lead || res?.lead || payload;

      setLeads(leads.map(l => l._id === selectedLead._id ? { ...l, ...updatedLead } : l));
      setIsUpdateModalOpen(false);
      toast.success('Lead updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lead');
    } finally {
      setIsUpdatingLead(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: '#ef4444' }} />
      <p className="text-sm font-semibold" style={{ color: c.textSecondary }}>Loading rejected leads…</p>
    </div>
  );

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
      <button onClick={fetchLeads}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
        style={{ backgroundColor: '#ef4444', color: '#fff' }}>
        <RefreshCw size={14} /> Try Again
      </button>
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-red-600">
            Rejected Leads
          </h1>
          <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>
            Leads marked as Not Interested or Rejected.
          </p>
        </div>
        <button onClick={fetchLeads}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl
            text-sm font-bold border transition-all hover:opacity-85"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* STATS BANNER */}
      <div className="relative overflow-hidden rounded-2xl border p-4 sm:p-6 flex items-center gap-4 sm:gap-6"
        style={{ backgroundColor: isDark ? '#450a0a' : '#fff1f2', borderColor: '#fecaca' }}>
        <div className="absolute -right-4 -top-4 opacity-10">
          <AlertOctagon size={120} color="#ef4444" />
        </div>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
          <AlertOctagon size={26} />
        </div>

        <div className="z-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
            Rejected / Not Interested
          </p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black" style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>
              {rejectedLeads.length}
            </span>
            <span className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>leads</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <input
          type="text"
          placeholder="Search rejected leads by name, phone, email, source..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-md p-3 rounded-xl border focus:ring-2 focus:ring-red-100 focus:outline-none transition-all text-sm font-semibold"
          style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
        />
      </div>

      {/* EMPTY STATE */}
      {rejectedLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border"
          style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black" style={{ color: c.text }}>No Rejected Leads</h3>
            <p className="text-sm mt-1 max-w-xs" style={{ color: c.textSecondary }}>
              There are no leads matching the rejected/not interested status.
            </p>
          </div>
        </div>
      )}

      {/* TABLE/CARDS */}
      {rejectedLeads.length > 0 && (
        <div className="rounded-2xl border overflow-hidden bg-white"
          style={{ borderColor: c.border }}>

          {/* MOBILE VIEW */}
          <div className="block md:hidden divide-y" style={{ borderColor: c.border }}>
            {paginated.map((lead) => {
              const remark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : null;
              return (
                <div key={lead._id || Math.random()} className="p-4 space-y-3">
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
                  <div className="flex flex-wrap gap-3 text-xs font-semibold" style={{ color: c.textSecondary }}>
                    <span className="flex items-center gap-1"><Phone size={11} /> {lead.phone || '—'}</span>
                    {lead.email && <span className="flex items-center gap-1 truncate max-w-[180px]">✉ {lead.email}</span>}
                  </div>
                  {remark && (
                    <p className="text-xs rounded-lg px-3 py-2 border truncate bg-gray-50 text-gray-500">
                      💬 {remark}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs italic text-gray-500">
                      Assigned To: {lead.assignedTo?.name || (typeof lead.assignedTo === 'string' ? lead.assignedTo : 'Unassigned')}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleViewDetails(lead._id)} className="p-2 rounded-lg border text-purple-600 bg-purple-50 hover:bg-purple-100 transition-all">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openRemarkModal(lead)} className="p-2 rounded-lg border text-orange-600 bg-orange-50 hover:bg-orange-100 transition-all">
                        <FileText size={14} />
                      </button>
                      <button onClick={() => openUpdateModal(lead)} className="p-2 rounded-lg border text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all">
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-red-50/40 border-b" style={{ borderColor: c.border }}>
                  {['Lead', 'Contact', 'Status', 'Priority', 'Source', 'Assigned To', 'Last Remark', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((lead) => {
                  const remark = lead.remarks?.length ? lead.remarks[lead.remarks.length - 1].note : '—';
                  return (
                    <tr key={lead._id || Math.random()} className="hover:bg-red-50/10 transition-colors duration-150">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-extrabold text-gray-900">{lead.name || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-700">{lead.phone || '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{lead.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getBadge(statusStyle, lead.status)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getBadge(priorityStyle, lead.priority)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {lead.source || '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[11px] font-bold border border-purple-200">
                              {(lead.assignedTo?.name?.charAt(0)) || (typeof lead.assignedTo === 'string' ? lead.assignedTo.charAt(0) : 'U')}
                            </div>
                            {lead.assignedTo?.name || (typeof lead.assignedTo === 'string' ? lead.assignedTo : 'Unassigned')}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px] truncate text-xs text-gray-500" title={remark}>
                        {remark}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewDetails(lead._id)} className="p-2 rounded-xl text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-200 transition-all" title="View Details">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => openRemarkModal(lead)} className="p-2 rounded-xl text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-200 transition-all" title="Add Remark">
                            <FileText size={15} />
                          </button>
                          <button onClick={() => openUpdateModal(lead)} className="p-2 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-800 hover:text-white border border-gray-200 transition-all" title="Update Lead">
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="px-4 py-4 border-t flex items-center justify-between bg-gray-50/50" style={{ borderColor: c.border }}>
            <p className="text-xs sm:text-sm font-medium text-gray-500">
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS, rejectedLeads.length)}</span> of <span className="font-bold text-gray-900">{rejectedLeads.length}</span> leads
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(item => (
                <button key={item} onClick={() => setCurrentPage(item)}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                  style={{
                    backgroundColor: currentPage === item ? '#ef4444' : '#fff',
                    color: currentPage === item ? '#fff' : '#4b5563',
                    border: `1px solid ${currentPage === item ? '#ef4444' : '#e5e7eb'}`,
                  }}>
                  {item}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white transform animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 px-8 py-6 border-b flex items-center justify-between bg-white/95 backdrop-blur-sm">
              <div>
                <h3 className="font-black text-xl text-gray-900">Update Lead</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Updating details for {selectedLead?.name}</p>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><X size={22}/></button>
            </div>
            <form onSubmit={handleUpdateLead} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Name</label>
                  <input type="text" value={updateData.name} onChange={e => setUpdateData({...updateData, name: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Phone</label>
                  <input type="text" value={updateData.phone} onChange={e => setUpdateData({...updateData, phone: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Email</label>
                  <input type="email" value={updateData.email} onChange={e => setUpdateData({...updateData, email: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Priority</label>
                  <select value={updateData.priority} onChange={e => setUpdateData({...updateData, priority: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Tags (comma separated)</label>
                  <input type="text" value={updateData.tags} onChange={e => setUpdateData({...updateData, tags: e.target.value})} placeholder="Interested, Follow Up, Hot Lead" className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={isUpdatingLead} type="submit" className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-md shadow-blue-200 hover:shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[150px] disabled:opacity-70 disabled:cursor-not-allowed">
                  {isUpdatingLead ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Updating...</>
                  ) : (
                    'Save Updates'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMARK MODAL */}
      {isRemarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white transform animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 px-8 py-6 border-b flex items-center justify-between bg-white/95 backdrop-blur-sm">
              <div>
                <h3 className="font-black text-xl text-gray-900">Add Remark / Change Status</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Updating interaction details for {remarkSelectedLead?.name}</p>
              </div>
              <button onClick={() => setIsRemarkModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><X size={22}/></button>
            </div>
            <form onSubmit={handleAddRemark} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Status</label>
                  <select value={remarkData.status} onChange={e => setRemarkData({...remarkData, status: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium">
                    <option value="">No Change</option>
                    <option value="new">New</option>
                    <option value="assigned">Assigned</option>
                    <option value="interested">Interested</option>
                    <option value="not_interested">Not Interested (Rejected)</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Priority</label>
                  <select value={remarkData.priority} onChange={e => setRemarkData({...remarkData, priority: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium">
                    <option value="">No Change</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Next Follow-up Date</label>
                  <input type="date" value={remarkData.followUpDate} onChange={e => setRemarkData({...remarkData, followUpDate: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Tags (comma separated)</label>
                  <input type="text" value={remarkData.tags} onChange={e => setRemarkData({...remarkData, tags: e.target.value})} placeholder="e.g. Interested, FollowUp" className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Remark Note</label>
                  <textarea value={remarkData.note} onChange={e => setRemarkData({...remarkData, note: e.target.value})} rows={4} placeholder="Write what happened in this interaction..." className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium resize-none" />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsRemarkModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={isAddingRemark} type="submit" className="px-6 py-3 rounded-xl font-bold bg-orange-600 text-white shadow-md shadow-orange-200 hover:shadow-lg hover:bg-orange-700 hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[150px] disabled:opacity-70 disabled:cursor-not-allowed">
                  {isAddingRemark ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Adding...</>
                  ) : (
                    'Add Remark'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white transform animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 px-8 py-6 border-b flex items-center justify-between bg-white/95 backdrop-blur-sm">
              <div>
                <h3 className="font-black text-2xl text-gray-900">Lead Full Details</h3>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><X size={24}/></button>
            </div>
            <div className="p-8">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Loading details...</p>
                </div>
              ) : detailsLead ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 col-span-1 md:col-span-2">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-1">Name</p>
                      <p className="text-lg font-black text-gray-900">{detailsLead.name}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 col-span-1">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-1">Phone</p>
                      <p className="text-lg font-black text-gray-900">{detailsLead.phone}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 col-span-1">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-1">Source</p>
                      <p className="text-lg font-black text-gray-900">{detailsLead.source || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Status & Tracking</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Lead Status</p>
                          <p className="text-sm font-bold text-blue-600 uppercase">{detailsLead.status}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Verification</p>
                          <p className="text-sm font-bold text-gray-800 uppercase">{detailsLead.verificationStatus}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Payment</p>
                          <p className="text-sm font-bold text-gray-800 uppercase">{detailsLead.paymentStatus}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Installation</p>
                          <p className="text-sm font-bold text-gray-800 uppercase">{detailsLead.installationStatus}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4 md:col-span-2">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Additional details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Email</p>
                          <p className="text-sm font-bold text-gray-800">{detailsLead.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Assigned Representative</p>
                          <p className="text-sm font-bold text-gray-800">{detailsLead.assignedTo?.name || (typeof detailsLead.assignedTo === 'string' ? detailsLead.assignedTo : 'Unassigned')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Next Follow Up</p>
                          <p className="text-sm font-bold text-gray-800">{fmtDate(detailsLead.followUpDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Lead Created At</p>
                          <p className="text-sm font-bold text-gray-800">{fmtDate(detailsLead.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remarks Timeline */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span>Remarks History</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold">{(detailsLead.remarks || []).length}</span>
                    </h4>
                    {!(detailsLead.remarks || []).length ? (
                      <p className="text-sm text-gray-500 italic">No remarks added yet.</p>
                    ) : (
                      <div className="relative border-l border-gray-200 ml-4 space-y-6">
                        {(detailsLead.remarks || []).map((rem, idx) => (
                          <div key={idx} className="relative pl-6">
                            <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-purple-600 border-2 border-white" />
                            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1">
                              <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                                <span>{rem.createdBy?.name || 'User'}</span>
                                <span>{fmtDate(rem.date)}</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-800">{rem.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">Lead details not found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
