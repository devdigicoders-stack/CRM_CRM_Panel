import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Phone, MessageCircle, Edit3, X, Users, CheckCircle, Clock, ChevronLeft, ChevronRight, Mail, MapPin, AlertCircle, TrendingUp, Plus, Eye, FileText, UserPlus, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { leadAPI } from '../api/lead';
import { userAPI } from '../api/user';
import { dashboardAPI } from '../api/dashboard';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

export default function Leads() {
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  
  // Update Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', priority: '', note: '', followup: '' });
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLead, setDetailsLead] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Remark Modal State
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [remarkSelectedLead, setRemarkSelectedLead] = useState(null);
  const [remarkData, setRemarkData] = useState({ note: '', followUpDate: '', tags: '', priority: '', status: '' });
  const [isAddingRemark, setIsAddingRemark] = useState(false);

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSelectedLead, setAssignSelectedLead] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [salesUsers, setSalesUsers] = useState([]);
  const [leadTags, setLeadTags] = useState([]);

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

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

  useEffect(() => {
    const fetchSalesUsers = async () => {
      try {
        const res = await userAPI.getAllActiveUsers();
        setSalesUsers(res?.data?.users || []);
      } catch (err) {
        console.error("Failed to fetch sales users:", err);
      }
    };
    fetchSalesUsers();

    dashboardAPI.getSettings()
      .then(res => setLeadTags(res?.data?.settings?.leadTags || []))
      .catch(() => {});
  }, []);

  const openAssignModal = (lead) => {
    setAssignSelectedLead(lead);
    setAssignUserId('');
    setIsAssignModalOpen(true);
  };

  const handleAssignLead = async (e) => {
    e.preventDefault();
    if (!assignUserId.trim()) return toast.error("Please select a sales representative.");
    
    try {
      setIsAssigning(true);
      await leadAPI.assignLead(assignSelectedLead._id, assignUserId.trim());
      
      // salesUsers se selected user ka naam nikalo
      const selectedUser = salesUsers.find(u => u._id === assignUserId.trim());
      
      setLeads(prev => prev.map(l =>
        l._id === assignSelectedLead._id
          ? { ...l, assignedTo: selectedUser || { _id: assignUserId, name: 'Assigned' } }
          : l
      ));
      toast.success("Lead assigned successfully!");
      setIsAssignModalOpen(false);
    } catch (err) {
      toast.error("Failed to assign lead.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return toast.error('Pehle file select karo.');
    try {
      setIsBulkUploading(true);
      const formData = new FormData();
      formData.append('file', bulkFile);
      await axiosInstance.post('/leads/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Leads bulk uploaded successfully!');
      setIsBulkModalOpen(false);
      setBulkFile(null);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk upload failed.');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleSampleDownload = () => {
    const headers = ['name', 'phone', 'email', 'source', 'priority', 'remark'];
    const sample = [
      ['Rahul Sharma', '9876543210', 'rahul@example.com', 'Google Ads', 'high', 'Interested in product'],
      ['Priya Singh', '9123456789', 'priya@example.com', 'Facebook Ads', 'medium', 'Follow up next week'],
    ];
    const csvContent = [headers, ...sample].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(false);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, tagQuery]);

  const fetchLeads = async (isReset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (isReset !== true) {
        if (searchQuery) params.search = searchQuery;
        if (tagQuery) params.tag = tagQuery;
      }
      
      const res = await leadAPI.getAllLeads(params);
      // Handle both array of leads and a single lead object
      let fetchedLeads = [];
      if (Array.isArray(res?.data?.leads)) fetchedLeads = res.data.leads;
      else if (res?.data?.lead) fetchedLeads = [res.data.lead];
      else if (Array.isArray(res?.leads)) fetchedLeads = res.leads;
      else if (res?.lead) fetchedLeads = [res.lead];
      else if (Array.isArray(res)) fetchedLeads = res;
      setLeads(fetchedLeads);
    } catch (err) {
      console.error("Failed to fetch leads", err);
      setError("Unable to load leads at this time.");
      toast.error("Error fetching leads.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (lead) => {
    setSelectedLead(lead);
    setUpdateData({ 
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      priority: lead.priority || '',
      tags: lead.tags ? lead.tags.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingLead(true);
      const payload = {
        name: updateData.name,
        phone: updateData.phone,
        email: updateData.email,
        address: updateData.address,
        priority: updateData.priority,
        tags: updateData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const res = await leadAPI.updateLead(selectedLead._id, payload);
      const updatedLead = res?.data?.lead || res?.lead || payload;

      const updatedLeads = leads.map(l => 
        l._id === selectedLead._id ? { ...l, ...updatedLead } : l
      );
      setLeads(updatedLeads);
      setIsModalOpen(false);
      toast.success('Lead updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lead');
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // Stats calculation
  const totalLeads = leads.length;
  const interestedLeads = leads.filter(l => l.status?.toLowerCase() === 'interested').length;
  const highPriority = leads.filter(l => l.priority?.toLowerCase() === 'high').length;

  const totalPages = Math.ceil(totalLeads / itemsPerPage) || 1;
  const paginatedLeads = leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const priorityColors = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const statusColors = {
    interested: 'bg-blue-50 text-blue-700 border-blue-200',
    assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pending: 'bg-orange-50 text-orange-700 border-orange-200',
    converted: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, iconColorClass }) => (
    <div className="relative overflow-hidden p-6 rounded-2xl shadow-sm border bg-white flex items-center justify-between hover:shadow-lg transition-all duration-300 group cursor-pointer" style={{ borderColor: themeColors?.border }}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-gray-50/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
      <div>
        <p className="text-sm font-semibold text-gray-500 tracking-wide mb-1">{title}</p>
        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${colorClass} ${iconColorClass} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={28} strokeWidth={2.5} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: themeColors?.text || '#111827' }}>Leads Center</h1>
          <p className="mt-2 text-base" style={{ color: themeColors?.textSecondary || '#4b5563' }}>Manage, engage, and convert your leads efficiently.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Upload className="mr-2 w-4 h-4" /> Bulk Upload Excel
          </button>
          <button
            onClick={() => navigate('/add-lead')}
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-200 hover:shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Leads" value={loading ? '-' : totalLeads} icon={Users} colorClass="bg-blue-100/50" iconColorClass="text-blue-600" />
        <StatCard title="Interested" value={loading ? '-' : interestedLeads} icon={CheckCircle} colorClass="bg-emerald-100/50" iconColorClass="text-emerald-600" />
        <StatCard title="High Priority" value={loading ? '-' : highPriority} icon={AlertCircle} colorClass="bg-rose-100/50" iconColorClass="text-rose-600" />
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-wrap items-center gap-4" style={{ borderColor: themeColors?.border }}>
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Search (Name, Phone, Email...)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: themeColors?.border }}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <select
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
            style={{ borderColor: themeColors?.border }}
          >
            <option value="">All Tags</option>
            {leadTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => {
            setSearchQuery('');
            setTagQuery('');
          }}
          className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
        >
          Clear Filters
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl shadow-sm border bg-white overflow-hidden flex flex-col transition-all duration-300" style={{ borderColor: themeColors?.border }}>
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading premium leads...</p>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Failed to load</h3>
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchLeads} className="mt-4 px-5 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors">Try Again</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Leads Found</h3>
            <p className="text-gray-500 max-w-md">Your leads list is currently empty. Start adding some leads to see them appear here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b" style={{ borderColor: themeColors?.border }}>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Name</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Phone</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Email</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Address</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Priority</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Verification</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Source</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Assigned To</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead._id || Math.random()} className="hover:bg-blue-50/30 transition-colors duration-200">
                      <td className="p-4 whitespace-nowrap font-extrabold text-gray-900">{lead.name || 'N/A'}</td>
                      <td className="p-4 whitespace-nowrap text-gray-700 font-semibold">{lead.phone || 'N/A'}</td>
                      <td className="p-4 whitespace-nowrap text-gray-600">{lead.email || 'N/A'}</td>
                      <td className="p-4 whitespace-nowrap text-gray-600">{lead.address || 'N/A'}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${statusColors[lead.status?.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {lead.status || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${priorityColors[lead.priority?.toLowerCase()] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {lead.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${lead.verificationStatus === 'verified' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {lead.verificationStatus || 'N/A'}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap text-gray-600 text-sm font-medium">
                        {lead.source || 'N/A'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
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
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">

                          <button onClick={() => handleViewDetails(lead._id)} className="p-2.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white hover:shadow-md transition-all border border-purple-200" title="View Details">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => openAssignModal(lead)} className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 hover:bg-cyan-500 hover:text-white hover:shadow-md transition-all border border-cyan-200" title="Assign Lead">
                            <UserPlus size={18} />
                          </button>
                          <button onClick={() => openRemarkModal(lead)} className="p-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-md transition-all border border-orange-200" title="Add Remark">
                            <FileText size={18} />
                          </button>
                          <button onClick={() => openModal(lead)} className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-800 hover:text-white hover:shadow-md transition-all border border-gray-200" title="Update Lead">
                            <Edit3 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="p-5 border-t flex items-center justify-between bg-gray-50/50" style={{ borderColor: themeColors?.border }}>
              <p className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, totalLeads)}</span> of <span className="font-bold text-gray-900">{totalLeads}</span> leads
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-sm ${currentPage === idx + 1 ? 'bg-blue-600 text-white border-transparent' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white transform animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 px-8 py-6 border-b flex items-center justify-between bg-white/95 backdrop-blur-sm">
              <div>
                <h3 className="font-black text-xl text-gray-900">Update Lead</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Updating details for {selectedLead?.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><X size={22}/></button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              
              {/* Basic Info */}
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
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Address</label>
                  <input type="text" value={updateData.address} onChange={e => setUpdateData({...updateData, address: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
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

      {/* Details Modal */}
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
                  {/* Basic Info */}
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
                      <p className="text-lg font-black text-gray-900">{detailsLead.source}</p>
                    </div>
                  </div>

                  {/* Statuses */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Status & Tracking</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Lead Status</p>
                        <p className="text-sm font-bold text-blue-600 uppercase">{detailsLead.status}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Verification</p>
                        <p className="text-sm font-bold text-gray-800 uppercase">{detailsLead.verificationStatus}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Payment</p>
                        <p className="text-sm font-bold text-gray-800 uppercase">{detailsLead.paymentStatus}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Deal Value</p>
                        <p className="text-sm font-bold text-green-600">₹{detailsLead.dealValue}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Installation</p>
                        <p className="text-sm font-bold text-gray-800 uppercase">{detailsLead.installationStatus}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Delivery</p>
                        <p className="text-sm font-bold text-gray-800 uppercase">{detailsLead.deliveryStatus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Remarks History</h4>
                    {detailsLead.remarks && detailsLead.remarks.length > 0 ? (
                      <div className="space-y-4">
                        {detailsLead.remarks.map((r, i) => (
                          <div key={i} className="p-4 rounded-xl bg-yellow-50/50 border border-yellow-100 relative">
                            <p className="text-sm text-gray-800 font-medium mb-2">{r.note}</p>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-gray-500">
                              <span>By: {r.addedBy?.name || 'Unknown User'}</span>
                              <span>{new Date(r.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No remarks found.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-red-500 font-medium py-10">Data not available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Remark Modal */}
      {isRemarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white transform animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 px-8 py-6 border-b flex items-center justify-between bg-white/95 backdrop-blur-sm">
              <div>
                <h3 className="font-black text-xl text-gray-900">Add Remark</h3>
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
                    <option value="not_interested">Not Interested</option>
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
                  <input type="datetime-local" value={remarkData.followUpDate} onChange={e => setRemarkData({...remarkData, followUpDate: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Tags (comma separated)</label>
                  <input type="text" value={remarkData.tags} onChange={e => setRemarkData({...remarkData, tags: e.target.value})} placeholder="e.g. Interested, FollowUp" className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" />
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Remark Note *</label>
                <textarea rows="3" value={remarkData.note} onChange={e => setRemarkData({...remarkData, note: e.target.value})} placeholder="Type your remark here..." className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:outline-none bg-gray-50/50 text-gray-900 font-medium resize-none" autoFocus></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100 pt-6">
                <button type="button" onClick={() => setIsRemarkModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={isAddingRemark || !remarkData.note.trim()} type="submit" className="px-6 py-3 rounded-xl font-bold bg-orange-600 text-white shadow-md shadow-orange-200 hover:shadow-lg hover:bg-orange-700 hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[120px] disabled:opacity-70 disabled:cursor-not-allowed">
                  {isAddingRemark ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Saving...</>
                  ) : (
                    'Add Remark'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Upload size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">Bulk Upload Leads</h3>
                    <p className="text-green-100 text-xs mt-0.5">Excel ya CSV se ek saath kai leads add karo</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsBulkModalOpen(false); setBulkFile(null); }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">

              {/* Step 1 - Sample */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-sm font-black">1</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Sample file download karo</p>
                  <p className="text-xs text-gray-500 mt-0.5">Isi format mein apna data fill karke upload karo</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['name *', 'phone *', 'email', 'source', 'priority', 'remark'].map(f => (
                      <span key={f} className="px-2 py-0.5 rounded bg-white border border-blue-200 text-[10px] font-bold text-blue-600">{f}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleSampleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shrink-0"
                >
                  <Download size={13} /> Download
                </button>
              </div>

              {/* Step 2 - Upload */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0 text-sm font-black mt-1">2</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 mb-2">File select karo aur upload karo</p>
                  <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    bulkFile
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50'
                  }`}>
                    {bulkFile ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                          <FileText size={16} className="text-green-600" />
                        </div>
                        <p className="text-sm font-bold text-green-700 px-4 text-center truncate max-w-full">{bulkFile.name}</p>
                        <p className="text-[11px] text-green-500 mt-0.5">File ready hai ✓</p>
                      </>
                    ) : (
                      <>
                        <Upload size={22} className="text-gray-300 mb-1" />
                        <p className="text-sm font-bold text-gray-400">Click karo ya drag karo</p>
                        <p className="text-[11px] text-gray-300 mt-0.5">.xlsx · .xls · .csv</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={e => setBulkFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => { setIsBulkModalOpen(false); setBulkFile(null); }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!bulkFile || isBulkUploading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-green-600 text-white hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-green-200"
                >
                  {isBulkUploading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                    : <><Upload size={14} /> Upload Karo</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Lead Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl shadow-2xl bg-white transform animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-black text-xl text-gray-900">Assign Lead</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Assigning {assignSelectedLead?.name}</p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><X size={22}/></button>
            </div>
            <form onSubmit={handleAssignLead} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Assign To</label>
                <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 focus:outline-none bg-gray-50/50 text-gray-900 font-medium" autoFocus>
                  <option value="">Select an assignee...</option>
                  {salesUsers.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.role || 'staff'})</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-2">Select the team member to handle this lead.</p>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={isAssigning || !assignUserId.trim()} type="submit" className="px-6 py-3 rounded-xl font-bold bg-cyan-600 text-white shadow-md shadow-cyan-200 hover:shadow-lg hover:bg-cyan-700 hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[140px] disabled:opacity-70 disabled:cursor-not-allowed">
                  {isAssigning ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Assigning...</>
                  ) : (
                    'Assign Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
