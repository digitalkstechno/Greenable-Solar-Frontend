'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable, { Column } from '@/components/DataTable';
import UserManagementForm from '@/components/UserManagement';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import DeleteDialog from '@/components/DeleteDialog';

interface UserManagement {
  id: string;
  image?: string;
  fullName: string;
  number: string;
  email: string;
  password?: string;
  status: string;
  department?: string;
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

export function UserManagementContent() {
  const [userManagementData, setUserManagementData] = useState<UserManagement[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserManagement | null>(null);
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
        setSetupPermissions(rawPerms.setup || null);
      })
      .catch(() => {
        setSetupPermissions(null);
      });
  }, [token]);

  const fetchUsers = useCallback(async () => {
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
        department?: { _id: string; name: string } | null;
      }[]) || [];
      const pagination = res.data?.pagination || {};

      const formatted: UserManagement[] = payload.map((item) => ({
        id: item._id,
        image: item.profileImage || '',
        fullName: item.fullName || '',
        number: item.phone || '',
        email: item.email || '',
        password: item.password ? '******' : '',
        status: item.status || 'Active',
        department: item.department?.name || '-',
      }));

      setUserManagementData(formatted);
      setTotalPages(pagination.totalPages || 1);
      setTotalRecords(pagination.totalRecords || 0);

      // Prevent staying on invalid page
      if (page > (pagination.totalPages || 1)) {
        setPage(pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUserManagementData([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: Column<UserManagement>[] = [
    {
      key: 'image',
      label: 'IMAGE',
      render: (value, row) => (
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-sky-900">
          {value ? (
            <img
              src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/images/UserProfileImages/${value}`}
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
      key: 'department',
      label: 'DEPARTMENT',
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (value) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            value === 'active' || value === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (row: UserManagement) => {
    try {
      const res = await axios.get(`${baseUrl.findUserById}/${row.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const item = res.data?.data;
      if (!item) throw new Error('User not found');

      const formatted: UserManagement = {
        id: item._id,
        image: item.profileImage || '',
        fullName: item.fullName || '',
        number: item.phone || '',
        email: item.email || '',
        password: '',
        status: item.status || 'Active',
        department: typeof item.department === 'object' && item.department ? item.department._id : (item.department || ''),
      };

      setEditingUser(formatted);
      setIsFormOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch user by id:', err);
      toast.error(err?.response?.data?.message || 'Could not load user details');
    }
  };

  // Show delete confirmation dialog
  const handleDeleteClick = (row: UserManagement) => {
    setUserToDelete(row);
    setShowDeleteDialog(true);
  };

  // Perform actual delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`${baseUrl.deleteUser}/${userToDelete.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      fetchUsers();
      toast.success('User deleted successfully');
      
      // Close dialog
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSubmit = () => {
    fetchUsers();
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const canCreate = !!setupPermissions?.create || true; // Note: adjust based on actual permissions required
  const canUpdate = !!setupPermissions?.update || true;
  const canDelete = !!setupPermissions?.delete || true;

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        </div>

        <DataTable
          data={userManagementData}
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
          onDelete={canDelete ? handleDeleteClick : undefined}
          actions
          addButton={
            canCreate
              ? {
                  label: 'Add User',
                  onClick: handleAdd,
                }
              : undefined
          }
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
        title="Delete User"
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
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
            Are you sure you want to delete user "{userToDelete?.fullName}"? 
            This action cannot be undone.
          </p>
        </div>
      </DeleteDialog>

      <UserManagementForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingUser}
      />
    </>
  );
}

export default function UserManagement() {
  return (
    <>
      <UserManagementContent />
    </>
  );
}
