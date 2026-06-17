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
import { FileText, Download } from 'lucide-react';
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
  onLeadCreated?: (lead: any) => void;
  onLeadUpdated?: (lead: any) => void;
}

// Static schema removed - moved inside component for dynamic required fields

export default function LeadAddDialog({
  isOpen, onClose, mode, initialData,
  onLeadCreated, onLeadUpdated,
}: Props) {
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [staff, setStaff] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [quotationOpen, setQuotationOpen] = useState(false);

  const [requiredFields, setRequiredFields] = useState<string[]>([]);

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
        .matches(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must not exceed 20 digits'),
      email: Yup.string()
        .email('Invalid email format')
        .max(100, 'Email must not exceed 100 characters'),
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

    if (requiredFields.includes('fullName')) shape.fullName = shape.fullName.required('Full Name is required');
    if (requiredFields.includes('contact')) shape.contact = shape.contact.required('Mobile Number is required');
    if (requiredFields.includes('leadStatus')) shape.leadStatus = Yup.string().required('Please select a stage');
    if (requiredFields.includes('assignedTo')) shape.assignedTo = Yup.string().required('Please assign a sales executive');

    return Yup.object().shape(shape);
  }, [requiredFields]);

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
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
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
          assignedTo: values.assignedTo,
          isActive: values.isActive,
        };

        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          formData.append(key, payload[key]);
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
        setStatus(msg);
        toast.error(msg);
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
          const [stRes, staffRes, deptRes, leadRes] = await Promise.all([
            axios.get(baseUrl.leadStatuses, { headers }),
            axios.get(baseUrl.getAllUsers, { headers }),
            axios.get(baseUrl.department, { headers }),
            axios.get(`${baseUrl.findLeadById}/${initialData._id}`, { headers })
          ]);
          setStatuses(stRes.data?.data || []);
          const depts = deptRes.data?.data || [];
          const users = staffRes.data?.data || [];
          const usersWithDepts = users.map((u: any) => {
            const d = depts.find((dept: any) => dept._id === u.department);
            return { ...u, departmentName: d ? (d.roleName || d.name) : '' };
          });
          setStaff(usersWithDepts);
          leadData = leadRes.data?.data;
        } else {
          const [stRes, staffRes, deptRes] = await Promise.all([
            axios.get(baseUrl.leadStatuses, { headers }),
            axios.get(baseUrl.getAllUsers, { headers }),
            axios.get(baseUrl.department, { headers })
          ]);
          setStatuses(stRes.data?.data || []);
          const depts = deptRes.data?.data || [];
          const users = staffRes.data?.data || [];
          const usersWithDepts = users.map((u: any) => {
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
              assignedTo: typeof dataToUse.assignedTo === 'string' ? dataToUse.assignedTo : (dataToUse.assignedTo?._id || ''),
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
              disabled={formik.isSubmitting || loading || !formik.isValid}
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
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('fullName')}
                required={requiredFields.includes('fullName')}
              />
              <FormInput
                label="Mobile Number"
                name="contact"
                type="text"
                value={formik.values.contact}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('contact')}
                required={requiredFields.includes('contact')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('email')}
                required={requiredFields.includes('email')}
              />
              <FormInput
                label="KW Requirement"
                name="kwRequirement"
                type="text"
                value={formik.values.kwRequirement}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('kwRequirement')}
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
                label="Lead Refrance"
                name="leadrefrance"
                value={formik.values.leadrefrance || ''}
                onChange={(val) => { formik.setFieldValue('leadrefrance', val); }}
                onBlur={() => formik.setFieldTouched('leadrefrance')}
                options={[
                  { value: 'like', label: 'Link' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'data', label: 'Data' },
                ]}
                error={getFieldError('leadrefrance')}
                placeholder="Select Lead Refrance"
              />
            </div>

            <FormInput
              label="Address"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('address')}
              as="textarea"
            />

            <FormInput
              label="Location Link"
              name="locationLink"
              value={formik.values.locationLink}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('locationLink')}
              as="textarea"
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
                required={requiredFields.includes('leadStatus')}
              />
              <FormSelect
                label="User (For Assign)"
                name="assignedTo"
                value={formik.values.assignedTo}
                onChange={(val) => { formik.setFieldValue('assignedTo', val); }}
                onBlur={() => formik.setFieldTouched('assignedTo')}
                options={staff.map((s) => ({ value: s._id, label: `${s.fullName || s.name!}${s.departmentName ? ` (${s.departmentName})` : ''}` }))}
                error={getFieldError('assignedTo')}
                placeholder="Select User"
                required={requiredFields.includes('assignedTo')}
              />
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
                ]}
                error={getFieldError('projecttype')}
                placeholder="Select Lead Refrance"
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