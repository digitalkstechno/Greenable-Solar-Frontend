import { useEffect, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { ApiLead } from './types';
import FormInput from '../ui/Input';
import { FormSelect } from '../ui/FormSelect';
import { FileText, Download, AlertCircle } from 'lucide-react';
import LeadQuotationDialog from './LeadQuotationDialog';

interface DropdownItem { _id: string; name?: string; fullName?: string; departmentName?: string; }

interface Attachment {
  _id?: string;
  name?: string;
  originalName?: string;
  path: string;
  size?: number;
  mimeType?: string;
  filename?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData?: ApiLead | null;
  currentUser?: any;
  onLeadCreated?: (lead: any) => void;
  onLeadUpdated?: (lead: any) => void;
}

// Static schema removed - moved inside component for dynamic required fields

export default function LeadAddDialog({
  isOpen, onClose, mode, initialData,
  currentUser,
  onLeadCreated, onLeadUpdated,
}: Props) {
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [staff, setStaff] = useState<DropdownItem[]>([]);
  const [leadSources, setLeadSources] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [quotationOpen, setQuotationOpen] = useState(false);

  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  const isSalesExecutive = ['sales executive', 'sales'].includes(currentUser?.role?.name?.toLowerCase()) || ['sales executive', 'sales'].includes(currentUser?.role?.roleName?.toLowerCase());

  useEffect(() => {
    const loadRequiredFields = () => {
      const saved = localStorage.getItem('leadRequiredFields');
      if (saved) {
        try {
          setRequiredFields(JSON.parse(saved));
        } catch (e) {
          setRequiredFields(['fullName', 'contact', 'leadStatus', 'assignedTo']);
        }
      } else {
        setRequiredFields(['fullName', 'contact', 'leadStatus', 'assignedTo']);
      }
    };

    loadRequiredFields();
    window.addEventListener('fieldSettingsUpdated', loadRequiredFields);
    return () => window.removeEventListener('fieldSettingsUpdated', loadRequiredFields);
  }, []);

  const leadValidationSchema = useMemo(() => {
    let shape: any = {
      fullName: Yup.string()
        .min(2, 'Full Name must be at least 2 characters')
        .max(100, 'Full Name must not exceed 100 characters'),
      contact: Yup.string()
        .matches(/^\d+$/, 'Only numbers allowed')
        .length(10, 'Mobile number must be exactly 10 digits'),
      email: Yup.string()
        .email('Invalid email format')
        .max(50, 'Email must not exceed 50 characters')
        .matches(
          /^[^\s@]+@[^\s@]+\.(com|in|ac\.in|org|net|edu|co\.in)$/i,
          'Invalid email format'
        ),
      kwRequirement: Yup.string(),
      discomName: Yup.string(),
      leadrefrance: Yup.string(),
      projecttype: Yup.string(),
      address: Yup.string().max(500, 'Address must not exceed 500 characters'),
      locationLink: Yup.string(),
      leadStatus: Yup.string(),
      assignedTo: Yup.string(),
      isActive: Yup.boolean(),
    };

    shape.fullName = shape.fullName.required('Full Name is required');
    shape.contact = shape.contact.required('Mobile Number is required');
    shape.email = shape.email.required('Email is required');
    shape.kwRequirement = shape.kwRequirement.required('KW Requirement is required');
    shape.leadStatus = Yup.string().required('Please select a stage');
    shape.leadrefrance = Yup.string().required('Lead Source is required');
    if (!isSalesExecutive) {
      shape.assignedTo = Yup.string().required('Please assign a user');
    }

    return Yup.object().shape(shape);
  }, [isSalesExecutive]);

  const isInitiallyWon = useMemo(() => {
    if (mode !== 'edit' || !initialData) return false;
    if (initialData.isWon) return true;
    const statusId = typeof initialData.leadStatus === 'string'
      ? initialData.leadStatus
      : (initialData.leadStatus as any)?._id;
    return statuses.find(s => s._id === statusId)?.name?.match(/^won$/i) != null;
  }, [mode, initialData, statuses]);

  const token = getAuthToken;

  const formik = useFormik({
    initialValues: {
      fullName: '',
      contact: '',
      email: '',
      kwRequirement: '',
      discomName: '',
      leadrefrance: '',
      projecttype: '',
      address: '',
      locationLink: '',
      leadStatus: '',
      assignedTo: '',
      isActive: true,
    },
    validationSchema: leadValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus, setErrors }) => {
      setStatus(null);
      try {
        const assignedTo = values.assignedTo || (mode === 'add' ? String(currentUser?._id || '') : '');
        const payload: any = {
          fullName: values.fullName.trim(),
          contact: values.contact.trim(),
          email: values.email.trim().toLowerCase(),
          kwRequirement: values.kwRequirement.trim(),
          discomName: values.discomName,
          leadrefrance: values.leadrefrance,
          projecttype: values.projecttype,
          address: values.address.trim(),
          locationLink: values.locationLink.trim(),
          leadStatus: values.leadStatus,
          assignedTo: assignedTo || undefined,
          isActive: values.isActive,
        };

        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          const val = payload[key];
          if (val !== null && val !== undefined && val !== '') {
            formData.append(key, String(val));
          }
        });
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });

        const headers = {
          Authorization: `Bearer ${token()}`,
        };

        if (mode === 'add') {
          const res = await axios.post(baseUrl.addLead, formData, { headers });
          toast.success('Lead created successfully!');
          onLeadCreated?.(res.data?.data ?? res.data);
        } else {
          if (!initialData?._id) throw new Error('Missing lead ID');
          const res = await axios.put(`${baseUrl.updateLead}/${initialData._id}`, formData, { headers });
          toast.success('Lead updated successfully!');
          onLeadUpdated?.(res.data?.data ?? res.data);
        }
        onClose();
      } catch (error: any) {
        const msg = error.response?.data?.message || `Failed to ${mode} lead`;
        if (msg.includes('Mobile Number already exists')) {
          setErrors({ contact: 'Mobile Number already exists' });
        } else if (msg.includes('Email Address already exists')) {
          setErrors({ email: 'Email Address already exists' });
        } else {
          setStatus(msg);
          toast.error(msg);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token()}` };

        let leadData = null;
        if (mode === 'edit' && initialData?._id) {
          const [stRes, staffRes, deptRes, sourceRes, leadRes] = await Promise.all([
            axios.get(baseUrl.leadStatuses, { headers }),
            axios.get(baseUrl.getAllUsers, { headers, params: { limit: 1000 } }),
            axios.get(baseUrl.department, { headers }),
            axios.get(baseUrl.leadSources, { headers }),
            axios.get(`${baseUrl.findLeadById}/${initialData._id}`, { headers })
          ]);
          setStatuses(stRes.data?.data || []);
          setLeadSources(sourceRes.data?.data || []);
          const depts = deptRes.data?.data || [];
          const users = staffRes.data?.data || [];
          const salesExecs = users.filter((u: any) => {
            const r = u.role;
            if (!r) return false;
            const roleName = r.roleName || r.name || (typeof r === 'string' ? r : '');
            return roleName.toLowerCase() === 'sales executive';
          });
          const usersWithDepts = salesExecs.map((u: any) => {
            const d = depts.find((dept: any) => dept._id === u.department);
            return { ...u, departmentName: d ? (d.roleName || d.name) : '' };
          });
          setStaff(usersWithDepts);
          leadData = leadRes.data?.data;
        } else {
          const [stRes, staffRes, deptRes, sourceRes] = await Promise.all([
            axios.get(baseUrl.leadStatuses, { headers }),
            axios.get(baseUrl.getAllUsers, { headers, params: { limit: 1000 } }),
            axios.get(baseUrl.department, { headers }),
            axios.get(baseUrl.leadSources, { headers })
          ]);
          setStatuses(stRes.data?.data || []);
          setLeadSources(sourceRes.data?.data || []);
          const depts = deptRes.data?.data || [];
          const users = staffRes.data?.data || [];
          const salesExecs = users.filter((u: any) => {
            const r = u.role;
            if (!r) return false;
            const roleName = r.roleName || r.name || (typeof r === 'string' ? r : '');
            return roleName.toLowerCase() === 'sales executive';
          });
          const usersWithDepts = salesExecs.map((u: any) => {
            const d = depts.find((dept: any) => dept._id === u.department);
            return { ...u, departmentName: d ? (d.roleName || d.name) : '' };
          });
          setStaff(usersWithDepts);
        }

        if (mode === 'edit') {
          // Fallback to initialData if leadData is somehow missing
          const dataToUse = leadData || initialData;
          if (dataToUse) {
            formik.setValues({
              fullName: dataToUse.fullName || '',
              contact: dataToUse.contact || '',
              email: dataToUse.email || '',
              kwRequirement: dataToUse.kwRequirement || '',
              discomName: dataToUse.discomName || '',
              leadrefrance: dataToUse.leadrefrance || '',
              projecttype: dataToUse.projecttype || '',
              address: dataToUse.address || '',
              locationLink: dataToUse.locationLink || '',
              leadStatus: typeof dataToUse.leadStatus === 'string' ? dataToUse.leadStatus : (dataToUse.leadStatus?._id || ''),
              assignedTo: typeof dataToUse.assignedTo === 'string' ? dataToUse.assignedTo : (dataToUse.assignedTo?._id ? String(dataToUse.assignedTo._id) : ''),
              isActive: dataToUse.isActive ?? true,
            });
          }
        } else {
          formik.resetForm();
        }
      } catch {
        formik.setStatus('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    formik.setStatus(null);
  }, [isOpen, mode, initialData]);

  useEffect(() => {
    if (!isOpen || mode !== 'add') return;
    const creatorId = currentUser?._id || currentUser?.id || '';
    if (creatorId && !formik.values.assignedTo) {
      formik.setFieldValue('assignedTo', String(creatorId));
    }
  }, [isOpen, mode, currentUser, formik]);

  const getFieldError = (fieldName: string) => {
    const isTouched = formik.touched[fieldName as keyof typeof formik.touched];
    const error = formik.errors[fieldName as keyof typeof formik.errors];
    return isTouched && error ? (error as string) : undefined;
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={formik.isSubmitting}
              className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lead-form"
              disabled={!formik.isValid || !formik.dirty || loading}
              className="min-w-[80px] cursor-pointer rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {formik.isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Lead' : 'Save Lead'}
            </button>
          </>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
          </div>
        ) : (
          <form id="lead-form" onSubmit={formik.handleSubmit} className="space-y-4">
            {formik.status && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {formik.status}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Full Name"
                name="fullName"
                type="text"
                placeholder="Rajesh Patel"
                value={formik.values.fullName}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  formik.handleChange(e);
                }}
                onBlur={formik.handleBlur}
                error={getFieldError('fullName')}
                required={requiredFields.includes('fullName')}
                className="uppercase"
              />
              {/* Mobile Number — numeric only, max 10 digits */}
              <div className="w-full mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    name="contact"
                    inputMode="numeric"
                    maxLength={10}
                    value={formik.values.contact}
                    onChange={(e) => {
                      // Strip any non-digit characters
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      formik.setFieldValue('contact', numericOnly);
                    }}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, arrows, home, end
                      const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                      if (allowed.includes(e.key)) return;
                      // Block anything that's not a digit
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    onBlur={formik.handleBlur}
                    placeholder="9876543210"
                    className={`w-full px-3 py-2.5 rounded-xl bg-white/90 text-gray-800 text-sm outline-none transition-all duration-200 border-2 ${formik.touched.contact && formik.errors.contact
                      ? 'border-error ring-2 ring-red-100 focus:border-error focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                  />

                </div>
                {formik.touched.contact && formik.errors.contact && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                    <p className="text-red-500 text-xs">{formik.errors.contact}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Email"
                name="email"
                type="email"
                placeholder="rajesh@gmail.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('email')}
                required={true}
              />
              <FormInput
                label="KW Requirement"
                name="kwRequirement"
                type="text"
                placeholder="5"
                value={formik.values.kwRequirement}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  formik.handleChange(e);
                }}
                onBlur={formik.handleBlur}
                error={getFieldError('kwRequirement')}
                required={true}
                className="uppercase"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Discom Name"
                name="discomName"
                value={formik.values.discomName || ''}
                onChange={(val) => { formik.setFieldValue('discomName', val); }}
                onBlur={() => formik.setFieldTouched('discomName')}
                options={[
                  { value: 'DGVCL', label: 'DGVCL' },
                  { value: 'Torrent Power', label: 'Torrent Power' },
                ]}
                error={getFieldError('discomName')}
                placeholder="Select Discom Name"
              />
              <FormSelect
                label="Lead Source"
                name="leadrefrence"
                required={true}
                value={formik.values.leadrefrance || ''}
                onChange={(val) => { formik.setFieldValue('leadrefrance', val); }}
                onBlur={() => formik.setFieldTouched('leadrefrance')}
                options={leadSources.map(s => ({ value: s.name || '', label: s.name || '' }))}
                error={getFieldError('leadrefrance')}
                placeholder="Select Lead Source"
              />
            </div>

            <FormInput
              label="Address"
              name="address"
              placeholder="215, Escon Plaza, Above SBI Bank, Amroli, Surat"
              value={formik.values.address}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                formik.handleChange(e);
              }}
              onBlur={formik.handleBlur}
              error={getFieldError('address')}
              as="textarea"
              className="uppercase"
            />

            <FormInput
              label="Location Link"
              name="locationLink"
              placeholder="https://maps.app.goo.gl/abc123xyz"
              value={formik.values.locationLink}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                formik.handleChange(e);
              }}
              onBlur={formik.handleBlur}
              error={getFieldError('locationLink')}
              as="textarea"
              className="uppercase"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Stage"
                name="leadStatus"
                value={formik.values.leadStatus}
                onChange={(val) => { formik.setFieldValue('leadStatus', val); }}
                onBlur={() => formik.setFieldTouched('leadStatus')}
                options={statuses.map((s) => ({ value: s._id, label: s.name! }))}
                error={getFieldError('leadStatus')}
                placeholder="Select Stage"
                required={true}
                disabled={isInitiallyWon}
              />
              {!isSalesExecutive && (
                <FormSelect
                  label="User (For Assign)"
                  name="assignedTo"
                  value={formik.values.assignedTo}
                  onChange={(val) => { formik.setFieldValue('assignedTo', val); }}
                  onBlur={() => formik.setFieldTouched('assignedTo')}
                  options={staff.map((s) => ({ value: String(s._id), label: `${s.fullName || s.name!}${s.departmentName ? ` (${s.departmentName})` : ''}` }))}
                  error={getFieldError('assignedTo')}
                  placeholder="Select User"
                  required={true}
                  maxHeight="max-h-44"
                />
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Project Type"
                name="projecttype"
                value={formik.values.projecttype || ''}
                onChange={(val) => { formik.setFieldValue('projecttype', val); }}
                onBlur={() => formik.setFieldTouched('projecttype')}
                options={[
                  { value: 'resident', label: 'Resident' },
                  { value: 'industrial', label: 'Industrial' },
                  { value: 'commercial', label: 'Commercial' },
                  { value: 'industrial', label: 'Industrial' },

                ]}
                error={getFieldError('projecttype')}
                placeholder="Select Project Type"
              />
            </div>

            {/* Active */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formik.values.isActive}
                onChange={formik.handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Active Lead</span>
            </label>
          </form>
        )}
      </Dialog>
    </>

  );
}