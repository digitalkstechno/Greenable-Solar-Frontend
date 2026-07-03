// components/leads/useLeadsData.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiSource, ApiStatus, ApiUser, LeadLabel, LeadCountSummary } from './types';

type Filters = {
  search?: string;
  status?: string;
  source?: string;
  staff?: string;
  from?: string;
  to?: string;
};

export function useLeadsData(
  activeTab: 'all' | 'my' = 'all',
  filters: Filters = {},
  viewMode: 'list' | 'kanban' = 'list',
  kanbanSubView: 'board' | 'lost' | 'won' = 'board'
) {
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [leadsList, setLeadsList] = useState<ApiLead[]>([]);
  const [lostLeads, setLostLeads] = useState<ApiLead[]>([]);
  const [wonLeads, setWonLeads] = useState<ApiLead[]>([]);

  const [sources, setSources] = useState<ApiSource[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [staffMembers, setStaffMembers] = useState<ApiUser[]>([]);
  const [leadLabels, setLeadLabels] = useState<LeadLabel[]>([]);
  const [counts, setCounts] = useState<LeadCountSummary | null>(null);
  const [totals, setTotals] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    create: false, update: false, delete: false, readAll: false, readOwn: false,
  });

  // List pagination
  const [listPage, setListPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [listTotalItems, setListTotalItems] = useState(0);

  // Lost pagination
  const [lostPage, setLostPage] = useState(1);
  const [lostTotalPages, setLostTotalPages] = useState(1);
  const [lostTotalItems, setLostTotalItems] = useState(0);

  // Won pagination
  const [wonPage, setWonPage] = useState(1);
  const [wonTotalPages, setWonTotalPages] = useState(1);
  const [wonTotalItems, setWonTotalItems] = useState(0);

  const [limit, setLimit] = useState(10);

  const getHeaders = () => ({ Authorization: `Bearer ${getAuthToken()}` });

  // Keep latest values in a ref so callbacks always read fresh values
  const stateRef = useRef({
    activeTab, filters, viewMode, kanbanSubView,
    listPage, lostPage, wonPage, limit,
  });
  useEffect(() => {
    stateRef.current = {
      activeTab, filters, viewMode, kanbanSubView,
      listPage, lostPage, wonPage, limit,
    };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH FUNCTIONS — accept explicit params so they never use stale closures
  // ─────────────────────────────────────────────────────────────────────────

  const fetchKanbanLeads = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters
  ) => {
    try {
      const useKanbanEndpoint = !!baseUrl.getKanbanData;

      if (useKanbanEndpoint) {
        const res = await axios.get(baseUrl.getKanbanData, {
          headers: getHeaders(),
          params: {
            my: tab === 'my' || undefined,
            search: f.search || undefined,
            status: f.status || undefined,
            source: f.source || undefined,
            staff: f.staff || undefined,
            from: f.from || undefined,
            to: f.to || undefined,
          },
        });

        const data = res.data?.data;
        if (res.data?.totals) {
          setTotals(res.data.totals);
        }

        if (Array.isArray(data)) {
          // Shape A: grouped → [{ leads: [...] }, ...]
          // Shape B: flat array of leads
          const isGrouped = data.length > 0 && Array.isArray((data[0] as any)?.leads);
          setLeads(isGrouped ? (data as any[]).flatMap((g: any) => g.leads || []) : (data as ApiLead[]));
        } else {
          setLeads([]);
        }
      } else {
        // Fallback: no dedicated kanban endpoint
        const url = tab === 'my' ? baseUrl.myLeads : baseUrl.getAllLeads;
        const res = await axios.get(url, {
          headers: getHeaders(),
          params: {
            search: f.search || undefined,
            status: f.status || undefined,
            source: f.source || undefined,
            staff: f.staff || undefined,
            from: f.from || undefined,
            to: f.to || undefined,
            limit: 100,
          },
        });
        if (res.data?.totals) {
          setTotals(res.data.totals);
        }
        setLeads(res.data?.data || []);
      }
    } catch (e) {
      console.error('fetchKanbanLeads error:', e);
      setLeads([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeadsList = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters,
    page = stateRef.current.listPage,
    lim = stateRef.current.limit
  ) => {
    try {
      const url = tab === 'my' ? baseUrl.myLeads : baseUrl.getAllLeads;
      const res = await axios.get(url, {
        headers: getHeaders(),
        params: {
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
          page,
          limit: lim,
        },
      });
      const arr = res.data?.data || [];
      const p = res.data?.pagination || {};
      if (res.data?.totals) {
        setTotals(res.data.totals);
      }
      setLeadsList(arr);
      setListTotalItems(p.totalRecords ?? p.total ?? p.count ?? arr.length);
      setListTotalPages(p.totalPages ?? (p.totalRecords ? Math.ceil(p.totalRecords / lim) : 1));
    } catch (e) {
      console.error('fetchLeadsList error:', e);
      setLeadsList([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLostLeads = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters,
    page = stateRef.current.lostPage,
    lim = stateRef.current.limit
  ) => {
    try {
      const res = await axios.get(baseUrl.getLostLeads, {
        headers: getHeaders(),
        params: {
          my: tab === 'my' || undefined,
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
          page,
          limit: lim,
        },
      });
      const raw = res.data?.data;
      const arr: ApiLead[] = Array.isArray(raw) ? raw : (raw?.data || []);
      const p = res.data?.pagination || {};
      setLostLeads(arr);
      setLostTotalItems(p.totalRecords ?? p.total ?? p.count ?? arr.length);
      setLostTotalPages(p.totalPages ?? (p.totalRecords ? Math.ceil(p.totalRecords / lim) : 1));
    } catch (e) {
      console.error('fetchLostLeads error:', e);
      setLostLeads([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWonLeads = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters,
    page = stateRef.current.wonPage,
    lim = stateRef.current.limit
  ) => {
    try {
      const res = await axios.get(baseUrl.getWonLeads, {
        headers: getHeaders(),
        params: {
          my: tab === 'my' || undefined,
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
          page,
          limit: lim,
        },
      });
      const raw = res.data?.data;
      const arr: ApiLead[] = Array.isArray(raw) ? raw : (raw?.data || []);
      const p = res.data?.pagination || {};
      if (res.data?.totals) {
        setTotals(res.data.totals);
      }
      setWonLeads(arr);
      setWonTotalItems(p.totalRecords ?? p.total ?? p.count ?? arr.length);
      setWonTotalPages(p.totalPages ?? (p.totalRecords ? Math.ceil(p.totalRecords / lim) : 1));
    } catch (e) {
      console.error('fetchWonLeads error:', e);
      setWonLeads([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCounts = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters
  ) => {
    try {
      const url = tab === 'my' ? baseUrl.myLeadCountSummary : baseUrl.leadCountSummary;
      const res = await axios.get(url, {
        headers: getHeaders(),
        params: {
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
        },
      });
      setCounts(res.data?.data || null);
    } catch (e) {
      console.error('fetchCounts error:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMeta = useCallback(async () => {
    try {
      const [stRes, staffRes, meRes, sourcesRes] = await Promise.allSettled([
        axios.get(baseUrl.leadStatuses, { headers: getHeaders() }),
        axios.get(baseUrl.getAllUsers, { headers: getHeaders(), params: { limit: 1000 } }),
        axios.get(baseUrl.currentStaff, { headers: getHeaders() }),
        axios.get(baseUrl.leadSources, { headers: getHeaders() })
      ]);
      if (stRes.status === 'fulfilled') setStatuses(stRes.value.data?.data ?? []);
      if (staffRes.status === 'fulfilled') setStaffMembers(staffRes.value.data?.data ?? []);
      if (sourcesRes.status === 'fulfilled') setSources(sourcesRes.value.data?.data ?? []);
      if (meRes.status === 'fulfilled') {
        const role = meRes.value.data?.data?.role || {};
        setCurrentUser(meRes.value.data?.data || null);
        const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
        const lp = rawPerms.lead || {};
        setPermissions({
          create: !!lp.create, update: !!lp.update, delete: !!lp.delete,
          readAll: !!lp.readAll, readOwn: !!lp.readOwn,
        });
      }
    } catch (e) {
      console.error('fetchMeta error:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // refetchAll — always reads latest values from ref, no stale closures
  // ─────────────────────────────────────────────────────────────────────────
  const refetchAll = useCallback(async () => {
    const { activeTab: tab, filters: f, viewMode: vm, kanbanSubView: ksv,
            listPage: lp, lostPage: lsp, wonPage: wp, limit: lim } = stateRef.current;

    if (vm === 'list') {
      await Promise.all([fetchLeadsList(tab, f, lp, lim), fetchCounts(tab, f)]);
    } else {
      const calls: Promise<void>[] = [
        fetchKanbanLeads(tab, f),
        fetchCounts(tab, f),
        fetchLostLeads(tab, f, lsp, lim),
        fetchWonLeads(tab, f, wp, lim)
      ];
      await Promise.all(calls);
    }
  }, [fetchLeadsList, fetchKanbanLeads, fetchLostLeads, fetchWonLeads, fetchCounts]);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Meta — once
  useEffect(() => { fetchMeta(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Initial data load
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      if (viewMode === 'list') {
        await Promise.all([
          fetchLeadsList(activeTab, filters, 1, limit), 
          fetchCounts(activeTab, filters)
        ]);
      } else {
        const calls: Promise<void>[] = [
          fetchCounts(activeTab, filters),
          fetchLostLeads(activeTab, filters, 1, limit),
          fetchWonLeads(activeTab, filters, 1, limit)
        ];
        await Promise.all(calls);
      }
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Re-fetch when viewMode / activeTab / filters / limit change
  const prevKey = useRef('');
  useEffect(() => {
    const key = JSON.stringify({ viewMode, activeTab, filters, limit });
    if (key === prevKey.current) return;
    prevKey.current = key;

    setListPage(1);
    setLostPage(1);
    setWonPage(1);

    if (viewMode === 'list') {
      fetchLeadsList(activeTab, filters, 1, limit);
      fetchCounts(activeTab, filters);
    } else {
      fetchCounts(activeTab, filters);
      fetchLostLeads(activeTab, filters, 1, limit);
      fetchWonLeads(activeTab, filters, 1, limit);
    }
  }, [viewMode, activeTab, filters, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4. Kanban sub-view changed
  const prevSubView = useRef(kanbanSubView);
  useEffect(() => {
    if (prevSubView.current === kanbanSubView) return;
    prevSubView.current = kanbanSubView;
    if (viewMode !== 'kanban') return;
    // if (kanbanSubView === 'board') fetchKanbanLeads(activeTab, filters); // Handled by component
    if (kanbanSubView === 'lost') fetchLostLeads(activeTab, filters, lostPage, limit);
    if (kanbanSubView === 'won') fetchWonLeads(activeTab, filters, wonPage, limit);
  }, [kanbanSubView, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. List page change
  const prevListPage = useRef(listPage);
  useEffect(() => {
    if (prevListPage.current === listPage) return;
    prevListPage.current = listPage;
    if (viewMode === 'list') fetchLeadsList(activeTab, filters, listPage, limit);
  }, [listPage, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // 6. Lost page change
  const prevLostPage = useRef(lostPage);
  useEffect(() => {
    if (prevLostPage.current === lostPage) return;
    prevLostPage.current = lostPage;
    if (viewMode === 'kanban' && kanbanSubView === 'lost') fetchLostLeads(activeTab, filters, lostPage, limit);
  }, [lostPage, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // 7. Won page change
  const prevWonPage = useRef(wonPage);
  useEffect(() => {
    if (prevWonPage.current === wonPage) return;
    prevWonPage.current = wonPage;
    if (viewMode === 'kanban' && kanbanSubView === 'won') fetchWonLeads(activeTab, filters, wonPage, limit);
  }, [wonPage, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────

  const findLeadById = useCallback(
    (id: string) =>
      leads.find(l => l._id === id) ||
      leadsList.find(l => l._id === id) ||
      lostLeads.find(l => l._id === id) ||
      wonLeads.find(l => l._id === id),
    [leads, leadsList, lostLeads, wonLeads]
  );

  return {
    leads, setLeads,
    leadsList, setLeadsList,
    lostLeads, wonLeads,
    sources, statuses, staffMembers, leadLabels,
    counts, loading, permissions,
    totals, currentUser,
    refetchAll,
    fetchLeadsList,
    fetchKanbanLeads,
    fetchLostLeads,
    fetchWonLeads,
    findLeadById,

    listPagination: {
      currentPage: listPage,
      rowsPerPage: limit,
      totalPages: listTotalPages,
      totalItems: listTotalItems,
      handlePageChange: (p: number) => setListPage(p),
      handleRowsPerPageChange: (l: number) => { setLimit(l); setListPage(1); },
    },
    lostPagination: {
      currentPage: lostPage,
      rowsPerPage: limit,
      totalPages: lostTotalPages,
      totalItems: lostTotalItems,
      handlePageChange: (p: number) => setLostPage(p),
      handleRowsPerPageChange: (l: number) => { setLimit(l); setLostPage(1); },
    },
    wonPagination: {
      currentPage: wonPage,
      rowsPerPage: limit,
      totalPages: wonTotalPages,
      totalItems: wonTotalItems,
      handlePageChange: (p: number) => setWonPage(p),
      handleRowsPerPageChange: (l: number) => { setLimit(l); setWonPage(1); },
    },
    pagination: {
      currentPage: listPage,
      rowsPerPage: limit,
      totalPages: listTotalPages,
      totalItems: listTotalItems,
      handlePageChange: (p: number) => setListPage(p),
      handleRowsPerPageChange: (l: number) => { setLimit(l); setListPage(1); },
    },
  };
}