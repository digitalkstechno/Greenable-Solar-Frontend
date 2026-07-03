// components/leads/LeadsKanbanView.tsx
// Kanban board with Board / Lost / Won sub-views + drag-and-drop

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FiSearch, FiPhone, FiMail, FiX } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead } from './types';
import { RefreshCw, Plus, FileText } from 'lucide-react';
import DataTable, { Column } from '@/components/DataTable';
import KanbanCard from './KanbanCard';
import Swal from 'sweetalert2';

import ProjectDetailDrawer from './ProjectDetailDrawer';
import PaymentModal from './PaymentModal';
import LeadDocumentsDialog from './LeadDocumentsDialog';
import Calendar from '@/components/ui/Calendar';
import Dialog from '@/components/Dialog';

type PaginationShape = {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
    totalItems: number;
    handlePageChange: (page: number) => void;
    handleRowsPerPageChange: (rows: number) => void;
};

interface Props {
    isSidebarOpen: boolean;
    leads: ApiLead[];
    lostLeads: ApiLead[];
    wonLeads: ApiLead[];
    statuses: any[];
    onEdit?: (lead: ApiLead) => void;
    onView?: (lead: ApiLead) => void;
    onRefresh: () => void;
    counts?: Record<string, number>;
    permissions?: {
        create: boolean;
        update: boolean;
        delete: boolean;
        readAll?: boolean;
        readOwn?: boolean;
        assign?: boolean;
        transfer?: boolean;
        convert?: boolean;
    };
    scope?: 'all' | 'my';
    filters: {
        search?: string;
        status?: string;
        source?: string;
        staff?: string;
        date?: string;
    };
    lostPagination?: PaginationShape;
    wonPagination?: PaginationShape;
    onSubViewChange?: (subView: 'board' | 'lost' | 'won') => void;
    onLostSearch?: (search: string) => void;
    onWonSearch?: (search: string) => void;
    refreshKey?: number;
    currentUser?: any;
    totals?: any;
    searchValue?: string;
    onSearch?: (value: string) => void;
    subView?: SubView;
}

type SubView = 'board' | 'lost' | 'won';

export default function LeadsKanbanView({
    isSidebarOpen,
    lostLeads, wonLeads,
    statuses,
    onEdit, onView, onRefresh, counts, permissions, scope = 'all',
    filters,
    lostPagination,
    wonPagination,
    onSubViewChange,
    onLostSearch,
    onWonSearch,
    refreshKey = 0,
    currentUser,
    totals,
    searchValue,
    onSearch,
    subView = 'board',
}: Props) {

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [projectDetailLead, setProjectDetailLead] = useState<ApiLead | null>(null);
    const [paymentLead, setPaymentLead] = useState<ApiLead | null>(null);
    const [documentsLead, setDocumentsLead] = useState<ApiLead | null>(null);

    // Board state
    const [boardLeads, setBoardLeads] = useState<Record<string, ApiLead[]>>({});
    const [columnLoading, setColumnLoading] = useState<Record<string, boolean>>({});
    const [pageMap, setPageMap] = useState<Record<string, number>>({});
    const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
    const [loadingMoreMap, setLoadingMoreMap] = useState<Record<string, boolean>>({});
    const [columnCounts, setColumnCounts] = useState<Record<string, number>>({});

    const [lostModalLeadId, setLostModalLeadId] = useState<string | null>(null);
    const [lostReason, setLostReason] = useState('');
    const [lostDate, setLostDate] = useState<string>('');
    const [markingLost, setMarkingLost] = useState(false);

    const [kanbanVisibleStatusNames, setKanbanVisibleStatusNames] = useState<string[] | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('kanbanVisibleStatusNames');
            if (raw !== null) {
                // Key exists in storage — use whatever was saved (even empty [])
                const parsed = JSON.parse(raw);
                setKanbanVisibleStatusNames(Array.isArray(parsed) ? parsed : null);
            } else {
                // Key not set yet → show all columns
                setKanbanVisibleStatusNames(null);
            }
        } catch {
            setKanbanVisibleStatusNames(null);
        }
    }, []);

    const token = () => getAuthToken();

    // Notify parent when sub-view changes
    const handleSubViewChange = (v: SubView) => {
        setSubView(v);
        onSubViewChange?.(v);
    };

    // Fetch leads for a specific status
    const fetchStatusLeads = useCallback(
        async (statusId: string, page = 1, isLoadMore = false, isSilent = false) => {
            if (isLoadMore) {
                setLoadingMoreMap((p) => ({ ...p, [statusId]: true }));
            } else if (!isSilent) {
                setColumnLoading((p) => ({ ...p, [statusId]: true }));
            }

            try {
                const res = await axios.get(baseUrl.getKanbanStatusLeads, {
                    headers: { Authorization: `Bearer ${token()}` },
                    params: {
                        statusId,
                        page,
                        limit: 10,
                        my: scope === 'my' || undefined,
                        search: filters.search || undefined,
                        source: filters.source || undefined,
                        staff: filters.staff || undefined,
                        date: filters.date || undefined,
                    },
                });

                const newData: ApiLead[] = res.data?.data || [];
                const pagination = res.data?.pagination || {};

                setBoardLeads((prev) => ({
                    ...prev,
                    [statusId]: isLoadMore ? [...(prev[statusId] || []), ...newData] : newData,
                }));

                const totalRecords = pagination.totalRecords ?? pagination.total ?? pagination.count ?? (isLoadMore ? (columnCounts[statusId] || 0) : newData.length);
                setColumnCounts((prev) => ({ ...prev, [statusId]: totalRecords }));

                setPageMap((prev) => ({ ...prev, [statusId]: page }));
                setHasMoreMap((prev) => ({
                    ...prev,
                    [statusId]: page < (pagination.totalPages || 1),
                }));
            } catch (error) {
                console.error(`Failed to fetch leads for status ${statusId}:`, error);
            } finally {
                setColumnLoading((p) => ({ ...p, [statusId]: false }));
                setLoadingMoreMap((p) => ({ ...p, [statusId]: false }));
            }
        },
        [scope, filters]
    );

    // Initial fetch and re-fetch on filter/scope/refreshKey change
    useEffect(() => {
        if (subView !== 'board') return;
        statuses.forEach((s) => {
            const isVisible = kanbanVisibleStatusNames === null || kanbanVisibleStatusNames.includes(s.name);
            if (isVisible) {
                fetchStatusLeads(s._id, 1);
            }
        });
    }, [subView, statuses, kanbanVisibleStatusNames, scope, filters, fetchStatusLeads, refreshKey]);

    const loadMore = useCallback(
        async (statusId: string) => {
            if (loadingMoreMap[statusId] || hasMoreMap[statusId] === false) return;
            const nextPage = (pageMap[statusId] || 1) + 1;
            fetchStatusLeads(statusId, nextPage, true);
        },
        [loadingMoreMap, hasMoreMap, pageMap, fetchStatusLeads]
    );

    const handleDrop = async (newStatusId: string, targetIndex?: number) => {
        if (!draggingId || !permissions?.update) return;

        let sourceStatusId = '';
        const entries = Object.entries(boardLeads);
        for (let i = 0; i < entries.length; i++) {
            const [sId, leadsArr] = entries[i];
            if (leadsArr.some(l => l._id === draggingId)) {
                sourceStatusId = sId;
                break;
            }
        }


        if (!sourceStatusId) {
            setDraggingId(null);
            return;
        }

        const targetStatus = statuses.find((s) => s._id === newStatusId);
        if (!targetStatus) return;

        const currentDropId = draggingId;
        setDraggingId(null);
        setUpdatingId(currentDropId);

        // Optimistic UI update
        setBoardLeads(prev => {
            const next = { ...prev };
            const sourceLeads = [...(next[sourceStatusId] || [])];
            const leadIndex = sourceLeads.findIndex(l => l._id === currentDropId);
            if (leadIndex > -1) {
                const [lead] = sourceLeads.splice(leadIndex, 1);
                next[sourceStatusId] = sourceLeads;

                const targetLeads = sourceStatusId === newStatusId ? sourceLeads : [...(next[newStatusId] || [])];

                if (targetIndex !== undefined && targetIndex >= 0) {
                    targetLeads.splice(targetIndex, 0, lead);
                } else {
                    targetLeads.push(lead); // push to bottom by default if no targetIndex
                }
                next[newStatusId] = targetLeads;
                lead.leadStatus = targetStatus;
            }
            return next;
        });

        try {
            await axios.put(
                `${baseUrl.updateKanbanStatus}/${currentDropId}/kanban-status`,
                { leadStatus: newStatusId, position: targetIndex },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success(sourceStatusId === newStatusId ? 'Lead reordered' : `Lead moved to ${targetStatus.name}`);

            setColumnCounts(prevCounts => {
                const newCounts = { ...prevCounts };
                if (sourceStatusId !== newStatusId) {
                    if (newCounts[sourceStatusId] !== undefined) newCounts[sourceStatusId] -= 1;
                    if (newCounts[newStatusId] !== undefined) newCounts[newStatusId] += 1;
                }
                return newCounts;
            });

            onRefresh();

        } catch {
            toast.error('Failed to update lead status');
            // Re-fetch with loader to show the revert
            fetchStatusLeads(sourceStatusId, 1);
            fetchStatusLeads(newStatusId, 1);
        } finally {
            setUpdatingId(null);
        }
    };

    const statusGroups = statuses
        .map((s) => ({
            id: s._id,
            title: s.name,
            leads: boardLeads[s._id] || [],
            count: columnCounts[s._id] ?? (counts ? counts[s._id] || 0 : 0),
            isLoading: columnLoading[s._id],
            isWon: /^won$/i.test(s.name),
            isLost: /^lost$/i.test(s.name),
        }))
        .filter((group) => {
            if (kanbanVisibleStatusNames === null) return true;
            return kanbanVisibleStatusNames.includes(group.title);
        });

    const removeLeadFromBoard = (id: string) => {
        setBoardLeads(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(statusId => {
                next[statusId] = next[statusId].filter(l => l._id !== id);
            });
            return next;
        });
    };

    // const markLost = async (id: string) => {
    //     const { value: formValues } = await Swal.fire({
    //         title: 'Mark Lead as Lost?',
    //         html: `
    //             <div style="text-align: left; margin-bottom: 10px;">
    //                 <label style="font-weight: bold; font-size: 14px; display: block; margin-bottom: 5px;">
    //                     <span style="color: #F28522; margin-right: 5px;">✖</span> Remove Reason
    //                 </label>
    //                 <input id="swal-input1" class="swal2-input" placeholder="Enter reason for marking lead as lost" style="width: 100%; box-sizing: border-box; height: 40px; margin: 0; font-size: 14px;">
    //             </div>
    //             <div style="text-align: left;">
    //                 <label style="font-weight: bold; font-size: 14px; display: block; margin-bottom: 5px;">
    //                     <span style="color: #F28522; margin-right: 5px;">📅</span> Lost Date
    //                 </label>
    //                 <input id="swal-input2" type="date" class="swal2-input" style="width: 100%; box-sizing: border-box; height: 40px; margin: 0; font-size: 14px;">
    //             </div>
    //         `,
    //         focusConfirm: false,
    //         showCancelButton: true,
    //         confirmButtonText: 'Yes, Confirm',
    //         cancelButtonText: 'Cancel',
    //         confirmButtonColor: '#F28522',
    //         cancelButtonColor: '#6D7A86',
    //         preConfirm: () => {
    //             const reason = (document.getElementById('swal-input1') as HTMLInputElement).value;
    //             const date = (document.getElementById('swal-input2') as HTMLInputElement).value;
    //             if (!reason || !date) {
    //                 Swal.showValidationMessage('Both reason and date are required');
    //                 return false;
    //             }
    //             return { reason, date };
    //         }
    //     });

    //     if (formValues) {
    //         try {
    //             const lostStatusId = statuses.find(s => s.name.match(/^lost$/i))?._id;
    //             await axios.put(`${baseUrl.updateLead}/${id}`,
    //                 { leadStatus: lostStatusId, lostReason: formValues.reason, lostDate: formValues.date },
    //                 { headers: { Authorization: `Bearer ${token()}` } }
    //             );
    //             toast.success('Lead marked as lost');
    //             removeLeadFromBoard(id);
    //             onRefresh();
    //         } catch { toast.error('Failed to update lead'); }
    //     }
    // };

    const markLost = (id: string) => {
        setLostModalLeadId(id);
        setLostReason('');
        setLostDate('');
    };

    // const handleConfirmMarkLost = async () => {
    //     if (!lostModalLeadId) return;
    //     if (!lostReason.trim() || !lostDate) {
    //         toast.error('Both reason and date are required');
    //         return;
    //     }
    //     setMarkingLost(true);
    //     try {
    //         const lostStatusId = statuses.find(s => s.name.match(/^lost$/i))?._id;
    //         await axios.put(`${baseUrl.updateLead}/${lostModalLeadId}`,
    //             { leadStatus: lostStatusId, lostReason, lostDate },
    //             { headers: { Authorization: `Bearer ${token()}` } }
    //         );
    //         toast.success('Lead marked as lost');
    //         removeLeadFromBoard(lostModalLeadId);
    //         onRefresh();
    //         setLostModalLeadId(null);
    //     } catch {
    //         toast.error('Failed to update lead');
    //     } finally {
    //         setMarkingLost(false);
    //     }
    // };

    const handleConfirmMarkLost = async () => {
        if (!lostModalLeadId) return;
        if (!lostReason.trim() || !lostDate) {
            toast.error('Both reason and date are required');
            return;
        }

        const lostStatusId = statuses.find(s => s.name.match(/^lost$/i))?._id;

        // Find source status of the lead on the board
        let sourceStatusId = '';
        const entries = Object.entries(boardLeads);
        for (let i = 0; i < entries.length; i++) {
            const [sId, leadsArr] = entries[i];
            if (leadsArr.some(l => l._id === lostModalLeadId)) {
                sourceStatusId = sId;
                break;
            }
        }

        setMarkingLost(true);
        try {
            // Optimistic UI update on the board
            setBoardLeads(prev => {
                const next = { ...prev };
                if (sourceStatusId) {
                    const sourceLeads = [...(next[sourceStatusId] || [])];
                    const leadIndex = sourceLeads.findIndex(l => l._id === lostModalLeadId);
                    if (leadIndex > -1) {
                        const [lead] = sourceLeads.splice(leadIndex, 1);
                        next[sourceStatusId] = sourceLeads;
                        if (lostStatusId) {
                            const updatedLead = {
                                ...lead,
                                leadStatus: statuses.find(s => s._id === lostStatusId),
                                lostReason,
                                lostDate
                            };
                            next[lostStatusId] = [updatedLead, ...(next[lostStatusId] || [])];
                        }
                    }
                }
                return next;
            });

            // Optimistically update column counts
            setColumnCounts(prev => {
                const next = { ...prev };
                if (sourceStatusId && next[sourceStatusId]) next[sourceStatusId] -= 1;
                if (lostStatusId && next[lostStatusId] !== undefined) next[lostStatusId] += 1;
                return next;
            });

            await axios.put(`${baseUrl.updateLead}/${lostModalLeadId}`,
                { leadStatus: lostStatusId, lostReason, lostDate },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success('Lead marked as lost');

            // Silent background re-fetch to sync
            if (sourceStatusId) fetchStatusLeads(sourceStatusId, 1, false, true);
            if (lostStatusId) fetchStatusLeads(lostStatusId, 1, false, true);

            await onRefresh();
            setLostModalLeadId(null);
        } catch {
            toast.error('Failed to update lead');
            // Re-fetch columns to revert on error
            if (sourceStatusId) fetchStatusLeads(sourceStatusId, 1);
            if (lostStatusId) fetchStatusLeads(lostStatusId, 1);
        } finally {
            setMarkingLost(false);
        }
    };

    const markWon = async (id: string) => {
        const wonStatusId = statuses.find(s => s.name.match(/^won$/i))?._id;

        let sourceStatusId = '';
        const entries = Object.entries(boardLeads);
        for (let i = 0; i < entries.length; i++) {
            const [sId, leadsArr] = entries[i];
            if (leadsArr.some(l => l._id === id)) {
                sourceStatusId = sId;
                break;
            }
        }

        try {
            // Optimistic UI update on the board
            setBoardLeads(prev => {
                const next = { ...prev };
                if (sourceStatusId) {
                    const sourceLeads = [...(next[sourceStatusId] || [])];
                    const leadIndex = sourceLeads.findIndex(l => l._id === id);
                    if (leadIndex > -1) {
                        const [lead] = sourceLeads.splice(leadIndex, 1);
                        next[sourceStatusId] = sourceLeads;
                        if (wonStatusId) {
                            const updatedLead = {
                                ...lead,
                                leadStatus: statuses.find(s => s._id === wonStatusId),
                                isWon: true,
                                wonDate: new Date().toISOString()
                            };
                            next[wonStatusId] = [updatedLead, ...(next[wonStatusId] || [])];
                        }
                    }
                }
                return next;
            });

            // Optimistically update column counts
            setColumnCounts(prev => {
                const next = { ...prev };
                if (sourceStatusId && next[sourceStatusId]) next[sourceStatusId] -= 1;
                if (wonStatusId && next[wonStatusId] !== undefined) next[wonStatusId] += 1;
                return next;
            });

            await axios.put(`${baseUrl.updateLead}/${id}`, { leadStatus: wonStatusId, isWon: true, wonDate: new Date().toISOString() }, { headers: { Authorization: `Bearer ${token()}` } });
            toast.success('Lead marked as won');

            // Silent background re-fetch to sync
            if (sourceStatusId) fetchStatusLeads(sourceStatusId, 1, false, true);
            if (wonStatusId) fetchStatusLeads(wonStatusId, 1, false, true);

            onRefresh();
        } catch {
            toast.error('Failed to update lead');
            // Re-fetch columns to revert on error
            if (sourceStatusId) fetchStatusLeads(sourceStatusId, 1);
            if (wonStatusId) fetchStatusLeads(wonStatusId, 1);
        }
    };

    const reactivate = async (id: string) => {
        const result = await Swal.fire({
            title: 'Reactivate Lead?',
            text: 'This will move the lead back to the first stage',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Reactivate',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#F28522',
            cancelButtonColor: '#6D7A86',
        });

        // if (result.isConfirmed) {
        //     try {
        //         const newLeadStatusId = statuses.find(s => s.name.match(/^new lead$/i))?._id;

        //         // Optimistically remove from won/lost board
        //         removeLeadFromBoard(id);

        //         await axios.put(`${baseUrl.updateLead}/${id}`, { leadStatus: newLeadStatusId }, { headers: { Authorization: `Bearer ${token()}` } });
        //         toast.success('Lead reactivated');

        //         // Board refresh
        //         if (newLeadStatusId) {
        //             fetchStatusLeads(newLeadStatusId, 1, false, true);
        //         }
        //         onRefresh();
        //     } catch {
        //         toast.error('Failed to reactivate lead');
        //         onRefresh();
        //     }
        // }

        if (result.isConfirmed) {
            try {
                const newLeadStatusId = statuses.find(s => s.name.match(/^new lead$/i))?._id;

                // Optimistically remove from won/lost board
                removeLeadFromBoard(id);

                // Optimistically update column counts
                const wonStatusId = statuses.find(s => s.name.match(/^won$/i))?._id;
                const lostStatusId = statuses.find(s => s.name.match(/^lost$/i))?._id;
                setColumnCounts(prev => {
                    const next = { ...prev };
                    if (wonStatusId && next[wonStatusId]) next[wonStatusId] -= 1;
                    if (lostStatusId && next[lostStatusId]) next[lostStatusId] -= 1;
                    if (newLeadStatusId && next[newLeadStatusId] !== undefined) next[newLeadStatusId] += 1;
                    return next;
                });

                await axios.put(`${baseUrl.updateLead}/${id}`, { leadStatus: newLeadStatusId }, { headers: { Authorization: `Bearer ${token()}` } });
                toast.success('Lead reactivated');

                if (newLeadStatusId) {
                    fetchStatusLeads(newLeadStatusId, 1, false, true);
                }
                onRefresh();
            } catch {
                toast.error('Failed to reactivate lead');
                onRefresh();
            }
        }


    };

    const lostLeadsColumns: Column<ApiLead>[] = [
        { key: 'fullName', label: 'LEAD NAME', render: (v) => (<div><div className="font-semibold text-gray-900">{v}</div><span className="text-xs text-red-500">• Lost</span></div>) },
        { key: 'kwRequirement', label: 'KW REQ', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'address', label: 'LOCATION', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'contact', label: 'CONTACT', render: (v) => <div className="space-y-0.5 text-sm text-gray-600"><div className="flex items-center gap-1.5">{v}</div></div> },
        {
  key: 'createdAt',
  label: 'CREATED DATE',
  render: (_, row) =>
    row.createdAt
      ? new Date(row.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })
      : '-',
},
        { key: 'lostDate', label: 'LOST DATE', render: (v) => (v ? new Date(v).toLocaleDateString() : 'N/A') },
        { key: 'createdBy', label: 'CREATED BY', render: (v) => v?.fullName || v?.name || '-' },
        { key: 'assignedTo', label: 'ASSIGNED TO', render: (v) => v?.fullName || v?.name || '-' },
        { key: 'lostReason', label: 'REASON', render: (v) => v || 'Not specified' },
    ];

    const wonLeadsColumns: Column<ApiLead>[] = [
        { key: 'fullName', label: 'LEAD NAME', render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
        { key: 'kwRequirement', label: 'KW REQ', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'address', label: 'LOCATION', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'contact', label: 'CONTACT', render: (v) => <div className="space-y-0.5 text-sm text-gray-600"><div className="flex items-center gap-1.5">{v}</div></div> },
        {
  key: 'createdAt',
  label: 'CREATED DATE',
  render: (_, row) =>
    row.createdAt
      ? new Date(row.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })
      : '-',
}
,
        {
            key: 'wonDate',
            label: 'WON DATE',
            render: (v, row) => {
                let dateStr = v;
                if (!dateStr && row.activities && row.activities.length > 0) {
                    const wonActivity = row.activities.find((a: any) => a.message?.match(/Stage changed to won/i));
                    if (wonActivity && wonActivity.date) {
                        dateStr = wonActivity.date;
                    }
                }
                return dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : 'N/A';
            }
        },
        { key: 'createdBy', label: 'CREATED BY', render: (v) => v?.fullName || v?.name || '-' },
        { key: 'assignedTo', label: 'ASSIGNED TO', render: (v) => v?.fullName || v?.name || '-' },
        {
            key: 'projectAmount',
            label: 'Total Amount',
            render: (_v, row) => {
                let projectAmt = row.projectAmount ?? row.projectDetail?.projectAmount;
                if (!projectAmt && row.quotations && row.quotations.length > 0) {
                    const lastQuotation = row.quotations[row.quotations.length - 1];
                    const firstRow = lastQuotation.rows?.[0];
                    const value = firstRow?.values?.[0];
                    if (value) {
                        projectAmt = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
                    }
                }
                return projectAmt ? `₹${Number(projectAmt).toLocaleString()}` : '-';
            }
        },
        {
            key: 'pendingAmount',
            label: 'Pending Amount',
            render: (_v, row) => {
                let projectAmt = row.projectAmount ?? row.projectDetail?.projectAmount;
                if (!projectAmt && row.quotations && row.quotations.length > 0) {
                    const lastQuotation = row.quotations[row.quotations.length - 1];
                    const firstRow = lastQuotation.rows?.[0];
                    const value = firstRow?.values?.[0];
                    if (value) {
                        projectAmt = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
                    }
                }
                const pendingAmt = row.pendingAmount ?? (projectAmt - (row.paymentAmount || 0));
                return pendingAmt ? <span className="text-red-600 font-semibold">₹{Number(pendingAmt).toLocaleString()}</span> : '-';
            }
        },
        {
            key: 'docs',
            label: 'DOCS',
            render: (_, row) => {
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDocumentsLead(row);
                        }}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
                        title="Documents"
                    >
                        <FileText className="h-5 w-5" />
                    </button>
                );
            }
        }
    ];

        const isSalesExecutive = ['sales executive', 'sales'].includes(currentUser?.role?.name?.toLowerCase()) || ['sales executive', 'sales'].includes(currentUser?.role?.roleName?.toLowerCase());
    const visibleLostLeadsColumns = lostLeadsColumns.filter(c => !(isSalesExecutive && c.key === 'assignedTo'));
    const visibleWonLeadsColumns = wonLeadsColumns.filter(c => !(isSalesExecutive && c.key === 'assignedTo'));

    const pageTotals = React.useMemo(() => {
        return wonLeads.reduce((acc, lead) => {
            const kw = parseFloat(lead.kwRequirement || '') || 0;
            let projectAmt = lead.projectAmount ?? lead.projectDetail?.projectAmount ?? 0;
            if (!projectAmt && lead.quotations && lead.quotations.length > 0) {
                const lastQuotation = lead.quotations[lead.quotations.length - 1];
                const firstRow = lastQuotation.rows?.[0];
                const value = firstRow?.values?.[0];
                if (value) {
                    projectAmt = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
                }
            }
            const pendingAmt = lead.pendingAmount ?? (projectAmt - (lead.paymentAmount || 0));
            return {
                totalKwReq: acc.totalKwReq + kw,
                totalAmount: acc.totalAmount + projectAmt,
                totalPendingAmount: acc.totalPendingAmount + pendingAmt
            };
        }, { totalKwReq: 0, totalAmount: 0, totalPendingAmount: 0 });
    }, [wonLeads]);

    return (
        <div className="flex h-full flex-col gap-4">
            {/* <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                    {(['board', 'lost', 'won'] as SubView[]).map((v) => {
                        const lostCount = lostPagination?.totalItems ?? lostLeads.length;
                        const wonCount = wonPagination?.totalItems ?? wonLeads.length;
                        const label = v === 'board' ? 'Kanban View' : v === 'lost' ? 'Lost Leads' : 'Won Leads';
                        const count = v === 'lost' ? lostCount : v === 'won' ? wonCount : null;
                        return (
                            <button
                                key={v}
                                onClick={() => handleSubViewChange(v)}
                                className={`flex items-center gap-2 rounded-lg cursor-pointer px-4 py-1.5 text-sm font-medium capitalize transition-colors ${subView === v
                                    ? 'border border-[#F28522] text-[#F28522] bg-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                                    }`}
                            >
                                {label}
                                {count !== null && (
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${subView === v
                                        ? 'bg-[#F28522] text-white'
                                        : v === 'lost'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div> */}



            {subView === 'board' && statusGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-320px)] text-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-gray-700 font-semibold text-base">No columns selected</p>
                        <p className="text-gray-400 text-sm mt-1">Go to <strong>Setup → Kanban Status</strong> and select which stages to show.</p>
                    </div>
                </div>
            ) : subView === 'board' && (
                <div className="overflow-x-auto w-full pb-4">
                    <div className="flex gap-4 h-[calc(100vh-280px)] min-w-max">
                        {statusGroups.map((group) => {
                            const headerBg = group.isWon
                                ? 'bg-secondary'
                                : group.isLost
                                    ? 'bg-secondary'
                                    : 'bg-secondary';
                            const headerCountColor = group.isWon
                                ? 'text-emerald-700'
                                : group.isLost
                                    ? 'text-red-500'
                                    : 'text-orange-700';
                            const bodyBg = group.isWon
                                ? 'bg-[#f4f7fb]'
                                : group.isLost
                                    ? 'bg-[#f4f7fb]'
                                    : 'bg-[#f4f7fb]';

                            return (
                                <div key={group.id} className="w-80 flex-shrink-0 flex flex-col">
                                    <div className={`rounded-t-xl ${headerBg} px-5 py-3`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-white capitalize">{group.title}</h3>
                                            </div>
                                            <span className={`rounded-full bg-white px-3 py-0.5 text-sm font-semibold ${headerCountColor}`}>
                                                {group.count}
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        className={`flex-1 overflow-y-auto rounded-b-lg ${bodyBg} p-3 space-y-3`}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDrop(group.id)}
                                        onScroll={(e) => {
                                            const t = e.target as HTMLDivElement;
                                            if (Math.ceil(t.scrollTop + t.clientHeight) >= t.scrollHeight - 20) {
                                                loadMore(group.id);
                                            }
                                        }}
                                    >
                                        {group.isLoading ? (
                                            <div className="flex h-full items-center justify-center py-10">
                                                <div className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${group.isWon ? 'border-black' : group.isLost ? 'border-black' : 'border-secondary'
                                                    }`} />
                                            </div>
                                        ) : group.leads.length === 0 ? (
                                            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                                                <p className="text-sm font-medium">No leads yet</p>
                                                <p className="text-xs mt-1">Drag and drop here</p>
                                            </div>
                                        ) : (
                                            <>
                                                {group.leads.map((lead, index) => (
                                                    <div
                                                        key={lead._id}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDrop(group.id, index);
                                                        }}
                                                    >
                                                        <KanbanCard
                                                            lead={lead}
                                                            isUpdating={updatingId === lead._id}
                                                            onDragStart={permissions?.update && !group.isWon ? () => setDraggingId(lead._id) : undefined}
                                                            onView={() => onView?.(lead)}
                                                            onEdit={permissions?.update ? () => onEdit?.(lead) : undefined}
                                                            onMarkLost={permissions?.update && !group.isLost && !group.isWon ? () => markLost(lead._id) : undefined}
                                                            onMarkWon={permissions?.update && !group.isWon && !group.isLost ? () => markWon(lead._id) : undefined}
                                                            onReactivate={permissions?.update && group.isLost ? () => reactivate(lead._id) : undefined}
                                                        />
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                        {loadingMoreMap[group.id] && (
                                            <div className="flex justify-center py-2">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {subView === 'lost' && (
                <div className="w-full">
                    <DataTable
                        data={lostLeads}
                        columns={visibleLostLeadsColumns}
                        loading={false}
                        pagination
                        currentPage={lostPagination?.currentPage ?? 1}
                        totalPages={lostPagination?.totalPages ?? 1}
                        totalRecords={lostPagination?.totalItems ?? lostLeads.length}
                        pageSize={lostPagination?.rowsPerPage ?? 10}
                        onPageChange={lostPagination?.handlePageChange}
                        onPageSizeChange={lostPagination?.handleRowsPerPageChange}
                        actions
                        onView={(row) => onView?.(row)}
                        onEdit={permissions?.update ? (row) => onEdit?.(row) : undefined}
                        extraActions={permissions?.update ? [{ label: 'Reactivate', onClick: (row) => reactivate(row._id), icon: <RefreshCw className="h-4 w-4" />, color: 'orange' }] : undefined}
                        searchable={false}
                    />
                </div>
            )}

            {subView === 'won' && (
                <div className="w-full pb-48">
                    <DataTable
                        data={wonLeads}
                        columns={visibleWonLeadsColumns}
                        loading={false}
                        pagination
                        currentPage={wonPagination?.currentPage ?? 1}
                        totalPages={wonPagination?.totalPages ?? 1}
                        totalRecords={wonPagination?.totalItems ?? wonLeads.length}
                        pageSize={wonPagination?.rowsPerPage ?? 10}
                        onPageChange={wonPagination?.handlePageChange}
                        onPageSizeChange={wonPagination?.handleRowsPerPageChange}
                        actions
                        onView={(row) => onView?.(row)}
                        onEdit={permissions?.update ? (row) => onEdit?.(row) : undefined}
                        extraActions={(() => {
                            const actions: {
                                label: string;
                                onClick: (row: ApiLead) => void;
                                icon?: React.ReactNode;
                                color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'emerald';
                                show?: (row: ApiLead) => boolean;
                            }[] = [];
                            const roleName = currentUser?.role?.roleName || '';
                            if (roleName === 'admin' || roleName === 'super admin' || roleName.includes('document')) {
                                actions.push({
                                    label: 'Documents',
                                    icon: <FileText className="h-3.5 w-3.5" />,
                                    color: 'emerald' as const,
                                    onClick: (row: ApiLead) => {
                                        setDocumentsLead(row);
                                    },
                                });
                            }
                            if (permissions?.update) {
                                actions.push({
                                    label: 'Add',
                                    icon: <Plus className="h-3.5 w-3.5" />,
                                    color: 'emerald',
                                    onClick: (row: ApiLead) => setProjectDetailLead(row),
                                });
                                actions.push({
                                    label: 'Pay',
                                    icon: <span className="text-xs font-bold">₹</span>,
                                    color: 'emerald',
                                    onClick: (row: ApiLead) => setPaymentLead(row),
                                });
                            }
                            return actions.length > 0 ? actions : undefined;
                        })()}
                        searchable={false}
                        maxHeight="100vh"
                    />
                    
                    {wonLeads.length > 0 && (
                        <div 
                            className="fixed bottom-16 right-0 bg-[#F3F4F6] border-t border-gray-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)] z-[60] px-6 py-4"
                            style={{ 
                                left: isMobile ? '0' : (isSidebarOpen ? '16rem' : '5rem') 
                            }}
                        >
                            <div className="flex items-center gap-6 overflow-x-auto">
                                <div className="whitespace-nowrap text-right font-extrabold text-gray-900 text-base uppercase tracking-wider flex-shrink-0">Grand Totals</div>
                                <div className="whitespace-nowrap text-left font-bold text-slate-800 text-sm border-l border-gray-300 pl-6 flex-shrink-0">Total KW: {pageTotals.totalKwReq?.toLocaleString() || 0} <span className="text-xs text-slate-500 font-normal ml-1">KW</span></div>
                                <div className="whitespace-nowrap text-left font-bold text-slate-800 text-sm border-l border-gray-300 pl-6 flex-shrink-0">Total Amount: ₹{pageTotals.totalAmount?.toLocaleString() || 0}</div>
                                <div className="whitespace-nowrap text-left font-bold text-red-600 text-base border-l border-gray-300 pl-6 flex-shrink-0">Total Pending Amount: ₹{pageTotals.totalPendingAmount?.toLocaleString() || 0}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Project Detail Drawer */}
            <ProjectDetailDrawer
                isOpen={!!projectDetailLead}
                lead={projectDetailLead}
                onClose={() => setProjectDetailLead(null)}
                onSaved={() => { onRefresh(); setProjectDetailLead(null); }}
            />

            {/* Payment Modal */}
            <PaymentModal
                isOpen={!!paymentLead}
                lead={paymentLead}
                onClose={() => setPaymentLead(null)}
                onPaymentAdded={onRefresh}
            />

            {/* Lead Documents Dialog */}
            <LeadDocumentsDialog
                isOpen={!!documentsLead}
                lead={documentsLead}
                onClose={() => setDocumentsLead(null)}
            />

            {/* Mark Lost Modal */}
            {lostModalLeadId && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !markingLost && setLostModalLeadId(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                        <div className="bg-[#F28522] px-5 py-4 flex items-center justify-between rounded-t-2xl">
                            <h3 className="text-white font-bold text-base">Mark Lead as Lost?</h3>
                            <button onClick={() => !markingLost && setLostModalLeadId(null)} className="text-white hover:opacity-80">
                                <span className="text-xl leading-none">×</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <span className="text-[#F28522]">✖</span> Remove Reason
                                </label>
                                <input
                                    type="text"
                                    value={lostReason}
                                    onChange={(e) => setLostReason(e.target.value)}
                                    placeholder="Enter reason for marking lead as lost"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#F28522] focus:ring-1 focus:ring-[#F28522]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <span className="text-[#F28522]">📅</span> Lost Date
                                </label>
                                <Calendar
                                    value={lostDate ? new Date(lostDate + 'T00:00:00') : null}
                                    onChange={(date) => {
                                        if (!date) { setLostDate(''); return; }
                                        const y = date.getFullYear();
                                        const m = String(date.getMonth() + 1).padStart(2, '0');
                                        const d = String(date.getDate()).padStart(2, '0');
                                        setLostDate(`${y}-${m}-${d}`);
                                    }}
                                    minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                                    placeholder="Select date"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-5 pb-5">
                            <button
                                onClick={() => setLostModalLeadId(null)}
                                disabled={markingLost}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmMarkLost}
                                disabled={markingLost}
                                className="flex-1 px-4 py-2 rounded-xl bg-[#F28522] text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {markingLost ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : 'Yes, Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ContactCell({ phone, email }: { phone: string; email: string }) {
    return (
        <div className="space-y-0.5 text-sm text-gray-600">
            <div className="flex items-center gap-1.5"><FiPhone className="h-3.5 w-3.5 text-gray-400" />{phone}</div>
            <div className="flex items-center gap-1.5"><FiMail className="h-3.5 w-3.5 text-gray-400" />{email}</div>
        </div>
    );
}