import React, { useState, useEffect } from 'react';
import { X, CheckCircle, FileText, ExternalLink, FileIcon } from 'lucide-react';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead } from './types';

interface LeadDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ApiLead | null;
}

const REG_DOC_FIELDS = [
  { key: 'docLatestLightBill', label: 'Latest light bill' },
  { key: 'docLatestTaxBill', label: 'Latest tax bill' },
  { key: 'docCancelCheck', label: 'Cancel check' },
  { key: 'docPanCard', label: 'PAN card' },
  { key: 'docAadhaarCard', label: 'Aadhaar card' },
];

const LOAN_DOC_FIELDS = [
  { key: 'loanDocQuotation', label: 'Quotation' },
  { key: 'loanDocBankStatement', label: 'Six month bank statement' },
  { key: 'loanDocITRReturn', label: 'Three years, ITR return' },
  { key: 'loanDocPanCard', label: 'PAN card (Loan)' },
  { key: 'loanDocAadhaarCard', label: 'Aadhaar card (Loan)' },
];

export default function LeadDocumentsDialog({ isOpen, onClose, lead }: LeadDocumentsDialogProps) {
  const [activeTab, setActiveTab] = useState<'reg' | 'loan' | 'other'>('reg');
  const [loading, setLoading] = useState(false);
  const [regDocs, setRegDocs] = useState<{ label: string; file: any }[]>([]);
  const [loanDocs, setLoanDocs] = useState<{ label: string; file: any }[]>([]);
  const [otherDocs, setOtherDocs] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !lead) return;

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const res = await axios.get(`${baseUrl.projectDetail}/${lead._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data?.data;

        const reg: { label: string; file: any }[] = [];
        const loan: { label: string; file: any }[] = [];

        if (d) {
          REG_DOC_FIELDS.forEach((field) => {
            if (d[field.key]) {
              reg.push({ label: field.label, file: d[field.key] });
            }
          });
          LOAN_DOC_FIELDS.forEach((field) => {
            if (d[field.key]) {
              loan.push({ label: field.label, file: d[field.key] });
            }
          });
        }

        setRegDocs(reg);
        setLoanDocs(loan);
        setOtherDocs(lead.attachments || []);
      } catch (err) {
        console.error('Failed to fetch project details for docs', err);
        setRegDocs([]);
        setLoanDocs([]);
        setOtherDocs(lead.attachments || []);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const getDocsByTab = () => {
    if (activeTab === 'reg') return regDocs;
    if (activeTab === 'loan') return loanDocs;
    return otherDocs.map((doc, idx) => ({
      label: doc.originalName || doc.filename || `Attachment ${idx + 1}`,
      file: doc,
    }));
  };

  const displayDocs = getDocsByTab();

  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrlWithoutApi = baseUrl.userLogin.replace('/api/v1/user/login', '');
    return `${baseUrlWithoutApi}/${path.replace(/\\/g, '/')}`;
  };

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.preventDefault();
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename || 'document')}`;
      window.location.href = proxyUrl;
    } catch (error) {
      console.error('Failed to download file:', error);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Project Documents
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Viewing documents for <span className="font-semibold text-gray-700">{lead.fullName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex px-5 pt-3 gap-6 border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('reg')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'reg' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Registration Docs ({regDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('loan')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'loan' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Loan Docs ({loanDocs.length})
          </button>
          {otherDocs.length > 0 && (
            <button
              onClick={() => setActiveTab('other')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'other' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Other Attachments ({otherDocs.length})
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1 relative min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e9d8f4] border-t-primary shadow-sm" />
                <span className="text-sm font-semibold text-primary animate-pulse">Loading documents...</span>
              </div>
            </div>
          ) : displayDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center h-full bg-white rounded-xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <FileIcon className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">No Documents Found</h3>
              <p className="text-gray-500 max-w-sm mt-2 text-sm leading-relaxed">
                {`No ${activeTab === 'reg' ? 'registration' : activeTab === 'loan' ? 'loan' : 'other'} documents have been uploaded for this project yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayDocs.map((item, idx) => {
                const docName = item.file?.originalName || item.file?.filename || item.label;
                const fileUrl = getFileUrl(item.file?.url || item.file?.path);

                return (
                  <div key={item.file?._id || idx} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 text-primary rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          {item.label}
                        </div>
                        <h4 className="font-semibold text-gray-800 truncate text-sm" title={docName}>
                          {docName}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex justify-center items-center gap-2 py-2 px-4 bg-gradient-to-r from-[#4b6cb7] via-[#7b558f] to-[#a63c71] text-white rounded-lg text-sm font-semibold hover:opacity-90 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                      <button
                        onClick={(e) => handleDownload(e, fileUrl, docName)}
                        className="flex-1 flex justify-center items-center gap-2 py-2 px-4 bg-gradient-to-r from-[#4b6cb7] via-[#7b558f] to-[#a63c71] text-white rounded-lg text-sm font-semibold hover:opacity-90 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
