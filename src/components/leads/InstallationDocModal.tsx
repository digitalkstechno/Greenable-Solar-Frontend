'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, FileText, Loader2, Eye, Printer, Download, CheckCircle, Zap, Camera, Receipt } from 'lucide-react';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead } from './types';

interface InstallationDocModalProps {
  isOpen: boolean;
  lead: ApiLead | null;
  onClose: () => void;
}

export default function InstallationDocModal({
  isOpen,
  lead,
  onClose,
}: InstallationDocModalProps) {
  const [loading, setLoading] = useState(false);
  const [projectDetail, setProjectDetail] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !lead?._id) {
      setProjectDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl.projectDetail}/${lead._id}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const data = res.data?.data;
        setProjectDetail(data || lead.projectDetail || null);
      } catch (err) {
        console.error('Error fetching project detail for installation doc view:', err);
        setProjectDetail(lead.projectDetail || null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '-';
    return String(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print-modal-overlay">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-modal-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 999999 !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          .print-modal-card {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .print-modal-content {
            overflow: visible !important;
            padding: 0 !important;
            height: auto !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print-modal-card">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-700">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">INSTALLATION & ACCOUNTS DOCUMENT VIEW</h2>
              <p className="text-xs text-slate-500">Post-Installation, Meter File, Subsidy & Account Details ({lead.fullName})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Styled Excel Sheet Format */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 print-modal-content">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <p className="text-sm font-medium">Loading Installation Document Details...</p>
            </div>
          ) : (
            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm print:border-slate-400">
              {/* Header Title Bar */}
              <div className="bg-[#F6D2B4] border-b border-slate-300 px-4 py-2.5 text-center font-black text-slate-900 tracking-wider text-base uppercase">
                INSTALLATION & ACCOUNTS DOCUMENT
              </div>

              {/* Customer summary bar */}
              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 flex flex-wrap justify-between gap-2">
                <span>CUSTOMER: <span className="text-slate-900">{projectDetail?.customerFullName || lead.fullName || '-'}</span></span>
                <span>PROJECT CODE: <span className="text-slate-900">{projectDetail?.projectCode || '-'}</span></span>
                <span>CONSUMER NO: <span className="text-slate-900">{projectDetail?.consumerNo || '-'}</span></span>
              </div>

              {/* Excel Table Layout */}
              <table className="w-full text-left border-collapse text-sm">
                <tbody>
                  {/* 1. Required Photos for Installation */}
                  <tr className="border-b border-slate-300 bg-[#F6D2B4]">
                    <td colSpan={2} className="px-4 py-2.5 font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      REQUIRED PHOTOS FOR INSTALLATION
                    </td>
                  </tr>
                  {[
                    { label: 'SITE OVERVIEW PHOTO', key: 'photoSiteOverview' },
                    { label: 'PANEL SR NO PHOTO (PDF)', key: 'photoPanelSrNo' },
                    { label: 'INVERTER SR NO PHOTO', key: 'photoInverterSrNo' },
                    { label: 'PANEL PLACEMENT PHOTO', key: 'photoPanelPlacement' },
                    { label: 'MOUNTING STRUCTURE PHOTO', key: 'photoMountingStructure' },
                    { label: 'INVERTER INSTALLED PHOTO', key: 'photoInverterInstalled' },
                    { label: 'ACDB / DCDB PHOTO', key: 'photoAcdbDcdb' },
                    { label: 'EARTHING CONNECTION PHOTO', key: 'photoEarthingConnection' },
                    { label: 'CABLE & WIRING ROUTE PHOTO 1', key: 'photoCableWiringRoute1' },
                    { label: 'CABLE & WIRING ROUTE PHOTO 2', key: 'photoCableWiringRoute2' },
                    { label: 'CABLE & WIRING ROUTE PHOTO 3', key: 'photoCableWiringRoute3' },
                    { label: 'EARTHING PIT PHOTO', key: 'photoEarthingPit' },
                    { label: 'JIO TAG CUSTOMER PHOTO', key: 'photoJioTagCustomer' },
                  ].map((p, idx) => (
                    <tr key={`photo-${idx}`} className="border-b border-slate-300 hover:bg-slate-50/80">
                      <td className="w-1/2 px-8 py-2 bg-[#EBF1F5] font-bold text-slate-700 border-r border-slate-300 text-xs sm:text-sm">
                        {p.label}
                      </td>
                      <td className="w-1/2 px-4 py-2 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                        {projectDetail?.[p.key]?.url ? (
                          <a href={projectDetail[p.key].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold underline">
                            <Eye className="h-3.5 w-3.5" /> View Photo
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* 2. Meter File */}
                  <tr className="border-b border-slate-300 bg-[#F6D2B4]">
                    <td colSpan={2} className="px-4 py-2.5 font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      METER FILE
                    </td>
                  </tr>
                  {[
                    { label: 'METER FILE MAKE DATE', value: formatVal(projectDetail?.meterFileMakeDate) },
                    { label: 'METER FILE REGISTRATION DATE', value: formatVal(projectDetail?.meterFileRegDate) },
                    { label: 'METER FILE MAKE PERSON NAME', value: formatVal(projectDetail?.meterFileMakePersonName) },
                    { label: 'DCR REPORT NO', value: formatVal(projectDetail?.dcrReportNo) },
                    { label: 'DCR REPORT DOCUMENT', value: projectDetail?.docDcrReport?.url ? 'Uploaded' : 'Not Uploaded' },
                    { label: 'DCR DATE', value: formatVal(projectDetail?.dcrDate) },
                  ].map((m, idx) => (
                    <tr key={`meter-${idx}`} className="border-b border-slate-300 hover:bg-slate-50/80">
                      <td className="w-1/2 px-8 py-2 bg-[#EBF1F5] font-bold text-slate-700 border-r border-slate-300 text-xs sm:text-sm">
                        {m.label}
                      </td>
                      <td className="w-1/2 px-4 py-2 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                        {m.label === 'DCR REPORT DOCUMENT' && projectDetail?.docDcrReport?.url ? (
                          <a
                            href={projectDetail.docDcrReport.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md font-bold hover:bg-blue-100 transition text-xs shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Meter File
                          </a>
                        ) : (
                          m.value
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* 3. After Installation Final Data */}
                  <tr className="border-b border-slate-300 bg-[#F6D2B4]">
                    <td colSpan={2} className="px-4 py-2.5 font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      AFTER INSTALLATION FINAL DATA
                    </td>
                  </tr>
                  {[
                    { label: 'PANEL MAKE', value: formatVal(projectDetail?.finalPanelMake || projectDetail?.panelMake) },
                    { label: 'PANEL WP', value: formatVal(projectDetail?.finalPanelWp || projectDetail?.panelWp) },
                    { label: 'NO OF PANEL', value: formatVal(projectDetail?.finalNoOfPanel || projectDetail?.noOfPanel) },
                    { label: 'FINAL PROJECT KW', value: formatVal(projectDetail?.finalProjectKw || projectDetail?.totalKw) },
                    { label: 'INVERTER MAKE', value: formatVal(projectDetail?.finalInverterMake || projectDetail?.inverterMake) },
                    { label: 'INVERTER KW', value: formatVal(projectDetail?.finalInverterKw || projectDetail?.inverterKw) },
                    { label: 'PANEL & INVERTER SR NO DOCUMENT', value: projectDetail?.docPanelInverterSrNo?.url ? 'Uploaded' : 'Not Uploaded' },
                  ].map((f, idx) => (
                    <tr key={`final-${idx}`} className="border-b border-slate-300 hover:bg-slate-50/80">
                      <td className="w-1/2 px-8 py-2 bg-[#EBF1F5] font-bold text-slate-700 border-r border-slate-300 text-xs sm:text-sm">
                        {f.label}
                      </td>
                      <td className="w-1/2 px-4 py-2 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                        {f.label === 'PANEL & INVERTER SR NO DOCUMENT' && projectDetail?.docPanelInverterSrNo?.url ? (
                          <a
                            href={projectDetail.docPanelInverterSrNo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md font-bold hover:bg-blue-100 transition text-xs shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Document
                          </a>
                        ) : (
                          f.value
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* 4. Intimation and Subsidy */}
                  <tr className="border-b border-slate-300 bg-[#F6D2B4]">
                    <td colSpan={2} className="px-4 py-2.5 font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      INTIMATION AND SUBSIDY
                    </td>
                  </tr>
                  {[
                    { label: 'INTIMATION DATE', value: formatVal(projectDetail?.intimationDate) },
                    { label: 'INTIMATION REJECT DATE', value: formatVal(projectDetail?.intimationRejectDate) },
                    { label: 'INTIMATION REJECT REASON', value: formatVal(projectDetail?.intimationRejectReason) },
                    { label: 'METER INSTALLATION DATE', value: formatVal(projectDetail?.meterInstolationDate) },
                    { label: 'INTIMATION APPROVAL DATE', value: formatVal(projectDetail?.intimationApprovalDate) },
                    { label: 'SUBSIDY REDEEM', value: formatVal(projectDetail?.subsidyRedeem?.toUpperCase()) },
                    { label: 'SUBSIDY REDEEM NAME', value: formatVal(projectDetail?.subsidyRedeemName) },
                    { label: 'SUBSIDY AMOUNT', value: projectDetail?.subsidyAmount ? `₹${Number(projectDetail.subsidyAmount).toLocaleString()}` : '-' },
                    { label: 'SUBSIDY DISBURSEMENT DATE', value: formatVal(projectDetail?.subsidyDisbusmentDate) },
                  ].map((s, idx) => (
                    <tr key={`sub-${idx}`} className="border-b border-slate-300 hover:bg-slate-50/80">
                      <td className="w-1/2 px-8 py-2 bg-[#EBF1F5] font-bold text-slate-700 border-r border-slate-300 text-xs sm:text-sm">
                        {s.label}
                      </td>
                      <td className="w-1/2 px-4 py-2 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                        {s.value}
                      </td>
                    </tr>
                  ))}

                  {/* 5. Invoice and Warranty (Account Department) */}
                  <tr className="border-b border-slate-300 bg-[#F6D2B4]">
                    <td colSpan={2} className="px-4 py-2.5 font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      INVOICE AND WARRANTY (ACCOUNT DEPARTMENT)
                    </td>
                  </tr>
                  {[
                    { label: 'MAKE INVOICE', value: formatVal(projectDetail?.makeInvoice?.toUpperCase()) },
                    { label: 'INVOICE DOCUMENT', value: projectDetail?.docInvoice?.url ? 'Uploaded' : 'Not Uploaded' },
                    { label: 'WARRANTY CERTIFICATE', value: projectDetail?.docWarrantyCertificate?.url ? 'Uploaded' : 'Not Uploaded' },
                    { label: 'CONSUMER FILE STATUS', value: formatVal(projectDetail?.consumerFile) },
                    { label: 'CURRENT DEPARTMENT', value: formatVal(projectDetail?.currentDepartment) },
                  ].map((a, idx) => (
                    <tr key={`acc-${idx}`} className="border-b border-slate-300 hover:bg-slate-50/80">
                      <td className="w-1/2 px-8 py-2 bg-[#EBF1F5] font-bold text-slate-700 border-r border-slate-300 text-xs sm:text-sm">
                        {a.label}
                      </td>
                      <td className="w-1/2 px-4 py-2 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                        {a.label === 'INVOICE DOCUMENT' && projectDetail?.docInvoice?.url ? (
                          <a
                            href={projectDetail.docInvoice.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md font-bold hover:bg-blue-100 transition text-xs shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Invoice
                          </a>
                        ) : a.label === 'WARRANTY CERTIFICATE' && projectDetail?.docWarrantyCertificate?.url ? (
                          <a
                            href={projectDetail.docWarrantyCertificate.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md font-bold hover:bg-blue-100 transition text-xs shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Warranty
                          </a>
                        ) : (
                          a.value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 text-sm font-bold shadow-md transition cursor-pointer"
          >
            <Printer className="h-5 w-5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
