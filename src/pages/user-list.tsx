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
  department: string;

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

export function UserContent() {
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
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const [setupPermissions, setSetupPermissions] = useState<{
    create?: boolean;
    readAll?: boolean;
    update?: boolean;
    delete?: boolean;
  } | null>(null);

  const [departments, setDepartments] = useState<{ _id: string; roleName: string; name?: string }[]>([]);

  useEffect(() => {
    if (!token) return;

    // Fetch permissions
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
    // Fetch departments to map IDs to names
    axios
      .get(baseUrl.department, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDepartments(res.data?.data ?? []);
      })
      .catch(() => setDepartments([]));
  }, [token]);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(baseUrl.getAllUsers, {
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
        role?: string | { roleName?: string, name?: string, _id?: string };
      }[]) || [];
      const pagination = res.data?.pagination || {};

      const formatted: StaffManagement[] = payload.map((item: any) => {
        const roleObj = item.role;
        const roleOrDeptId = typeof roleObj === 'object' && roleObj !== null ? roleObj._id : roleObj;
        const deptName = typeof roleObj === 'object' && roleObj !== null
          ? (roleObj.roleName || roleObj.name)
          : departments.find(d => d._id === roleOrDeptId)?.roleName || roleOrDeptId || '-';

        return {
          id: item._id,
          image: item.profileImage || '',
          fullName: item.fullName || '',
          number: item.phone || '',
          email: item.email || '',
          password: item.password ? '******' : '',
          status: item.status || 'Active',
          department: deptName || '-',
        };
      });

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
  }, [page, limit, debouncedSearch, token, departments]);

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
              src={value.startsWith('http') ? value : `${process.env.NEXT_PUBLIC_IMAGE_URL}/images/StaffProfileImages/${value}`}
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
      render: (value) => {
        const isActive = value?.toLowerCase() === 'active';
        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'department',
      label: 'DEPARTMENT',
    },
  ];

  const handleAdd = () => {
    setEditingExecutive(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (row: StaffManagement) => {
    try {
      const res = await axios.get(`${baseUrl.findUserById}/${row.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const item = res.data?.data;
      if (!item) throw new Error('User not found');

      const formatted: StaffManagement = {
        id: item._id,
        image: item.profileImage || '',
        fullName: item.fullName || '',
        number: item.phone || '',
        email: item.email || '',
        password: '',
        status: item.status || 'active',
        department: item.role?._id || item.role || '',
      };

      setEditingExecutive(formatted);
      setIsFormOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch user by id:', err);
      toast.error(err?.response?.data?.message || 'Could not load user details');
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
      await axios.delete(`${baseUrl.deleteUser}/${staffToDelete.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      fetchStaff();
      toast.success('User deleted successfully');

      // Close dialog
      setShowDeleteDialog(false);
      setStaffToDelete(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete user');
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

  const handleExport = async () => {
    console.log('handleExport called!');
    setExporting(true);
    try {
      const response = await axios.get(baseUrl.exportUsers, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: 'blob',
        params: { search },
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `users_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Export completed');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          onExport={handleExport} 
          addButton={
            canCreate
              ? {
                label: 'Add User',
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
        title="Delete User"
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
            Are you sure you want to delete user "{staffToDelete?.fullName}"?
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

export default function User() {
  return (
    <>
      <UserContent />
    </>
  );
}