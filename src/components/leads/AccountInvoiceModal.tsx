import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, Upload, FileText, Loader2, Eye, Download, Zap, Camera, FileCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import FormSelect from '@/components/ui/FormSelect';
import Calendar from '@/components/ui/Calendar';

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
  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/\\/g, '/');
    return `${baseUrl.userLogin.replace('/api/v1/user/login', '')}/${cleanPath.replace(/^\//, '')}`;
  };

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename || 'document')}`;
      window.location.href = proxyUrl;
    } catch (error) {
      console.error('Failed to download file:', error);
      window.open(url, '_blank');
    }
  };

  const fileUrl = existingFile?.url ? getFileUrl(existingFile.url) : '';
  const fileName = existingFile?.originalName || 'document.pdf';

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="group flex flex-1 items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-3 hover:border-[#D87611] hover:bg-amber-50/30 transition">
          <div className="flex-shrink-0 rounded-lg bg-[#D87611]/10 p-2 text-[#D87611] group-hover:scale-105 transition duration-200">
            {isPdf ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            {file ? (
              <p className="text-xs font-bold text-emerald-600 truncate">{file.name}</p>
            ) : existingFile ? (
              <span className="text-xs font-bold text-slate-800 truncate block">
                {existingFile.originalName || 'Existing Document'}
              </span>
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

        {existingFile && (
          <div className="flex gap-2 items-center justify-end">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              title="View File"
              className="flex items-center justify-center p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#D87611] hover:border-[#D87611]/30 hover:bg-amber-50/20 shadow-sm transition duration-200"
            >
              <Eye className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={(e) => handleDownload(e, fileUrl, fileName)}
              title="Download File"
              className="flex items-center justify-center p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#D87611] hover:border-[#D87611]/30 hover:bg-amber-50/20 shadow-sm transition duration-200"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomFormInput({ label, type = 'text', value, onChange, placeholder }: any) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#D87611] focus:outline-hidden transition"
      />
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

  // Detail fields
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'meter' | 'finalData' | 'photos'>('meter');

  // Meter states
  const [meterFileMakeDate, setMeterFileMakeDate] = useState('');
  const [meterFileRegDate, setMeterFileRegDate] = useState('');
  const [meterFileMakePersonName, setMeterFileMakePersonName] = useState('');
  const [dcrReportNo, setDcrReportNo] = useState('');
  const [dcrDate, setDcrDate] = useState('');
  const [docDcrReport, setDocDcrReport] = useState<File | null>(null);
  const [existingDcrReport, setExistingDcrReport] = useState<any>(null);

  // Final Data states
  const [finalPanelMake, setFinalPanelMake] = useState('');
  const [finalPanelWp, setFinalPanelWp] = useState('');
  const [finalNoOfPanel, setFinalNoOfPanel] = useState('');
  const [finalProjectKw, setFinalProjectKw] = useState('');
  const [finalInverterMake, setFinalInverterMake] = useState('');
  const [finalInverterKw, setFinalInverterKw] = useState('');
  const [docPanelInverterSrNo, setDocPanelInverterSrNo] = useState<File | null>(null);
  const [existingPanelInverterSrNo, setExistingPanelInverterSrNo] = useState<any>(null);

  // Intimation and Subsidy states
  const [intimationDate, setIntimationDate] = useState('');
  const [intimationRejectDate, setIntimationRejectDate] = useState('');
  const [intimationRejectReason, setIntimationRejectReason] = useState('');
  const [meterInstolationDate, setMeterInstolationDate] = useState('');
  const [intimationApprovalDate, setIntimationApprovalDate] = useState('');
  const [subsidyRedeem, setSubsidyRedeem] = useState('no');
  const [subsidyRedeemName, setSubsidyRedeemName] = useState('');
  const [subsidyAmount, setSubsidyAmount] = useState('');
  const [subsidyDisbusmentDate, setSubsidyDisbusmentDate] = useState('');

  // Required photos state
  const [photoSiteOverview, setPhotoSiteOverview] = useState<File | null>(null);
  const [photoPanelSrNo, setPhotoPanelSrNo] = useState<File | null>(null);
  const [photoInverterSrNo, setPhotoInverterSrNo] = useState<File | null>(null);
  const [photoPanelPlacement, setPhotoPanelPlacement] = useState<File | null>(null);
  const [photoMountingStructure, setPhotoMountingStructure] = useState<File | null>(null);
  const [photoInverterInstalled, setPhotoInverterInstalled] = useState<File | null>(null);
  const [photoAcdbDcdb, setPhotoAcdbDcdb] = useState<File | null>(null);
  const [photoEarthingConnection, setPhotoEarthingConnection] = useState<File | null>(null);
  const [photoCableWiringRoute1, setPhotoCableWiringRoute1] = useState<File | null>(null);
  const [photoCableWiringRoute2, setPhotoCableWiringRoute2] = useState<File | null>(null);
  const [photoCableWiringRoute3, setPhotoCableWiringRoute3] = useState<File | null>(null);
  const [photoEarthingPit, setPhotoEarthingPit] = useState<File | null>(null);
  const [photoJioTagCustomer, setPhotoJioTagCustomer] = useState<File | null>(null);

  // Existing photos state
  const [existingPhotos, setExistingPhotos] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isOpen || !lead?._id) {
      setDocInvoice(null);
      setDocWarrantyCertificate(null);
      setExistingInvoiceDoc(null);
      setExistingWarrantyDoc(null);
      setShowInvoiceDetails(false);
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

          setMeterFileMakeDate(d.meterFileMakeDate || '');
          setMeterFileRegDate(d.meterFileRegDate || '');
          setMeterFileMakePersonName(d.meterFileMakePersonName || '');
          setDcrReportNo(d.dcrReportNo || '');
          setDcrDate(d.dcrDate || '');
          setExistingDcrReport(d.docDcrReport || null);

          setFinalPanelMake(d.finalPanelMake || '');
          setFinalPanelWp(d.finalPanelWp || '');
          setFinalNoOfPanel(d.finalNoOfPanel || '');
          setFinalProjectKw(d.finalProjectKw || '');
          setFinalInverterMake(d.finalInverterMake || '');
          setFinalInverterKw(d.finalInverterKw || '');
          setExistingPanelInverterSrNo(d.docPanelInverterSrNo || null);

          setIntimationDate(d.intimationDate || '');
          setIntimationRejectDate(d.intimationRejectDate || '');
          setIntimationRejectReason(d.intimationRejectReason || '');
          setMeterInstolationDate(d.meterInstolationDate || '');
          setIntimationApprovalDate(d.intimationApprovalDate || '');
          setSubsidyRedeem(d.subsidyRedeem || 'no');
          setSubsidyRedeemName(d.subsidyRedeemName || '');
          setSubsidyAmount(d.subsidyAmount || '');
          setSubsidyDisbusmentDate(d.subsidyDisbusmentDate || '');

          const photoFields = [
            'photoSiteOverview', 'photoPanelSrNo', 'photoInverterSrNo',
            'photoPanelPlacement', 'photoMountingStructure', 'photoInverterInstalled',
            'photoAcdbDcdb', 'photoEarthingConnection', 'photoCableWiringRoute1',
            'photoCableWiringRoute2', 'photoCableWiringRoute3', 'photoEarthingPit',
            'photoJioTagCustomer'
          ];
          const extPhotos: Record<string, any> = {};
          photoFields.forEach(f => {
            if (d[f]) extPhotos[f] = d[f];
          });
          setExistingPhotos(extPhotos);
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

      // Append detailed text fields
      fd.append('meterFileMakeDate', meterFileMakeDate);
      fd.append('meterFileRegDate', meterFileRegDate);
      fd.append('meterFileMakePersonName', meterFileMakePersonName);
      fd.append('dcrReportNo', dcrReportNo);
      fd.append('dcrDate', dcrDate);
      fd.append('finalPanelMake', finalPanelMake);
      fd.append('finalPanelWp', finalPanelWp);
      fd.append('finalNoOfPanel', finalNoOfPanel);
      fd.append('finalProjectKw', finalProjectKw);
      fd.append('finalInverterMake', finalInverterMake);
      fd.append('finalInverterKw', finalInverterKw);
      fd.append('intimationDate', intimationDate);
      fd.append('intimationRejectDate', intimationRejectDate);
      fd.append('intimationRejectReason', intimationRejectReason);
      fd.append('meterInstolationDate', meterInstolationDate);
      fd.append('intimationApprovalDate', intimationApprovalDate);
      fd.append('subsidyRedeem', subsidyRedeem);
      fd.append('subsidyRedeemName', subsidyRedeemName);
      fd.append('subsidyAmount', subsidyAmount);
      fd.append('subsidyDisbusmentDate', subsidyDisbusmentDate);

      // Append detailed files
      if (docDcrReport) fd.append('docDcrReport', docDcrReport);
      if (docPanelInverterSrNo) fd.append('docPanelInverterSrNo', docPanelInverterSrNo);

      // Append photo files
      if (photoSiteOverview) fd.append('photoSiteOverview', photoSiteOverview);
      if (photoPanelSrNo) fd.append('photoPanelSrNo', photoPanelSrNo);
      if (photoInverterSrNo) fd.append('photoInverterSrNo', photoInverterSrNo);
      if (photoPanelPlacement) fd.append('photoPanelPlacement', photoPanelPlacement);
      if (photoMountingStructure) fd.append('photoMountingStructure', photoMountingStructure);
      if (photoInverterInstalled) fd.append('photoInverterInstalled', photoInverterInstalled);
      if (photoAcdbDcdb) fd.append('photoAcdbDcdb', photoAcdbDcdb);
      if (photoEarthingConnection) fd.append('photoEarthingConnection', photoEarthingConnection);
      if (photoCableWiringRoute1) fd.append('photoCableWiringRoute1', photoCableWiringRoute1);
      if (photoCableWiringRoute2) fd.append('photoCableWiringRoute2', photoCableWiringRoute2);
      if (photoCableWiringRoute3) fd.append('photoCableWiringRoute3', photoCableWiringRoute3);
      if (photoEarthingPit) fd.append('photoEarthingPit', photoEarthingPit);
      if (photoJioTagCustomer) fd.append('photoJioTagCustomer', photoJioTagCustomer);

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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#D87611] text-white shadow-md">
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
                  <p className="font-bold text-slate-900">{finalProjectKw || projectDetail.finalProjectKw || projectDetail.totalKw || lead.kwRequirement || '-'} KW</p>
                </div>
              </div>

              {/* Invoice & Warranty Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="flex gap-2 items-end w-full">
                  <div className="flex-1">
                    <FormSelect
                      label="Make Invoice *"
                      name="makeInvoice"
                      value={makeInvoice}
                      onChange={(val) => {
                        setMakeInvoice(val);
                        if (val === 'yes') {
                          setShowInvoiceDetails(true);
                        }
                      }}
                      options={[
                        { value: 'no', label: 'NO' },
                        { value: 'yes', label: 'YES' },
                      ]}
                    />
                  </div>
                  {makeInvoice === 'yes' && (
                    <button
                      type="button"
                      onClick={() => setShowInvoiceDetails(true)}
                      className="px-4 py-2 bg-gradient-to-r from-[#D87611] to-[#b35d09] hover:from-[#c4690e] hover:to-[#964f06] text-white rounded-xl font-bold text-xs h-[38px] transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Fill Invoice Details
                    </button>
                  )}
                </div>

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

              {/* Custom File Uploads */}
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

      {/* Invoice Details sub-popup */}
      {showInvoiceDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slide-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#D87611] text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase">Invoice Details & Photos</h3>
                  <p className="text-xs text-amber-100">Fill Meter, System Capacity, Subsidy Details and Upload Installation Photos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceDetails(false)}
                className="p-2 text-amber-100 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs selector */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-sm font-bold">
              <button
                type="button"
                onClick={() => setActiveSubTab('meter')}
                className={`flex-1 py-3 text-center border-b-2 transition ${activeSubTab === 'meter' ? 'border-[#D87611] text-[#D87611] bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Meter File & Subsidy
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('finalData')}
                className={`flex-1 py-3 text-center border-b-2 transition ${activeSubTab === 'finalData' ? 'border-[#D87611] text-[#D87611] bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Final System Capacity Data
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('photos')}
                className={`flex-1 py-3 text-center border-b-2 transition ${activeSubTab === 'photos' ? 'border-[#D87611] text-[#D87611] bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Installation Photos
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Tab 1: Meter File & Subsidy */}
              {activeSubTab === 'meter' && (
                <div className="space-y-6">
                  {/* Meter File */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-800 font-extrabold text-sm uppercase tracking-wider">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span>Meter File Details</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Meter File Make Date</label>
                        <Calendar
                          value={meterFileMakeDate ? new Date(meterFileMakeDate) : null}
                          onChange={(d) => setMeterFileMakeDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Meter File Registration Date</label>
                        <Calendar
                          value={meterFileRegDate ? new Date(meterFileRegDate) : null}
                          onChange={(d) => setMeterFileRegDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                      <CustomFormInput
                        label="Meter File Make Person Name"
                        value={meterFileMakePersonName}
                        onChange={(e: any) => setMeterFileMakePersonName(e.target.value)}
                        placeholder="Enter name"
                      />
                      <CustomFormInput
                        label="DCR Report No"
                        value={dcrReportNo}
                        onChange={(e: any) => setDcrReportNo(e.target.value)}
                        placeholder="Enter DCR report number"
                      />
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">DCR Date</label>
                        <Calendar
                          value={dcrDate ? new Date(dcrDate) : null}
                          onChange={(d) => setDcrDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                      <CustomFileInput
                        label="DCR Report Document"
                        file={docDcrReport}
                        existingFile={existingDcrReport}
                        onFileChange={(f) => setDocDcrReport(f)}
                        isPdf
                      />
                    </div>
                  </div>

                  {/* Subsidy Info */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-800 font-extrabold text-sm uppercase tracking-wider">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Intimation & Subsidy details</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Intimation Date</label>
                        <Calendar
                          value={intimationDate ? new Date(intimationDate) : null}
                          onChange={(d) => setIntimationDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Intimation Reject Date</label>
                        <Calendar
                          value={intimationRejectDate ? new Date(intimationRejectDate) : null}
                          onChange={(d) => setIntimationRejectDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <CustomFormInput
                          label="Intimation Reject Reason"
                          value={intimationRejectReason}
                          onChange={(e: any) => setIntimationRejectReason(e.target.value)}
                          placeholder="Reason if rejected"
                        />
                      </div>
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Meter Installation Date</label>
                        <Calendar
                          value={meterInstolationDate ? new Date(meterInstolationDate) : null}
                          onChange={(d) => setMeterInstolationDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Intimation Approval Date</label>
                        <Calendar
                          value={intimationApprovalDate ? new Date(intimationApprovalDate) : null}
                          onChange={(d) => setIntimationApprovalDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                      <FormSelect
                        label="Subsidy Redeem"
                        name="subsidyRedeem"
                        value={subsidyRedeem}
                        onChange={(val) => setSubsidyRedeem(val)}
                        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                      />
                      <CustomFormInput
                        label="Subsidy Redeem Name"
                        value={subsidyRedeemName}
                        onChange={(e: any) => setSubsidyRedeemName(e.target.value)}
                        placeholder="Enter name"
                      />
                      <CustomFormInput
                        label="Subsidy Amount"
                        type="number"
                        value={subsidyAmount}
                        onChange={(e: any) => setSubsidyAmount(e.target.value)}
                        placeholder="e.g. 78000"
                      />
                      <div className="w-full relative space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Subsidy Disbursement Date</label>
                        <Calendar
                          value={subsidyDisbusmentDate ? new Date(subsidyDisbusmentDate) : null}
                          onChange={(d) => setSubsidyDisbusmentDate(d ? d.toISOString().split('T')[0] : '')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Final System Data */}
              {activeSubTab === 'finalData' && (
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-800 font-extrabold text-sm uppercase tracking-wider">
                    <Zap className="h-4 w-4 text-[#D87611]" />
                    <span>AFTER INSTALLATION FINAL SYSTEM DATA</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomFormInput
                      label="Panel Make"
                      value={finalPanelMake}
                      onChange={(e: any) => setFinalPanelMake(e.target.value)}
                      placeholder="e.g. Waaree"
                    />
                    <CustomFormInput
                      label="Panel WP"
                      type="number"
                      value={finalPanelWp}
                      onChange={(e: any) => {
                        const wp = e.target.value;
                        const count = finalNoOfPanel;
                        const kw = (wp && count) ? ((Number(wp) * Number(count)) / 1000).toFixed(2) : finalProjectKw;
                        setFinalPanelWp(wp);
                        setFinalProjectKw(kw);
                      }}
                      placeholder="e.g. 540"
                    />
                    <CustomFormInput
                      label="No of Panel"
                      type="number"
                      value={finalNoOfPanel}
                      onChange={(e: any) => {
                        const count = e.target.value;
                        const wp = finalPanelWp;
                        const kw = (wp && count) ? ((Number(wp) * Number(count)) / 1000).toFixed(2) : finalProjectKw;
                        setFinalNoOfPanel(count);
                        setFinalProjectKw(kw);
                      }}
                      placeholder="e.g. 6"
                    />
                    <CustomFormInput
                      label="Final Project KW"
                      type="number"
                      value={finalProjectKw}
                      onChange={(e: any) => setFinalProjectKw(e.target.value)}
                      placeholder="Final capacity in KW"
                    />
                    <CustomFormInput
                      label="Inverter Make"
                      value={finalInverterMake}
                      onChange={(e: any) => setFinalInverterMake(e.target.value)}
                      placeholder="e.g. Solis"
                    />
                    <CustomFormInput
                      label="Inverter KW"
                      type="number"
                      value={finalInverterKw}
                      onChange={(e: any) => setFinalInverterKw(e.target.value)}
                      placeholder="Inverter capacity in KW"
                    />
                    <div className="md:col-span-2">
                      <CustomFileInput
                        label="Panel & Inverter SR No Document"
                        file={docPanelInverterSrNo}
                        existingFile={existingPanelInverterSrNo}
                        onFileChange={(f) => setDocPanelInverterSrNo(f)}
                        isPdf
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Installation Photos */}
              {activeSubTab === 'photos' && (
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-800 font-extrabold text-sm uppercase tracking-wider">
                    <Camera className="h-4 w-4 text-[#D87611]" />
                    <span>Upload Installation Site Photos</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CustomFileInput
                      label="Site Overview Photo"
                      file={photoSiteOverview}
                      existingFile={existingPhotos.photoSiteOverview}
                      onFileChange={setPhotoSiteOverview}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Panel SR No Photo / PDF"
                      file={photoPanelSrNo}
                      existingFile={existingPhotos.photoPanelSrNo}
                      onFileChange={setPhotoPanelSrNo}
                      isPdf={true}
                    />
                    <CustomFileInput
                      label="Inverter SR No Photo"
                      file={photoInverterSrNo}
                      existingFile={existingPhotos.photoInverterSrNo}
                      onFileChange={setPhotoInverterSrNo}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Panel Placement Photo"
                      file={photoPanelPlacement}
                      existingFile={existingPhotos.photoPanelPlacement}
                      onFileChange={setPhotoPanelPlacement}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Mounting Structure Photo"
                      file={photoMountingStructure}
                      existingFile={existingPhotos.photoMountingStructure}
                      onFileChange={setPhotoMountingStructure}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Inverter Installed Photo"
                      file={photoInverterInstalled}
                      existingFile={existingPhotos.photoInverterInstalled}
                      onFileChange={setPhotoInverterInstalled}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="ACDB / DCDB Photo"
                      file={photoAcdbDcdb}
                      existingFile={existingPhotos.photoAcdbDcdb}
                      onFileChange={setPhotoAcdbDcdb}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Earthing Connection Photo"
                      file={photoEarthingConnection}
                      existingFile={existingPhotos.photoEarthingConnection}
                      onFileChange={setPhotoEarthingConnection}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Cable & Wiring Route Photo 1"
                      file={photoCableWiringRoute1}
                      existingFile={existingPhotos.photoCableWiringRoute1}
                      onFileChange={setPhotoCableWiringRoute1}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Cable & Wiring Route Photo 2"
                      file={photoCableWiringRoute2}
                      existingFile={existingPhotos.photoCableWiringRoute2}
                      onFileChange={setPhotoCableWiringRoute2}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Cable & Wiring Route Photo 3"
                      file={photoCableWiringRoute3}
                      existingFile={existingPhotos.photoCableWiringRoute3}
                      onFileChange={setPhotoCableWiringRoute3}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="Earthing Pit Photo"
                      file={photoEarthingPit}
                      existingFile={existingPhotos.photoEarthingPit}
                      onFileChange={setPhotoEarthingPit}
                      isPdf={false}
                    />
                    <CustomFileInput
                      label="JIO Tag Customer Photo"
                      file={photoJioTagCustomer}
                      existingFile={existingPhotos.photoJioTagCustomer}
                      onFileChange={setPhotoJioTagCustomer}
                      isPdf={false}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowInvoiceDetails(false)}
                className="px-6 py-2.5 rounded-xl bg-[#D87611] hover:bg-[#c4690e] text-white font-bold text-sm transition shadow-xs cursor-pointer"
              >
                Keep details / Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
