import { useEffect, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Dialog, { CenterDialog } from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { ApiLead, LeadLabel } from './types';
import { getFileIcon } from '@/utills/utill';
import { Download, Eye, Trash } from 'lucide-react';
import FormInput from '../ui/Input';
import { FormSelect, FormMultiSelect } from '../ui/FormSelect';

interface DropdownItem { _id: string; name?: string; fullName?: string; }

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
  const [sources, setSources] = useState<DropdownItem[]>([]);
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [staff, setStaff] = useState<DropdownItem[]>([]);
  const [labels, setLabels] = useState<LeadLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachmentsFiles, setAttachmentsFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<Set<string>>(new Set());

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    attachment: Attachment | null;
  }>({ isOpen: false, attachment: null });

  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  useEffect(() => {
    const loadRequiredFields = () => {
      const saved = localStorage.getItem('leadRequiredFields');
      if (saved) {
        try {
          setRequiredFields(JSON.parse(saved));
        } catch (e) {
          setRequiredFields(['fullName', 'contact', 'email', 'leadSource', 'leadStatus', 'assignedTo']);
        }
      } else {
        setRequiredFields(['fullName', 'contact', 'email', 'leadSource', 'leadStatus', 'assignedTo']);
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
      companyName: Yup.string(),
      address: Yup.string().max(500, 'Address must not exceed 500 characters'),
      contact: Yup.string()
        .matches(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must not exceed 20 digits'),
      email: Yup.string()
        .email('Invalid email format')
        .max(100, 'Email must not exceed 100 characters'),
      leadSource: Yup.string(),
      leadStatus: Yup.string(),
      assignedTo: Yup.string(),
      labels: Yup.array().of(Yup.string()),
      priority: Yup.string().oneOf(['high', 'medium', 'low']),
      isActive: Yup.boolean(),
    };

    if (requiredFields.includes('fullName')) shape.fullName = shape.fullName.required('Full Name is required');
    if (requiredFields.includes('companyName')) shape.companyName = Yup.string().required('Company Name is required');
    if (requiredFields.includes('address')) shape.address = Yup.string().required('Address is required').max(500, 'Address must not exceed 500 characters');
    if (requiredFields.includes('contact')) shape.contact = shape.contact.required('Phone number is required');
    if (requiredFields.includes('email')) shape.email = shape.email.required('Email is required');
    if (requiredFields.includes('leadSource')) shape.leadSource = Yup.string().required('Please select a source');
    if (requiredFields.includes('leadStatus')) shape.leadStatus = Yup.string().required('Please select a status');
    if (requiredFields.includes('assignedTo')) shape.assignedTo = Yup.string().required('Please assign staff');
    if (requiredFields.includes('labels')) shape.labels = Yup.array().min(1, 'Please select at least one label').required();
    if (requiredFields.includes('priority')) shape.priority = Yup.string().required('Priority is required');

    return Yup.object().shape(shape);
  }, [requiredFields]);

  const token = getAuthToken;

  const formik = useFormik({
    initialValues: {
      fullName: '',
      companyName: '',
      address: '',
      contact: '',
      email: '',
      leadSource: '',
      leadStatus: '',
      assignedTo: '',
      labels: [] as string[],
      priority: 'medium' as 'high' | 'medium' | 'low',
      isActive: true,
    },
    validationSchema: leadValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        const hasFiles = attachmentsFiles.length > 0;
        const payload: any = {
          fullName: values.fullName.trim(),
          companyName: values.companyName.trim(),
          address: values.address.trim(),
          contact: values.contact.trim(),
          email: values.email.trim().toLowerCase(),
          leadSource: values.leadSource,
          leadStatus: values.leadStatus,
          assignedTo: values.assignedTo,
          leadLabel: values.labels,
          priority: values.priority,
          isActive: values.isActive,
        };

        const headers = {
          Authorization: `Bearer ${token()}`,
          ...(hasFiles ? {} : { 'Content-Type': 'application/json' }),
        };

        let body: any = payload;
        if (hasFiles) {
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => {
            if (v !== null && v !== undefined) {
              if (Array.isArray(v)) {
                v.forEach((item) => fd.append(`${k}[]`, String(item)));
              } else {
                fd.append(k, String(v));
              }
            }
          });
          attachmentsFiles.forEach((f) => fd.append('attachments', f));
          body = fd;
        }

        if (mode === 'add') {
          const res = await axios.post(baseUrl.addLead, body, { headers });
          toast.success('Lead created successfully!');
          onLeadCreated?.(res.data?.data ?? res.data);
        } else {
          if (!initialData?._id) throw new Error('Missing lead ID');
          const res = await axios.put(`${baseUrl.updateLead}/${initialData._id}`, body, { headers });
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
    const fetchDropdowns = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token()}` };
        const [srcRes, stRes, staffRes, labRes] = await Promise.all([
          axios.get(baseUrl.leadSources, { headers }),
          axios.get(baseUrl.leadStatuses, { headers }),
          axios.get(baseUrl.getAllStaff, { headers }),
          axios.get(baseUrl.leadLabels, { headers }),
        ]);
        setSources(srcRes.data?.data || []);
        setStatuses(stRes.data?.data || []);
        setStaff(staffRes.data?.data || []);
        setLabels(labRes.data?.data || []);
      } catch {
        formik.setStatus('Failed to load options');
      } finally {
        setLoading(false);
      }
    };
    fetchDropdowns();

    if (mode === 'edit' && initialData) {
      const labelIds = (initialData.leadLabel || []).map((l: any) =>
        typeof l === 'string' ? l : l._id
      );
      formik.setValues({
        fullName: initialData.fullName || '',
        companyName: initialData.companyName || '',
        address: initialData.address || '',
        contact: initialData.contact || '',
        email: initialData.email || '',
        leadSource: initialData.leadSource?._id || '',
        leadStatus: initialData.leadStatus?._id || '',
        assignedTo: initialData.assignedTo?._id || '',
        labels: labelIds,
        priority: ((initialData.priority || 'medium').toLowerCase()) as 'high' | 'medium' | 'low',
        isActive: initialData.isActive ?? true,
      });
      setExistingAttachments(initialData.attachments || []);
      setAttachmentsFiles([]);
      setDeletingAttachmentIds(new Set());
    } else {
      formik.resetForm();
      setExistingAttachments([]);
      setAttachmentsFiles([]);
      setDeletingAttachmentIds(new Set());
    }
    formik.setStatus(null);
  }, [isOpen, mode, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachmentsFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveNewFile = (index: number) => {
    setAttachmentsFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingAttachment = (attachment: Attachment) => {
    setDeleteConfirmation({ isOpen: true, attachment });
  };

  const confirmDeleteAttachment = async () => {
    const attachment = deleteConfirmation.attachment;
    if (!attachment || !initialData?._id) {
      setDeleteConfirmation({ isOpen: false, attachment: null });
      return;
    }

    const attachmentId = attachment._id || attachment.path;
    setDeletingAttachmentIds(prev => new Set(prev).add(attachmentId));

    try {
      await axios.delete(
        `${baseUrl.updateLead}/${initialData._id}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setExistingAttachments(prev => prev.filter(a => (a._id || a.path) !== attachmentId));
      toast.success('Attachment deleted successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete attachment';
      toast.error(msg);
    } finally {
      setDeletingAttachmentIds(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
      setDeleteConfirmation({ isOpen: false, attachment: null });
    }
  };

  const handleViewAttachment = (attachment: Attachment) => {
    const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${attachment.path}`;
    window.open(fileUrl, '_blank');
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${attachment.path}`;
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Byte';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const labelOptions = labels.map((l) => ({ value: l._id, label: l.name, color: l.color }));

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

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Full Name"
                name="fullName"
                type="text"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('fullName')}
                placeholder="Full Name"
                required={requiredFields.includes('fullName')}
              />
              <FormInput
                label="Company Name"
                name="companyName"
                type="text"
                value={formik.values.companyName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('companyName')}
                placeholder="Company"
                required={requiredFields.includes('companyName')}
              />
            </div>

            {/* Address */}
            <FormInput
              label="Address"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('address')}
              placeholder="Address"
              required={requiredFields.includes('address')}
              as="textarea"
            />

            {/* Contact & Email */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Phone"
                name="contact"
                type="text"
                value={formik.values.contact}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('contact')}
                placeholder="Phone"
                required={requiredFields.includes('contact')}
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('email')}
                placeholder="Email"
                required={requiredFields.includes('email')}
              />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Source"
                name="leadSource"
                value={formik.values.leadSource}
                onChange={(val) => { formik.setFieldValue('leadSource', val); formik.setFieldTouched('leadSource', true, false); }}
                onBlur={() => formik.setFieldTouched('leadSource')}
                options={sources.map((s) => ({ value: s._id, label: s.name! }))}
                error={getFieldError('leadSource')}
                placeholder="— Select Source —"
                required={requiredFields.includes('leadSource')}
              />
              <FormSelect
                label="Status"
                name="leadStatus"
                value={formik.values.leadStatus}
                onChange={(val) => { formik.setFieldValue('leadStatus', val); formik.setFieldTouched('leadStatus', true, false); }}
                onBlur={() => formik.setFieldTouched('leadStatus')}
                options={statuses.map((s) => ({ value: s._id, label: s.name! }))}
                error={getFieldError('leadStatus')}
                placeholder="— Select Status —"
                required={requiredFields.includes('leadStatus')}
              />
              <FormSelect
                label="Assigned Staff"
                name="assignedTo"
                value={formik.values.assignedTo}
                onChange={(val) => { formik.setFieldValue('assignedTo', val); formik.setFieldTouched('assignedTo', true, false); }}
                onBlur={() => formik.setFieldTouched('assignedTo')}
                options={staff.map((s) => ({ value: s._id, label: s.fullName || s.name! }))}
                error={getFieldError('assignedTo')}
                placeholder="— Select Staff —"
                required={requiredFields.includes('assignedTo')}
              />
              <FormSelect
                label="Priority"
                name="priority"
                value={formik.values.priority}
                onChange={(val) => { formik.setFieldValue('priority', val); formik.setFieldTouched('priority', true, false); }}
                onBlur={() => formik.setFieldTouched('priority')}
                options={[
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
                error={getFieldError('priority')}
                required={requiredFields.includes('priority')}
              />
            </div>

            {/* Labels — MultiSelect */}
            <FormMultiSelect
              label="Lead Labels"
              name="labels"
              value={formik.values.labels}
              onChange={(vals) => { formik.setFieldValue('labels', vals); formik.setFieldTouched('labels', true, false); }}
              onBlur={() => formik.setFieldTouched('labels')}
              options={labelOptions}
              error={getFieldError('labels')}
              placeholder="Select labels..."
              required={requiredFields.includes('labels')}
            />

            {/* Last Follow-Up */}


            {/* Attachments */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Attachments</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />

              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Attachments</h4>
                  <ul className="space-y-2">
                    {existingAttachments.map((attachment, i) => {
                      const attachmentId = attachment._id || attachment.path;
                      const isDeleting = deletingAttachmentIds.has(attachmentId);
                      const name = attachment.originalName || attachment.name || 'File';
                      return (
                        <li
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isDeleting
                            ? 'bg-red-50 border-red-200 opacity-60'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="flex-shrink-0">
                              {isDeleting ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                              ) : (
                                <span className="text-gray-500 text-lg">{getFileIcon(name)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate" title={name}>{name}</p>
                              {attachment.size && (
                                <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(attachment.size)}</p>
                              )}
                              {isDeleting && <p className="text-xs text-red-500 mt-0.5">Deleting...</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button type="button" onClick={() => handleViewAttachment(attachment)} disabled={isDeleting}
                              className="p-1.5 cursor-pointer text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDownloadAttachment(attachment)} disabled={isDeleting}
                              className="p-1.5 cursor-pointer text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Download">
                              <Download className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDeleteExistingAttachment(attachment)} disabled={isDeleting}
                              className="p-1.5 cursor-pointer text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Delete">
                              {isDeleting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* New files queued for upload */}
              {attachmentsFiles.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">New Attachments</h4>
                  <ul className="space-y-2">
                    {attachmentsFiles.map((file, i) => (
                      <li key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <span className="text-gray-500 text-lg flex-shrink-0">📎</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveNewFile(i)}
                          className="p-1.5 cursor-pointer text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors ml-4" title="Remove">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

      {/* Custom Delete Confirmation Dialog */}
      <CenterDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, attachment: null })}
      >
        <>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete "
              <span className="font-semibold">
                {deleteConfirmation.attachment?.originalName ||
                  deleteConfirmation.attachment?.name ||
                  'this file'}
              </span>"?
            </p>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeleteConfirmation({ isOpen: false, attachment: null })}
              className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" onClick={confirmDeleteAttachment}
              className="rounded-lg cursor-pointer bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Delete
            </button>
          </div>
        </>
      </CenterDialog>
    </>
  );
}