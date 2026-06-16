'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Dialog from './Dialog';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import FormInput from './ui/Input';
import { FiCamera } from 'react-icons/fi';

interface User {
  image?: string;
  fullName: string;
  number: string;
  email: string;
  password?: string;
  department?: string;
  id?: string;
}

interface UserManagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: User) => void;
  initialData?: User | null;
}

// Validation schema
const validationSchema = Yup.object({
  fullName: Yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),

  number: Yup.string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),

  email: Yup.string()
    .required('Email is required')
    .email('Invalid email format'),

  department: Yup.string().notRequired(),

  password: Yup.string()
    .when('$isUpdate', {
      is: false,
      then: (schema) => schema.required('Password is required').min(6, 'Password must be at least 6 characters'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export default function UserManagementForm({
  isOpen,
  onClose,
  onSubmit: parentOnSubmit,
  initialData,
}: UserManagementFormProps) {

  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const isUpdate = !!initialData?.id;

  // Only run on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = getAuthToken();
      setToken(storedToken);
    }
  }, []);

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      fullName: '',
      number: '',
      email: '',
      password: '',
      department: '',
      id: undefined as string | number | undefined,
      image: undefined as string | undefined,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    context: { isUpdate },
    onSubmit: async (values) => {
      await handleSubmit(values);
    },
    enableReinitialize: true,
  });

  const resetForm = () => {
    formik.resetForm();
    setSelectedFile(null);
    setPreviewImage(null);
    setShowPassword(false);
    setError(null);
  };

  useEffect(() => {
    if (initialData?.id) {
      // 🟢 EDIT MODE
      formik.setValues({
        id: initialData.id,
        image: initialData.image,
        fullName: initialData.fullName || '',
        number: initialData.number || '',
        email: initialData.email || '',
        password: '',
        department: initialData.department || '',
      });

      if (initialData.image) {
        setPreviewImage(
          `${process.env.NEXT_PUBLIC_IMAGE_URL}/images/UserProfileImages/${initialData.image}`
        );
      }
    } else {
      // 🔵 ADD MODE → RESET FORM
      resetForm();
    }
  }, [initialData, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, JPG, and GIF images are allowed');
      toast.error('Only JPEG, PNG, JPG, and GIF images are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = new FormData();

      // Append text fields
      payload.append('fullName', values.fullName);
      payload.append('phone', values.number);
      payload.append('email', values.email);
      payload.append('department', values.department || '');

      // Only send password when creating or when it's changed (not empty)
      if (values.password.trim()) {
        payload.append('password', values.password);
      }

      if (selectedFile) {
        payload.append('profileImage', selectedFile);
      }

      const response = isUpdate
        ? await axios.put(`${baseUrl.userUpdate}/${values.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        : await axios.post(baseUrl.userAdd, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

      parentOnSubmit?.(response.data);

      if (isUpdate) {
        toast.success('User updated successfully');
      } else {
        toast.success('User created successfully');
      }

      // ✅ reset only when creating
      if (!isUpdate) {
        resetForm();
      }

      onClose();

    } catch (err: any) {
      const message = err.response?.data?.message || 'Something went wrong';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isUpdate ? 'Edit User' : 'Add User'}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 cursor-pointer rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-management-form"
            className="px-4 py-2 cursor-pointer rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !formik.isValid}
          >
            {loading ? 'Saving...' : isUpdate ? 'Update' : 'Add'}
          </button>
        </>
      }
    >
      <form id="user-management-form" onSubmit={formik.handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Image Upload with Round Preview */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <FiCamera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <label
              htmlFor="profile-image"
              className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-600 p-1.5 text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              <FiCamera className="h-4 w-4" />
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          {!isUpdate && 'Upload a profile image (JPEG, PNG, JPG, GIF, max 5MB)'}
          {isUpdate && previewImage && 'Click camera icon to change image'}
          {isUpdate && !previewImage && 'Upload a profile image'}
        </p>

        {/* Full Name + Mobile */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormInput
            label="Full Name"
            name="fullName"
            type="text"
            value={formik.values.fullName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.fullName && formik.errors.fullName ? formik.errors.fullName : undefined}
            required
            placeholder="Enter full name"
          />
          <FormInput
            label="Mobile Number"
            name="number"
            type="tel"
            value={formik.values.number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.number && formik.errors.number ? formik.errors.number : undefined}
            required
            placeholder="Enter mobile number"
          />
        </div>

        {/* Email + Password */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
            required
            placeholder="Enter email"
          />
          <FormInput
            label={isUpdate ? 'New Password (optional)' : 'Password'}
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
            required={!isUpdate}
            placeholder={isUpdate ? 'Leave blank to keep current' : 'Enter password'}
          />
        </div>

        {/* Department */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormInput
            label="Department"
            name="department"
            type="text"
            value={formik.values.department}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.department && formik.errors.department ? formik.errors.department : undefined}
            placeholder="Enter department"
          />
        </div>
      </form>
    </Dialog>
  );
}
