// pages/leads/[view].tsx
// Unified Leads Page - handles both 'list' and 'kanban' views
// View is persisted in localStorage AND reflected in the URL

import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ListCollapse, Plus, Filter, Kanban, Search, Download, Upload, X } from 'lucide-react';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';

// ── Sub-components ──────────────────────────────────────────────────────────
import LeadsListView from '@/components/leads/LeadsListView';
import LeadsKanbanView from '@/components/leads/LeadsKanbanView';
import LeadAddDialog from '@/components/leads/LeadAddDialog';
import LeadViewDialog from '@/components/leads/LeadViewDialog';
import LeadBulkImportDialog from '@/components/leads/LeadBulkImportDialog';
import { PageSkeleton, KanbanColumnSkeleton } from '@/components/ui/Skeleton';
import Calendar from '@/components/ui/Calendar';


// ── Types ────────────────────────────────────────────────────────────────────
import {
  ApiLead,
} from '@/components/leads/types';

// ── Hooks / Config ───────────────────────────────────────────────────────────
import { useLeadsData } from '@/components/leads/useLeadsData';
import FormInput from '@/components/ui/Input';
import { FormMultiSelect } from '@/components/ui/FormSelect';

export type ViewMode = 'list' | 'kanban';
export type KanbanSubView = 'board' | 'lost' | 'won';

// ── Utils ──────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function LeadsPage({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const router = useRouter();
  const { view: viewParam } = router.query;

  // ── Active view (list | kanban) ──────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // ── Kanban sub-view — lifted here so hook knows which data to fetch ───────
  const [kanbanSubView, setKanbanSubView] = useState<KanbanSubView>('board');

  // ── Search & Filters ─────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [staffFilter, setStaffFilter] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // ── Dialogs ──────────────────────────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);
  const [viewingLead, setViewingLead] = useState<ApiLead | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);

  const [editNextDate, setEditNextDate] = useState('');

  // ── Permissions ──────────────────────────────────────────────────────────
  const [leadPermissions, setLeadPermissions] = useState<{
    create?: boolean;
    readAll?: boolean;
    readOwn?: boolean;
    update?: boolean;
    delete?: boolean;
    assign?: boolean;
    transfer?: boolean;
    convert?: boolean;
  } | null>(null);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  // ── Fetch permissions ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const fetchPermissions = async () => {
      try {
        const res = await axios.get(baseUrl.currentStaff, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions)
          ? role.permissions[0]
          : role.permissions || {};

        const lp = rawPerms.lead || {};
        setLeadPermissions(lp);
        if (!lp.readAll && lp.readOwn) setActiveTab('my');
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setLeadPermissions(null);
      }
    };

    fetchPermissions();
  }, [token]);

  // ── Parse query params ───────────────────────────────────────────────────
  useEffect(() => {
    if (router.isReady) {
      const statusParam = router.query.status;
      if (statusParam) {
        const statuses = Array.isArray(statusParam)
          ? statusParam
          : typeof statusParam === 'string'
            ? statusParam.split(',')
            : [];
        setStatusFilter(statuses);
      }
    }
  }, [router.isReady, router.query.status]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: (viewMode === 'kanban' || statusFilter.length === 0) ? '' : statusFilter.join(','),
      source: sourceFilter.length > 0 ? sourceFilter.join(',') : '',
      staff: staffFilter.length > 0 ? staffFilter.join(',') : '',
      from: fromDate,
      to: toDate,
    }),
    [debouncedSearch, statusFilter, sourceFilter, staffFilter, fromDate, toDate, viewMode]
  );

  // ── Data — pass kanbanSubView so hook fetches only what's needed ──────────
  const {
    leads,
    leadsList,
    lostLeads,
    wonLeads,
    sources,
    statuses,
    staffMembers,
    counts,
    loading,
    totals,
    currentUser,
    refetchAll,
    fetchLeadsList,
    fetchLostLeads,
    fetchWonLeads,
    findLeadById,
    listPagination,
    lostPagination,
    wonPagination,
  } = useLeadsData(activeTab, filters, viewMode, kanbanSubView);

  // ── Local search for Lost / Won sub-views ─────────────────────────────────
  const [lostSearch, setLostSearch] = useState('');
  const [wonSearch, setWonSearch] = useState('');

  const handleLostSearch = useCallback((value: string) => {
    setLostSearch(value);
    fetchLostLeads(activeTab, { ...filters, search: value }, 1);
  }, [activeTab, filters, fetchLostLeads]);

  const handleWonSearch = useCallback((value: string) => {
    setWonSearch(value);
    fetchWonLeads(activeTab, { ...filters, search: value }, 1);
  }, [activeTab, filters, fetchWonLeads]);

  // ── Sync URL → state ─────────────────────────────────────────────────────
  useEffect(() => {
    if (viewParam === 'kanban' || viewParam === 'list') {
      setViewMode(viewParam as ViewMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadsView', viewParam);
      }
    }
  }, [viewParam]);

  const switchView = (mode: ViewMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadsView', mode);
    }
    router.push(`/leads/${mode}`, undefined, { shallow: true });
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingLead(null);
    setShowAddDialog(true);
  };

  const handleEdit = (lead: ApiLead) => {
    if (!leadPermissions?.update) return;
    setEditingLead(lead);
    setShowAddDialog(true);
  };

  const handleView = (lead: ApiLead) => {
    if (!canRead) return;
    setViewingLead(lead);
  };

  // Sync viewingLead if the underlying list/kanban data updates
  useEffect(() => {
    if (viewingLead) {
      const updated = findLeadById(viewingLead._id);
      if (updated) {
        setViewingLead(updated);
      }
    }
  }, [leads, leadsList, lostLeads, wonLeads, findLeadById]);

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingLead(null);
  };

  // ── Excel Export ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const token = getAuthToken();
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      if (filters.staff) params.staff = filters.staff;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (activeTab === 'my') params.my = 'true';

      const res = await axios.get(baseUrl.exportLeads, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── Permission flags ──────────────────────────────────────────────────────
  const canCreate = !!leadPermissions?.create;
  const canRead = !!(leadPermissions?.readAll || leadPermissions?.readOwn);
  const canReadAll = !!leadPermissions?.readAll;
  const canReadOwn = !!leadPermissions?.readOwn;
  const canUpdate = !!leadPermissions?.update;
  const canDelete = !!leadPermissions?.delete;
  const canAssign = !!leadPermissions?.assign;
  const canTransfer = !!leadPermissions?.transfer;
  const canConvert = !!leadPermissions?.convert;

  const clearFilters = () => {
    setStatusFilter([]);
    setSourceFilter([]);
    setStaffFilter([]);
    setFromDate('');
    setToDate('');
    setSearch('');
  };

  const hasActiveFilters = !!(
    statusFilter.length > 0 ||
    sourceFilter.length > 0 ||
    staffFilter.length > 0 ||
    fromDate ||
    toDate
  );

  // ── Access denied ─────────────────────────────────────────────────────────
  if (!canRead && !loading && leadPermissions !== null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-md bg-red-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-red-800">Access Denied</h2>
          <p className="mt-2 text-red-600">You don't have permission to view leads.</p>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 relative overflow-hidden">
        <div className="rounded-md border border-gray-200 bg-white px-6 py-4 transition-all duration-300">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {viewMode === 'list' ? (
            <div className="bg-white rounded-md border border-gray-200 p-4">
              <PageSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <KanbanColumnSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const newLeadStatus = statuses.find(s => s.name.match(/^new lead$/i));
  const wonStatus = statuses.find(s => s.name.match(/^won$/i));
  const lostStatus = statuses.find(s => s.name.match(/^lost$/i));

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col gap-4 relative">

      {/* ── Page Header & Unified Toolbar ───────────────────────────────── */}
      <div className="rounded-md border border-gray-200 bg-white px-4 md:px-6 py-4 transition-all duration-300">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between w-full">
          {/* Left side: Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
            {viewMode === 'kanban' && (
              <div className="flex items-center gap-2">
                {(['board', 'lost', 'won'] as KanbanSubView[]).map((v) => {
                  const lostCount = lostPagination?.totalItems ?? lostLeads.length;
                  const wonCount = wonPagination?.totalItems ?? wonLeads.length;
                  const label = v === 'board' ? 'New Lead' : v === 'lost' ? 'Lost' : 'Won';
                  const count = v === 'lost' ? lostCount : v === 'won' ? wonCount : null;
                  const activeClasses =
                    v === 'lost'
                      ? 'border border-red-500 text-red-600 bg-white'
                      : v === 'won'
                        ? 'border border-green-500 text-green-600 bg-white'
                        : 'border border-[#F28522] text-[#F28522] bg-white';

                  return (
                    <button
                      key={v}
                      onClick={() => setKanbanSubView(v)}
                      className={`flex items-center gap-2 rounded-lg cursor-pointer px-4 py-1.5 text-sm font-medium capitalize transition-colors ${kanbanSubView === v ? activeClasses : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'}`}
                    >
                      {label}
                      {count !== null && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${kanbanSubView === v ? (v === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : (v === 'won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* Right side: Actions */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 xl:ml-auto w-full xl:w-auto justify-end">

            {/* Search Bar */}
            <div className="relative w-full sm:w-80 mr-auto xl:mr-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm h-11"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Advanced Filter Button */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all cursor-pointer ${showFilterDrawer || hasActiveFilters
                ? 'bg-primary-100 text-primary-600 border border-primary-300 hover:bg-primary-100'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* Excel Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              title="Export to Excel"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs md:text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{exporting ? '...' : 'Export'}</span>
            </button>

            {/* Bulk Import Button */}
            {canCreate && (
              <button
                onClick={() => setShowBulkImport(true)}
                title="Bulk Import Leads"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs md:text-sm font-medium bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}

            {/* Desktop View toggle */}
            <div className="hidden md:flex relative items-center bg-gray-100 p-1 rounded-md w-fit">
              <button
                onClick={() => switchView('list')}
                className={`relative z-10 cursor-pointer flex items-center justify-center w-10 h-10 rounded-md transition-colors ${viewMode === 'list' ? 'bg-secondary text-white shadow-sm' : 'text-gray-700'}`}
                title="List View"
              >
                <ListCollapse className="h-5 w-5" />
              </button>
              <button
                onClick={() => switchView('kanban')}
                className={`relative z-10 cursor-pointer flex items-center justify-center w-10 h-10 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-secondary text-white shadow-sm' : 'text-gray-700'}`}
                title="Kanban View"
              >
                <Kanban className="h-5 w-5" />
              </button>
            </div>

            {/* Add Lead button */}
            {canCreate && (
              <button
                onClick={handleOpenAdd}
                className="flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-md active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Section (Inline Expandable) ────────────────────────────── */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${showFilterDrawer
            ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-gray-100'
            : 'grid-rows-[0fr] opacity-0 overflow-hidden'
            }`}
        >
          <div className={`min-h-0 ${showFilterDrawer ? 'overflow-visible' : 'overflow-hidden'}`}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${viewMode === 'kanban' ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-4`}>
              {viewMode !== 'kanban' && (
                <div className="space-y-2">
                  <FormMultiSelect
                    name="leadStatus"
                    label="Lead Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e)}
                    options={statuses.map((s) => ({ value: s._id, label: s.name }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <FormMultiSelect
                  name="leadSource"
                  label="Lead Source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e)}
                  options={sources.map((s) => ({ value: s.name, label: s.name }))}
                />
              </div>

              <div className="space-y-2">
                <FormMultiSelect
                  name="assignedStaff"
                  label="Assigned Staff"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e)}
                  options={staffMembers.map((s) => ({ value: s._id, label: s.fullName }))}
                />
              </div>

              <div className="space-y-2 ">
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">From Date</label>
                <Calendar
                  value={fromDate ? new Date(fromDate + 'T00:00:00') : null}
                  onChange={(date) => {
                    if (!date) { setFromDate(''); return; }
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    setFromDate(`${y}-${m}-${d}`);
                  }}
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  placeholder="dd-mm-yyyy"
                  className="min-h-11.5"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">To Date</label>
                <Calendar
                  value={toDate ? new Date(toDate + 'T00:00:00') : null}
                  onChange={(date) => {
                    if (!date) { setToDate(''); return; }
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    setToDate(`${y}-${m}-${d}`);
                  }}
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  placeholder="dd-mm-yyyy"
                  className="min-h-11.5"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { clearFilters(); setShowFilterDrawer(false); }}
                className="px-4 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="px-4 py-1.5 text-xs font-bold text-secondary bg-blue-50 hover:bg-blue-100 rounded-md transition-all cursor-pointer"
              >
                Collapse
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1">
        {viewMode === 'list' ? (
          <LeadsListView
            statuses={statuses}
            sources={sources}
            staffMembers={staffMembers}
            onEdit={canUpdate ? handleEdit : undefined}
            onView={handleView}
            onRefresh={refetchAll}
            scope={activeTab}
            filters={filters}
            externalLeads={leadsList}
            fetchLeadsList={fetchLeadsList}
            loading={loading}
            totals={totals}
            currentUser={currentUser}
            permissions={{
              create: canCreate,
              readAll: canReadAll,
              readOwn: canReadOwn,
              update: canUpdate,
              delete: canDelete,
              assign: canAssign,
              transfer: canTransfer,
              convert: canConvert,
            }}
            pagination={listPagination}
            searchValue={search}
            onSearch={setSearch}
            newLeadCount={counts?.statusWiseCounts?.find((s: any) => s.statusId === newLeadStatus?._id)?.count || 0}
            wonCount={counts?.statusWiseCounts?.find((s: any) => s.statusId === wonStatus?._id)?.count || 0}
            lostCount={counts?.statusWiseCounts?.find((s: any) => s.statusId === lostStatus?._id)?.count || 0}
            onStatusFilter={(status) => {
              const found = statuses.find(s => s.name.toLowerCase() === status);
              if (found && statusFilter.length === 1 && statusFilter[0] === found._id) {
                setStatusFilter([]);
              } else if (found) {
                setStatusFilter([found._id]);
              } else {
                setStatusFilter([]);
              }
            }}
            activeStatusFilter={
              statusFilter.length === 1
                ? statuses.find(s => s._id === statusFilter[0])?.name.toLowerCase()
                : ''
            }
          />
        ) : (
          <LeadsKanbanView
            isSidebarOpen={isSidebarOpen}
            leads={leads}
            lostLeads={lostLeads}
            wonLeads={wonLeads}
            statuses={statuses}
            counts={counts?.statusCounts}
            totals={totals}
            currentUser={currentUser}
            onEdit={canUpdate ? handleEdit : undefined}
            onView={handleView}
            onRefresh={refetchAll}
            scope={activeTab}
            filters={filters}
            searchValue={search}
            onSearch={setSearch}
            // Pass separate paginations for lost/won
            lostPagination={lostPagination}
            wonPagination={wonPagination}
            subView={kanbanSubView}
            // Notify parent when sub-view changes so hook fetches correct data
            onSubViewChange={setKanbanSubView}
            onLostSearch={handleLostSearch}
            onWonSearch={handleWonSearch}
            refreshKey={boardRefreshKey}
            permissions={{
              create: canCreate,
              readAll: canReadAll,
              readOwn: canReadOwn,
              update: canUpdate,
              delete: canDelete,
              assign: canAssign,
              transfer: canTransfer,
              convert: canConvert,
            }}
          />
        )}
      </div>

      {/* ── Add / Edit Dialog ────────────────────────────────────────────── */}
      <LeadAddDialog
        isOpen={showAddDialog}
        onClose={handleDialogClose}
        mode={editingLead ? 'edit' : 'add'}
        initialData={editingLead}
        currentUser={currentUser}
        onLeadCreated={() => {
          refetchAll();
          setBoardRefreshKey((k) => k + 1);
          handleDialogClose();
        }}
        onLeadUpdated={() => {
          refetchAll();
          setBoardRefreshKey((k) => k + 1);
          handleDialogClose();
        }}
      />

      {/* ── View Dialog ──────────────────────────────────────────────────── */}
      <LeadViewDialog
        lead={viewingLead}
        statuses={statuses}
        currentUser={currentUser}
        onClose={() => setViewingLead(null)}
        onRefresh={() => {
          refetchAll();
          setBoardRefreshKey((k) => k + 1);
        }}
      />

      {/* ── Bulk Import Dialog ─────────────────────────────────────────── */}
      <LeadBulkImportDialog
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImported={() => {
          refetchAll();
          setShowBulkImport(false);
        }}
      />
    </div>
  );
}