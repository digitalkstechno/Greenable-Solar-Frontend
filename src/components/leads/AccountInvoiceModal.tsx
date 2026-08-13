import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, Upload, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import FormSelect from '@/components/ui/FormSelect';

interface AccountInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSaved?: () => void;
}

interface CustomFileInputProps {
  label: string;
  file: File | null;
  existingFile?: any;
  onFileChange: (file: File | null) => void;
  isPdf?: boolean;
}

function CustomFileInput({ label, file, existingFile, onFileChange, isPdf = true }: CustomFileInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
        {label}
      </label>
      <label className="group flex items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-3 hover:border-[#D87611] hover:bg-amber-50/30 transition">
        <div className="flex-shrink-0 rounded-lg bg-[#D87611]/10 p-2 text-[#D87611] group-hover:scale-105 transition">
          {isPdf ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {file ? (
            <p className="text-xs font-bold text-emerald-600 truncate">{file.name}</p>
          ) : existingFile?.originalName || existingFile?.url ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 truncate">{existingFile.originalName || 'Existing Document'}</span>
              <a
                href={existingFile.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-[#D87611] underline hover:text-[#b0590b] ml-2"
              >
                View File
              </a>
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-400">Click to choose image or PDF file</p>
          )}
        </div>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>
    </div>
  );
}

export function AccountInvoiceModal({ isOpen, onClose, lead, onSaved }: AccountInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [makeInvoice, setMakeInvoice] = useState('no');
  const [consumerFile, setConsumerFile] = useState('PENDING');
  const [docInvoice, setDocInvoice] = useState<File | null>(null);
  const [docWarrantyCertificate, setDocWarrantyCertificate] = useState<File | null>(null);
  const [existingInvoiceDoc, setExistingInvoiceDoc] = useState<any>(null);
  const [existingWarrantyDoc, setExistingWarrantyDoc] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !lead?._id) {
      setDocInvoice(null);
      setDocWarrantyCertificate(null);
      setExistingInvoiceDoc(null);
      setExistingWarrantyDoc(null);
      return;
    }
    setLoading(true);
    const token = getAuthToken();
    axios
      .get(`${baseUrl.projectDetail}/${lead._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const d = res.data?.data;
        if (d) {
          setMakeInvoice(d.makeInvoice || 'no');
          setConsumerFile(d.consumerFile || 'PENDING');
          setExistingInvoiceDoc(d.docInvoice || null);
          setExistingWarrantyDoc(d.docWarrantyCertificate || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, lead?._id]);

  if (!isOpen || !lead) return null;

  const projectDetail = lead.projectDetail || {};
  const projectAmt = projectDetail.projectAmount || lead.projectAmount || 0;
  const pendingAmt = lead.pendingAmount !== undefined ? lead.pendingAmount : projectAmt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append('makeInvoice', makeInvoice);
      fd.append('consumerFile', consumerFile);
      fd.append('currentDepartment', 'Account Department');

      if (docInvoice) fd.append('docInvoice', docInvoice);
      if (docWarrantyCertificate) fd.append('docWarrantyCertificate', docWarrantyCertificate);

      await axios.post(`${baseUrl.projectDetail}/${lead._id}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Invoice details saved successfully!');
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save invoice details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#D87611] via-[#c4690e] to-[#a8590b] text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs shadow-inner">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-wide text-white">MAKE INVOICE - ACCOUNT DEPARTMENT</h3>
              <p className="text-xs text-amber-100 font-medium">Upload Invoice & Warranty Certificate for Customer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-amber-100 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#D87611]" />
            <p className="text-sm font-medium">Loading details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Customer Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Customer Name</span>
                <p className="font-bold text-slate-900 truncate">{lead.fullName || projectDetail.customerFullName || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Project Code</span>
                <p className="font-bold text-[#D87611]">{projectDetail.projectCode || lead.projectCode || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Contact Number</span>
                <p className="font-bold text-slate-900">{lead.contact || projectDetail.registerMobileNumber || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Total Project Amount</span>
                <p className="font-bold text-emerald-600">₹{Number(projectAmt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Pending Amount</span>
                <p className="font-bold text-[#D87611]">₹{Number(pendingAmt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Final System KW</span>
                <p className="font-bold text-slate-900">{projectDetail.finalProjectKw || projectDetail.totalKw || lead.kwRequirement || '-'} KW</p>
              </div>
            </div>

            {/* Invoice & Warranty Controls using Custom Project FormSelect */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Make Invoice *"
                name="makeInvoice"
                value={makeInvoice}
                onChange={(val) => setMakeInvoice(val)}
                options={[
                  { value: 'no', label: 'NO' },
                  { value: 'yes', label: 'YES' },
                ]}
              />

              <FormSelect
                label="Consumer File Status"
                name="consumerFile"
                value={consumerFile}
                onChange={(val) => setConsumerFile(val)}
                options={[
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'DONE', label: 'DONE' },
                ]}
              />
            </div>

            {/* Custom File Uploads using Project Design Component */}
            <div className="space-y-4 pt-1">
              <CustomFileInput
                label="Invoice Document"
                file={docInvoice}
                existingFile={existingInvoiceDoc}
                onFileChange={(f) => setDocInvoice(f)}
                isPdf
              />

              <CustomFileInput
                label="Warranty Certificate Document"
                file={docWarrantyCertificate}
                existingFile={existingWarrantyDoc}
                onFileChange={(f) => setDocWarrantyCertificate(f)}
                isPdf
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#D87611] hover:bg-[#c4690e] active:bg-[#a8590b] text-white text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Save Invoice Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
