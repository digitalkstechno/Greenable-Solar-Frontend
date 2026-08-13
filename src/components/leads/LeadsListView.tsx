import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Phone, Mail, Plus, Search, X, FileText, ShieldCheck, Receipt, CheckCircle, Clock } from 'lucide-react';
import { baseUrl, getAuthToken } from '@/config';
import { ApiSource, ApiStatus, ApiUser, ApiLead } from './types';
import DataTable, { Column } from '@/components/DataTable';
import DeleteDialog from '@/components/DeleteDialog';
import Swal from 'sweetalert2';
import ProjectDetailDrawer from './ProjectDetailDrawer';
import PaymentModal from './PaymentModal';
import LeadDocumentsDialog from './LeadDocumentsDialog';
import ExecutivePersonModal from './ExecutivePersonModal';
import { AccountInvoiceModal } from './AccountInvoiceModal';
import InstallationDocModal from './InstallationDocModal';

// ── Debounce helper ──────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Table row type ───────────────────────────────────────────────────────────
interface TableLead extends Record<string, any> {
  id: string;
  name: string;
  contact: string;
  email: string;
  leadSource?: string;
  kwRequirement?: string;
  discomName?: string;
  address?: string;
  locationLink?: string;
  status: string;
  staff: string;
  assignedTo: string;
  lastFollowUp: string;
  projectAmount?: number;
  pendingAmount?: number;
  isActive?: boolean;
  _raw?: any;
}

interface Props {
  statuses: ApiStatus[];
  sources: ApiSource[];
  staffMembers: ApiUser[];
  onEdit?: (lead: ApiLead) => void;
  onView?: (lead: ApiLead) => void;
  onRefresh: () => void;
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
  externalLeads?: ApiLead[];
  loading?: boolean;
  // Add pagination props from parent
  pagination?: {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
    totalItems: number;
    handlePageChange: (page: number) => void;
    handleRowsPerPageChange: (rows: number) => void;
  };
  onSearch?: (value: string) => void;
  newLeadCount?: number;
  searchValue?: string;
  wonCount?: number;
  lostCount?: number;
  onStatusFilter?: (status: string) => void;
  activeStatusFilter?: string;
  totals?: any;
  currentUser?: any;
  fetchLeadsList?: any;
}

function mapLead(item: any): TableLead {

  let projectAmount = item.projectAmount;
  if (!projectAmount && item.quotations && item.quotations.length > 0) {
    const lastQuotation = item.quotations[item.quotations.length - 1];
    const firstRow = lastQuotation.rows?.[0];
    const value = firstRow?.values?.[0];
    if (value) {
      projectAmount = parseInt(value.replace(/[^\d]/g, ''), 10) || undefined;
    }
  }

  return {
    id: item._id,
    name: item.fullName,
    contact: item.contact || item.phone,
    email: item.email,
    leadSource: item.leadSource?.name || item.leadrefrance?.name || item.leadrefrance || item.source?.name || '-',
    kwRequirement: item.kwRequirement || '-',
    discomName: item.discomName || '-',
    address: item.address,
    locationLink: item.locationLink,
    status: item.leadStatus?.name || item.status?.name || '-',
    staff: item.createdBy?.fullName || item.createdBy?.name || '-',
    assignedTo: item.assignedTo?.fullName || item.assignedTo?.name || '-',
    lastFollowUp: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString()
      : '-',
    projectAmount,
    pendingAmount: item.pendingAmount,
    isActive: item.isActive,
    _raw: item,
  };
}

export default function LeadsListView({
  statuses,
  sources,
  staffMembers,
  onEdit,
  onView,
  onRefresh,
  permissions,
  scope = 'all',
  filters = {},
  externalLeads,
  loading: loadingProp,
  pagination, // Receive pagination from parent
  onSearch,
  newLeadCount = 0,
  wonCount = 0,
  lostCount = 0,
  onStatusFilter,
  activeStatusFilter = '',
  totals,
  currentUser,
  searchValue,
}: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState<TableLead[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableLead | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [projectDetailLead, setProjectDetailLead] = useState<ApiLead | null>(null);
  const [paymentLead, setPaymentLead] = useState<ApiLead | null>(null);
  const [documentsLead, setDocumentsLead] = useState<ApiLead | null>(null);
  const [executiveLead, setExecutiveLead] = useState<ApiLead | null>(null);
  const [accountLead, setAccountLead] = useState<ApiLead | null>(null);
  const [installationDocLead, setInstallationDocLead] = useState<ApiLead | null>(null);

  // Use loading from prop or local state
  const loading = loadingProp !== undefined ? loadingProp : localLoading;

  // Map external leads to table format when they change
  useEffect(() => {
    if (externalLeads && externalLeads.length > 0) {
      setLeads(externalLeads.map((item: any) => {
        const mapped = mapLead(item);
        const sourceVal = item.leadSource || item.leadrefrance || item.source;
        const sourceId = typeof sourceVal === 'object' ? sourceVal?._id : sourceVal;
        if (sourceId) {
          const sObj = sources.find(s => s._id === sourceId);
          if (sObj) {
            mapped.leadSource = sObj.name;
          }
        }
        return mapped;
      }));
    } else if (externalLeads && externalLeads.length === 0) {
      setLeads([]);
    }
  }, [externalLeads, sources]);

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: Column<TableLead>[] = [
    {
      key: 'name',
      label: 'FULL NAME',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'contact',
      label: 'CONTACT',
      render: (_, row) => (
        <div className="space-y-1 text-sm">
          {/* Phone number */}
          <div className="flex items-center gap-1.5 text-gray-600">
            <span>{row.contact || '-'}</span>
          </div>
        </div>
      ),
    },
    { key: 'kwRequirement', label: 'KW REQ' },
    { key: 'leadSource', label: 'SOURCE' },
    { key: 'status', label: 'STATUS' },
    {
      key: 'verificationStatus',
      label: 'VERIFICATION',
      render: (_, row) => {
        const isDone = !!row._raw?.projectDetail?.isExecutiveVerified;
        return isDone ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Pending
          </span>
        );
      },
    },
    { key: 'staff', label: 'CREATED BY' },
    {
      key: 'createdAt',
      label: 'CREATED DATE',
      render: (_, row) => {
        const rawLead: any = row._raw || row;
        return rawLead.createdAt ? new Date(rawLead.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) : '-';
      },
    },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    {
      key: 'docs',
      label: 'DOCS',
      render: (_, row) => {
        if (row.status?.toLowerCase() === 'won') {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rawLead: ApiLead = row._raw || row;
                setDocumentsLead(rawLead);
              }}
              className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
              title="Documents"
            >
              <FileText className="h-5 w-5" />
            </button>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
  ];

  const roleStr = `${currentUser?.role?.roleName || ''} ${currentUser?.role?.name || ''} ${currentUser?.roleName || ''} ${typeof currentUser?.department === 'string' ? currentUser.department : ''} ${currentUser?.department?.roleName || ''} ${currentUser?.department?.name || ''} ${currentUser?.departmentName || ''}`.toLowerCase();
  const isSalesExecutive = roleStr.includes('sales');
  const isOnlyBackOffice = roleStr.includes('back office') || roleStr.includes('backoffice');
  const visibleColumns = columns.filter(c => {
    if (isSalesExecutive && c.key === 'assignedTo') return false;
    if (c.key === 'verificationStatus' && !isOnlyBackOffice) return false;
    return true;
  });

  if (activeStatusFilter === 'won') {
    visibleColumns.splice(visibleColumns.length - 2, 0, {
      key: 'projectAmount',
      label: 'Total Amount',
      render: (_v, row) => {
        const projectAmt = row.projectAmount ?? row._raw?.projectDetail?.projectAmount ?? 0;
        return projectAmt ? `₹${Number(projectAmt).toLocaleString()}` : '-';
      },
    });
    visibleColumns.splice(visibleColumns.length - 2, 0, {
      key: 'pendingAmount',
      label: 'Pending Amount',
      render: (_v, row) => {
        const projectAmt = row.projectAmount ?? row._raw?.projectDetail?.projectAmount ?? 0;
        const pendingAmt = (projectAmt || 0) - (row._raw?.paymentAmount || 0);
        return pendingAmt ? <span className="text-red-600 font-semibold">₹{Number(pendingAmt).toLocaleString()}</span> : '-';
      },
    });
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleView = async (row: TableLead) => {
    try {
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const d = res.data.data;
      onView?.(d);
    } catch {
      // fallback
      const apiLead: ApiLead = {
        _id: row.id,
        fullName: row.name,
        contact: row.contact,
        email: row.email,
      };
      onView?.(apiLead);
    }
  };

  const handleEdit = async (row: TableLead) => {
    try {
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const d = res.data.data;
      const apiLead: ApiLead = {
        ...d,
        _id: d._id,
        fullName: d.fullName,
        contact: d.contact,
        email: d.email,
        kwRequirement: d.kwRequirement,
        discomName: d.discomName,
        address: d.address,
        locationLink: d.locationLink,
        leadStatus: d.leadStatus,
        assignedTo: d.assignedTo,
        isActive: d.isActive,
      };
      onEdit?.(apiLead);
    } catch {
      console.error('Failed to fetch lead for edit');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${baseUrl.deleteLead}/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      toast.success('Lead deleted successfully');
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      onRefresh?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete lead');
    } finally {
      setShowDelete(false);
      setDeleteTarget(null);
    }
  };

  // Handle page change from DataTable
  const handlePageChange = (newPage: number) => {
    if (pagination) {
      pagination.handlePageChange(newPage);
    }
  };

  // Handle page size change from DataTable
  const handlePageSizeChange = (newSize: number) => {
    if (pagination) {
      pagination.handleRowsPerPageChange(newSize);
    }
  };

  const pageTotals = React.useMemo(() => {
    return leads.reduce((acc, row) => {
      const kw = parseFloat(row.kwRequirement || '0') || 0;
      const projectAmt = row.projectAmount ?? row._raw?.projectDetail?.projectAmount ?? 0;
      const pendingAmt = (projectAmt || 0) - (row._raw?.paymentAmount || 0);
      return {
        totalKwReq: acc.totalKwReq + kw,
        totalAmount: acc.totalAmount + projectAmt,
        totalPendingAmount: acc.totalPendingAmount + pendingAmt,
      };
    }, { totalKwReq: 0, totalAmount: 0, totalPendingAmount: 0 });
  }, [leads]);

  return (
    <div className="space-y-4 h-[calc(100vh-220px)] flex flex-col">

      {/* Data table */}
      <div className="h-full flex flex-col">
        <DataTable
          maxHeight={activeStatusFilter === 'won' ? 'calc(100vh - 250px)' : '100%'}
          data={leads}
          columns={visibleColumns}
          loading={loading}
          pagination
          searchable={false}
          searchValue={searchValue || ''}
          onSearch={onSearch}
          currentPage={pagination?.currentPage || 1}
          totalPages={pagination?.totalPages || 1}
          totalRecords={pagination?.totalItems || 0}
          pageSize={pagination?.rowsPerPage || 10}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          actions
          onView={handleView}
          onEdit={permissions?.update ? handleEdit : undefined}
          onDelete={permissions?.delete ? (row) => { setDeleteTarget(row); setShowDelete(true); } : undefined}
          extraActions={(() => {
            const actions: {
              label: string;
              onClick: (row: TableLead) => void;
              icon?: React.ReactNode;
              color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'emerald';
              show?: (row: TableLead) => boolean;
            }[] = [];
            const roleName = currentUser?.role?.roleName || '';
            if (permissions?.update) {
              actions.push({
                label: 'Add ',
                icon: <Plus className="h-3.5 w-3.5" />,
                color: 'emerald' as const,
                show: (row: TableLead) => row.status?.toLowerCase() === 'won',
                onClick: (row: TableLead) => {
                  const rawLead: ApiLead = row._raw || row;
                  setProjectDetailLead(rawLead);
                },
              });
              actions.push({
                label: 'Pay',
                icon: <span className="text-xs font-bold">₹</span>,
                color: 'emerald' as const,
                show: (row: TableLead) => row.status?.toLowerCase() === 'won',
                onClick: (row: TableLead) => {
                  const rawLead: ApiLead = row._raw || row;
                  setPaymentLead(rawLead);
                },
              });
            }
            const roleNameStr = (currentUser?.role?.roleName || '').toLowerCase();
            const deptNameStr = (currentUser?.department?.roleName || currentUser?.department?.name || '').toLowerCase();
            const isAdminUser = roleNameStr.includes('admin');
            const isBackOfficeUser = roleNameStr.includes('back office') || roleNameStr.includes('backoffice') || deptNameStr.includes('back office') || deptNameStr.includes('backoffice');
            const isExecutiveUser = !isAdminUser && !isBackOfficeUser && (roleNameStr.includes('executive') || deptNameStr.includes('executive'));

            if (isExecutiveUser) {
              actions.push({
                label: 'Executive',
                icon: <ShieldCheck className="h-3.5 w-3.5" />,
                color: 'emerald' as const,
                show: (row: TableLead) => row.status?.toLowerCase() === 'won' || !!row._raw?.projectDetail,
                onClick: (row: TableLead) => {
                  const rawLead: ApiLead = row._raw || row;
                  setExecutiveLead(rawLead);
                },
              });
              actions.push({
                label: 'Inst. Doc',
                icon: <FileText className="h-3.5 w-3.5" />,
                color: 'orange' as const,
                show: (row: TableLead) => row.status?.toLowerCase() === 'won' || !!row._raw?.projectDetail,
                onClick: (row: TableLead) => {
                  const rawLead: ApiLead = row._raw || row;
                  setInstallationDocLead(rawLead);
                },
              });
            }

            const isOnlyBackOffice = roleNameStr.includes('back office') || deptNameStr.includes('back office');
            if (isOnlyBackOffice) {
              actions.push({
                label: 'Make Invoice',
                icon: <Receipt className="h-3.5 w-3.5" />,
                color: 'orange' as const,
                show: (row: TableLead) => !!(row._raw?.projectDetail?.isExecutiveVerified),
                onClick: (row: TableLead) => {
                  const rawLead: ApiLead = row._raw || row;
                  setAccountLead(rawLead);
                },
              });
            }
            return actions.length > 0 ? actions : undefined;
          })()}
          tableFooterRow={activeStatusFilter === 'won' && leads.length > 0 ? (
            <tr className="sticky bottom-0 z-30 bg-[#F3F4F6] border-t border-gray-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)]">
              {visibleColumns.map((col, idx) => {
                if (idx === 0) {
                  return <td key={col.key as string} className="px-6 py-4 whitespace-nowrap text-right font-extrabold text-gray-900 text-base uppercase tracking-wider bg-[#F3F4F6]">Grand Totals</td>;
                }
                if (col.key === 'kwRequirement') {
                  return <td key={col.key as string} className="px-6 py-4 whitespace-nowrap text-left font-bold text-slate-800 text-sm border-l border-gray-300 bg-[#F3F4F6]">{pageTotals.totalKwReq?.toLocaleString() || 0} <span className="text-xs text-slate-500 font-normal ml-1">KW</span></td>;
                }
                if (col.key === 'projectAmount') {
                  return <td key={col.key as string} className="px-6 py-4 whitespace-nowrap text-left font-bold text-slate-800 text-sm border-l border-gray-300 bg-[#F3F4F6]">₹{pageTotals.totalAmount?.toLocaleString() || 0}</td>;
                }
                if (col.key === 'pendingAmount') {
                  return <td key={col.key as string} className="px-6 py-4 whitespace-nowrap text-left font-bold text-red-600 text-base border-l border-gray-300 bg-[#F3F4F6]">₹{pageTotals.totalPendingAmount?.toLocaleString() || 0}</td>;
                }
                return <td key={col.key as string} className="bg-[#F3F4F6] border-l border-gray-300"></td>;
              })}
              <td className="bg-[#F3F4F6] border-l border-gray-300"></td>
            </tr>
          ) : undefined}
        />
      </div>

      {/* Delete dialog */}
      <DeleteDialog
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        title="Delete Lead"
        size="md"
        footer={
          <>
            <button
              onClick={() => { setShowDelete(false); setDeleteTarget(null); }}
              className="rounded-lg border cursor-pointer border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-600 cursor-pointer px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="py-4 text-gray-700">
          Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
          This action cannot be undone.
        </p>
      </DeleteDialog>

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

      {/* Executive Person Modal */}
      <ExecutivePersonModal
        isOpen={!!executiveLead}
        lead={executiveLead}
        onClose={() => setExecutiveLead(null)}
        onVerified={onRefresh}
      />

      {/* Account Invoice Modal */}
      <AccountInvoiceModal
        isOpen={!!accountLead}
        lead={accountLead}
        onClose={() => setAccountLead(null)}
        onSaved={onRefresh}
      />

      {/* Installation & Accounts Document Modal */}
      <InstallationDocModal
        isOpen={!!installationDocLead}
        lead={installationDocLead}
        onClose={() => setInstallationDocLead(null)}
      />
    </div>
  );
}