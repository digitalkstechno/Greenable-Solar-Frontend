import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Phone, Mail, Plus, FileText } from 'lucide-react';
import { baseUrl, getAuthToken } from '@/config';
import { ApiSource, ApiStatus, ApiUser, ApiLead } from './types';
import DataTable, { Column } from '@/components/DataTable';
import DeleteDialog from '@/components/DeleteDialog';
import Swal from 'sweetalert2';
import ProjectDetailDrawer from './ProjectDetailDrawer';
import PaymentModal from './PaymentModal';
import LeadDocumentsDialog from './LeadDocumentsDialog';

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
  kwRequirement?: string;
  discomName?: string;
  address?: string;
  locationLink?: string;
  status: string;
  staff: string;
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
  wonCount?: number;
  lostCount?: number;
  onStatusFilter?: (status: string) => void;
  activeStatusFilter?: string;
  totals?: any;
  currentUser?: any;
  fetchLeadsList?: any;
}

function mapLead(item: any): TableLead {
  return {
    id: item._id,
    name: item.fullName,
    contact: item.contact || item.phone,
    email: item.email,
    kwRequirement: item.kwRequirement || '-',
    discomName: item.discomName || '-',
    address: item.address,
    locationLink: item.locationLink,
    status: item.leadStatus?.name || item.status?.name || '-',
    staff: item.assignedTo?.fullName || '-',
    lastFollowUp: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString()
      : '-',
    projectAmount: item.projectAmount,
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
}: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState<TableLead[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableLead | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [projectDetailLead, setProjectDetailLead] = useState<ApiLead | null>(null);
  const [paymentLead, setPaymentLead] = useState<ApiLead | null>(null);
  const [documentsLead, setDocumentsLead] = useState<ApiLead | null>(null);

  // Use loading from prop or local state
  const loading = loadingProp !== undefined ? loadingProp : localLoading;

  // Map external leads to table format when they change
  useEffect(() => {
    if (externalLeads && externalLeads.length > 0) {
      setLeads(externalLeads.map(mapLead));
    } else if (externalLeads && externalLeads.length === 0) {
      setLeads([]);
    }
  }, [externalLeads]);

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
            <Phone className="h-3 w-3 text-gray-400" />
            <span>{row.contact || '-'}</span>
          </div>
          {/* Action icons */}
          {row.contact && (
            <div className="flex items-center gap-2 mt-1">
              {/* Call Now */}
              <a
                href={`tel:${row.contact}`}
                title="Call Now"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${row.contact.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'EMAIL',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-gray-400" />
          {row.email ? (
            <a
              href={`mailto:${row.email}`}
              title="Send Email"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:text-blue-700 hover:underline transition-colors text-sm"
            >
              {row.email}
            </a>
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
      ),
    },
    { key: 'kwRequirement', label: 'KW REQ' },
    { key: 'discomName', label: 'DISCOM' },
    { key: 'status', label: 'STATUS' },
    { key: 'staff', label: 'ASSIGNED STAFF' },
    { key: 'lastFollowUp', label: 'LAST FOLLOW-UP' },
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

  if (activeStatusFilter === 'won') {
    columns.push({
      key: 'projectAmount',
      label: 'Total Amount',
      render: (_v, row) => {
        const projectAmt = row.projectAmount ?? row._raw?.projectDetail?.projectAmount ?? 0;
        return projectAmt ? `₹${Number(projectAmt).toLocaleString()}` : '-';
      },
    });
    columns.push({
      key: 'pendingAmount',
      label: 'Pending Amount',
      render: (_v, row) => {
        const projectAmt = row.projectAmount ?? row._raw?.projectDetail?.projectAmount ?? 0;
        const pendingAmt = row.pendingAmount ?? (projectAmt - (row._raw?.paymentAmount || 0));
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
      const pendingAmt = row.pendingAmount ?? (projectAmt - (row._raw?.paymentAmount || 0));
      return {
        totalKwReq: acc.totalKwReq + kw,
        totalAmount: acc.totalAmount + projectAmt,
        totalPendingAmount: acc.totalPendingAmount + pendingAmt,
      };
    }, { totalKwReq: 0, totalAmount: 0, totalPendingAmount: 0 });
  }, [leads]);

  return (
    <div className="space-y-4">

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => onStatusFilter?.('new lead')}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors border ${activeStatusFilter === 'new lead'
            ? 'border-orange-400 text-orange-600 bg-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
            }`}
        >
          New Lead
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
            {newLeadCount}
          </span>
        </button>
        <button
          onClick={() => onStatusFilter?.('won')}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors border ${activeStatusFilter === 'won'
            ? 'border-green-200 text-green-600 bg-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
            }`}
        >
          Won Leads
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
            {wonCount}
          </span>
        </button>
        <button
          onClick={() => onStatusFilter?.('lost')}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors border ${activeStatusFilter === 'lost'
            ? 'border-red-200 text-red-600 bg-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
            }`}
        >
          Lost Leads
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
            {lostCount}
          </span>
        </button>
      </div>

      {/* Data table */}
      <DataTable
        data={leads}
        columns={columns}
        loading={loading}
        pagination
        searchValue={filters.search || ''}
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
              label: 'Add Details',
              icon: <Plus className="h-3.5 w-3.5" />,
              color: 'emerald' as const,
              onClick: (row: TableLead) => {
                const rawLead: ApiLead = row._raw || row;
                setProjectDetailLead(rawLead);
              },
            });
            actions.push({
              label: 'Payment',
              icon: <span className="text-xs font-bold">₹</span>,
              color: 'emerald' as const,
              show: (row: TableLead) => row.status?.toLowerCase() === 'won',
              onClick: (row: TableLead) => {
                const rawLead: ApiLead = row._raw || row;
                setPaymentLead(rawLead);
              },
            });
          }
          return actions.length > 0 ? actions : undefined;
        })()}
        footer={activeStatusFilter === 'won' && leads.length > 0 ? (
        <tr className="sticky bottom-0 z-30 bg-[#F3F4F6] border-t border-gray-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)]">
  
  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-right font-extrabold text-gray-900 text-base uppercase tracking-wider bg-[#F3F4F6]">
    Grand Totals
  </td>

  <td className="px-6 py-4 whitespace-nowrap text-left font-bold text-slate-800 text-sm border-l border-gray-300 bg-[#F3F4F6]">
    {pageTotals.totalKwReq?.toLocaleString() || 0} <span className="text-xs text-slate-500 font-normal ml-1">KW</span>
  </td>

  <td colSpan={5} className="bg-[#F3F4F6] border-l border-gray-300"></td>

  <td className="px-6 py-4 whitespace-nowrap text-left font-bold text-slate-800 text-sm border-l border-gray-300 bg-[#F3F4F6]">
    ₹{pageTotals.totalAmount?.toLocaleString() || 0}
  </td>

  <td className="px-6 py-4 whitespace-nowrap text-left font-bold text-red-600 text-base border-l border-gray-300 bg-[#F3F4F6]">
    ₹{pageTotals.totalPendingAmount?.toLocaleString() || 0}
  </td>

  <td className="bg-[#F3F4F6] border-l border-gray-300"></td>
</tr>
        ) : undefined}
      />

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
    </div>
  );
}