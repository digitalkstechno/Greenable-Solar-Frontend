'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable, { Column } from '@/components/DataTable';
import StaffManagementForm from '@/components/StaffManagement';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import DeleteDialog from '@/components/DeleteDialog';

interface StaffManagement {
  id: string;
  image?: string;
  fullName: string;
  number: string;
  email: string;
  password: string;
  status: string;
  role: string;
  teams?: string[];
  organizations?: string[];
}

// ──────────────────────────────────────────────── Debounce hook
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function StaffManagementContent() {
  const [staffManagementData, setStaffManagementData] = useState<StaffManagement[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExecutive, setEditingExecutive] = useState<StaffManagement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffManagement | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const debouncedSearch = useDebounce(search, 500);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const [setupPermissions, setSetupPermissions] = useState<{
    create?: boolean;
    readAll?: boolean;
    update?: boolean;
    delete?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    axios
      .get(baseUrl.currentStaff, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions)
          ? role.permissions[0]
          : role.permissions || {};
        setSetupPermissions(rawPerms.staff || null);
      })
      .catch(() => {
        setSetupPermissions(null);
      });
  }, [token]);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(baseUrl.getAllStaff, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        params: {
          page,
          limit,
          search: debouncedSearch.trim(),
        },
      });

      const payload = (res.data?.data as {
        _id: string;
        profileImage?: string;
        fullName?: string;
        phone?: string;
        email?: string;
        password?: string;
        status?: string;
        role?: { roleName?: string } | null;
        teams?: { _id: string; name: string }[];
        organizations?: { _id: string; name: string }[];
      }[]) || [];
      const pagination = res.data?.pagination || {};

      const formatted: StaffManagement[] = payload.map((item) => ({
        id: item._id,
        image: item.profileImage || '',
        fullName: item.fullName || '',
        number: item.phone || '',
        email: item.email || '',
        password: item.password ? '******' : '',
        status: item.status || 'Active',
        role: item.role?.roleName || '-',
        teams: (item.teams || []).map((t) => t.name),
        organizations: (item.organizations || []).map((o) => o.name),
      }));

      setStaffManagementData(formatted);
      setTotalPages(pagination.totalPages || 1);
      setTotalRecords(pagination.totalRecords || 0);

      // Prevent staying on invalid page
      if (page > (pagination.totalPages || 1)) {
        setPage(pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaffManagementData([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, token]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const columns: Column<StaffManagement>[] = [
    {
      key: 'image',
      label: 'IMAGE',
      render: (value, row) => (
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-sky-900">
          {value ? (
            <img
              src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/images/StaffProfileImages/${value}`}
              alt={row.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-gray-500">
              {row.fullName?.charAt(0) || '?'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'fullName',
      label: 'FULL NAME',
      render: (value) => <span className="font-semibold">{value}</span>,
    },
    {
      key: 'number',
      label: 'NUMBER',
    },
    {
      key: 'email',
      label: 'EMAIL',
      render: (value) => (
        <a href={`mailto:${value}`} className="text-sky-950 underline">
          {value}
        </a>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (value) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            value === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'ROLE',
    },
    {
      key: 'teams',
      label: 'TEAMS',
      render: (value: any) => (
        <div className="flex flex-wrap gap-1">
          {(value as string[])?.length > 0
            ? (value as string[]).map((name) => (
                <span key={name} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {name}
                </span>
              ))
            : <span className="text-gray-400 text-xs">—</span>}
        </div>
      ),
    },
    {
      key: 'organizations',
      label: 'ORGANIZATIONS',
      render: (value: any) => (
        <div className="flex flex-wrap gap-1">
          {(value as string[])?.length > 0
            ? (value as string[]).map((name) => (
                <span key={name} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {name}
                </span>
              ))
            : <span className="text-gray-400 text-xs">—</span>}
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingExecutive(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (row: StaffManagement) => {
    try {
      const res = await axios.get(`${baseUrl.findStaffById}/${row.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const item = res.data?.data;
      if (!item) throw new Error('Staff not found');

      const formatted: StaffManagement = {
        id: item._id,
        image: item.profileImage || '',
        fullName: item.fullName || '',
        number: item.phone || '',
        email: item.email || '',
        password: '',
        status: item.status || 'Active',
        role: item.role?._id || '',
        teams: (item.teams || []).map((t: any) => typeof t === 'string' ? t : t._id),
        organizations: (item.organizations || []).map((o: any) => typeof o === 'string' ? o : o._id),
      };

      setEditingExecutive(formatted);
      setIsFormOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch staff by id:', err);
      toast.error(err?.response?.data?.message || 'Could not load staff details');
    }
  };

  // Show delete confirmation dialog
  const handleDeleteClick = (row: StaffManagement) => {
    setStaffToDelete(row);
    setShowDeleteDialog(true);
  };

  // Perform actual delete
  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      await axios.delete(`${baseUrl.deleteStaff}/${staffToDelete.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      fetchStaff();
      toast.success('Staff member deleted successfully');
      
      // Close dialog
      setShowDeleteDialog(false);
      setStaffToDelete(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete staff member');
    }
  };

  const handleSubmit = () => {
    fetchStaff();
    setIsFormOpen(false);
    setEditingExecutive(null);
  };

  const canCreate = !!setupPermissions?.create;
  const canUpdate = !!setupPermissions?.update;
  const canDelete = !!setupPermissions?.delete;

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
        </div>

        <DataTable
          data={staffManagementData}
          columns={columns}
          searchable
          pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined} // Changed to handleDeleteClick
          actions
          addButton={
            canCreate
              ? {
                  label: 'Add Staff',
                  onClick: handleAdd,
                }
              : undefined
          }
          // Optional: pass isLoading if your DataTable supports loading UI
          // isLoading={isLoading}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setStaffToDelete(null);
        }}
        title="Delete Staff Member"
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setShowDeleteDialog(false);
                setStaffToDelete(null);
              }}
              className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="rounded-lg cursor-pointer bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-gray-700">
            Are you sure you want to delete staff member "{staffToDelete?.fullName}"? 
            This action cannot be undone.
          </p>
        </div>
      </DeleteDialog>

      <StaffManagementForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExecutive(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingExecutive}
      />
    </>
  );
}

export default function StaffManagement() {
  return (
    <>
      <StaffManagementContent />
    </>
  );
}