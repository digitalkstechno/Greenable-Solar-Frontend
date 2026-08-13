'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, CheckCircle, ShieldCheck, Loader2, Eye } from 'lucide-react';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead } from './types';
import Swal from 'sweetalert2';

interface ExecutivePersonModalProps {
  isOpen: boolean;
  lead: ApiLead | null;
  onClose: () => void;
  onVerified?: () => void;
}

export default function ExecutivePersonModal({
  isOpen,
  lead,
  onClose,
  onVerified,
}: ExecutivePersonModalProps) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!isOpen || !lead?._id) {
      setProjectDetail(null);
      setIsVerified(false);
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
        setIsVerified(!!data?.isExecutiveVerified || !!(lead.projectDetail as any)?.isExecutiveVerified);
      } catch (err) {
        console.error('Error fetching project detail for executive view:', err);
        setProjectDetail(lead.projectDetail || null);
        setIsVerified(!!(lead.projectDetail as any)?.isExecutiveVerified);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleConfirm = async () => {
    // Validate required fields
    const missingFields: string[] = [];

    if (!projectDetail?.elcbInstalled) missingFields.push('ELCB/RCCB Installed');
    if (!projectDetail?.elcbProvideBy) missingFields.push('ELCB/RCCB Provided By');
    if (!projectDetail?.wiringType) missingFields.push('Wiring Type');
    if (!projectDetail?.homeFloor) missingFields.push('Home Floor');
    if (!projectDetail?.walkway) missingFields.push('Walkway');
    if (projectDetail?.walkway === 'yes' && (projectDetail?.walkwayLengthFeet === undefined || projectDetail?.walkwayLengthFeet === null || projectDetail?.walkwayLengthFeet === '')) {
      missingFields.push('Walkway Length in Feet');
    }
    if (!projectDetail?.ladder) missingFields.push('Ladder');
    if (projectDetail?.ladder === 'yes' && (projectDetail?.ladderLengthFeet === undefined || projectDetail?.ladderLengthFeet === null || projectDetail?.ladderLengthFeet === '')) {
      missingFields.push('Ladder Length in Feet');
    }
    if (!projectDetail?.hdgiPipeMake) missingFields.push('HDGI Pipe Make');
    
    // HDGI sizes are required to be present as number/value
    if (projectDetail?.hdgiPipe80x40 === undefined || projectDetail?.hdgiPipe80x40 === null || projectDetail?.hdgiPipe80x40 === '') missingFields.push('80 X 40 Pipe size');
    if (projectDetail?.hdgiPipe60x40 === undefined || projectDetail?.hdgiPipe60x40 === null || projectDetail?.hdgiPipe60x40 === '') missingFields.push('60 X 40 Pipe size');
    if (projectDetail?.hdgiPipe40x40 === undefined || projectDetail?.hdgiPipe40x40 === null || projectDetail?.hdgiPipe40x40 === '') missingFields.push('40 X 40 Pipe size');
    if (projectDetail?.hdgiPipe20x40PatiPipe === undefined || projectDetail?.hdgiPipe20x40PatiPipe === null || projectDetail?.hdgiPipe20x40PatiPipe === '') missingFields.push('20 X 40 Pati Pipe size');

    if (missingFields.length > 0) {
      Swal.fire({
        title: 'Validation Error',
        html: `<div class="text-left"><p class="font-bold text-red-600 mb-2">Please fill all required fields in Back Office before verification:</p>
               <ul class="list-disc pl-5 text-sm space-y-1 text-slate-700">
                 ${missingFields.map(f => `<li>${f}</li>`).join('')}
               </ul></div>`,
        icon: 'error',
        confirmButtonColor: '#d33',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          confirmButton: 'font-semibold px-6 py-2 rounded-lg'
        }
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Verify Lead?',
      text: 'Are you sure you want to verify this lead?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Verify',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        confirmButton: 'font-semibold px-6 py-2 rounded-lg',
        cancelButton: 'font-semibold px-6 py-2 rounded-lg'
      }
    });

    if (!confirmResult.isConfirmed) return;

    setVerifying(true);
    try {
      const res = await axios.post(
        `${baseUrl.projectDetail}/${lead._id}/verify-executive`,
        {},
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      
      Swal.fire({
        title: 'Verified Successfully!',
        text: res.data?.message || 'Lead has been verified by the Executive department.',
        icon: 'success',
        confirmButtonColor: '#10b981',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          confirmButton: 'font-semibold px-6 py-2 rounded-lg'
        }
      });

      setIsVerified(true);
      if (onVerified) onVerified();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to verify lead');
    } finally {
      setVerifying(false);
    }
  };

  const projectAmt = projectDetail?.projectAmount ?? lead.projectAmount ?? 0;
  const pendingAmt = projectDetail?.pendingAmount ?? (projectAmt - (lead.paymentAmount || 0));

  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '-';
    return String(val);
  };

  const rawCreatedAt = (lead as any).createdAt;

  const fieldsList = [
    { label: 'SR NO', value: formatVal(projectDetail?.srNo || '1') },
    {
      label: 'DATE',
      value: rawCreatedAt
        ? new Date(rawCreatedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '-',
    },
    { label: 'SALES PERSON NAME', value: formatVal(projectDetail?.salesPersonName || projectDetail?.creatorName || lead.createdBy?.fullName || lead.assignedTo?.fullName) },
    { label: 'PROJECT CODE', value: formatVal(projectDetail?.projectCode) },
    { label: 'CUSTOMER NAME', value: formatVal(projectDetail?.customerFullName || lead.fullName) },
    { label: 'MOBILE NO FOR REGISTATION', value: formatVal(projectDetail?.registerMobileNumber || lead.contact) },
    { label: 'LOCATION LINK', value: formatVal(projectDetail?.locationLink || lead.locationLink) },
    { label: 'ADDRESS', value: formatVal(projectDetail?.address || lead.address) },
    { label: 'CITY', value: formatVal(projectDetail?.city) },
    { label: 'PINCONE', value: formatVal(projectDetail?.pincode) },
    { label: 'PANEL MAKE', value: formatVal(projectDetail?.panelMake) },
    { label: 'PANEL WP', value: formatVal(projectDetail?.panelWp) },
    { label: 'NO OF PANEL', value: formatVal(projectDetail?.noOfPanel) },
    { label: 'INVETER MAKE', value: formatVal(projectDetail?.inverterMake) },
    { label: 'INVETER KW', value: formatVal(projectDetail?.inverterKw) },
    { label: 'INVETER PHASE', value: formatVal(projectDetail?.inverterPhase) },
    { label: 'CONSUMER NO', value: formatVal(projectDetail?.consumerNo) },
    { label: 'DISCOM', value: formatVal(projectDetail?.discom) },
    { label: 'PROJECT AMOUNT', value: projectAmt ? `₹${Number(projectAmt).toLocaleString()}` : '-' },
    { label: 'PENDING AMOUNT', value: pendingAmt ? `₹${Number(pendingAmt).toLocaleString()}` : '-' },
    { label: 'DIVISON', value: formatVal(projectDetail?.division) },
    { label: 'SUB DIVISON', value: formatVal(projectDetail?.subDivision) },
    { label: 'Instolation roof', value: formatVal(projectDetail?.installationRoof) },
    { label: 'discom', value: formatVal(projectDetail?.discom) },
    { label: 'consumer connection type', value: formatVal(projectDetail?.consumerConnectionType) },
    { label: 'elcb / rccb instolatoled*', value: formatVal(projectDetail?.elcbInstalled) },
    { label: 'elcb / rccb provide by*', value: formatVal(projectDetail?.elcbProvideBy) },
    { label: 'wiring type*', value: formatVal(projectDetail?.wiringType) },
    { label: 'home floor*', value: formatVal(projectDetail?.homeFloor) },
    { label: 'walkway*', value: formatVal(projectDetail?.walkway) },
    { label: 'walkway lenght in feet*', value: formatVal(projectDetail?.walkwayLengthFeet) },
    { label: 'ledder*', value: formatVal(projectDetail?.ladder) },
    { label: 'ledder lenght in feet*', value: formatVal(projectDetail?.ladderLengthFeet) },
    { label: 'HDGI pipe make*', value: formatVal(projectDetail?.hdgiPipeMake) },
  ];

  const hdgiSizes = [
    { label: '80 X 40*', value: formatVal(projectDetail?.hdgiPipe80x40 ?? 0) },
    { label: '60 X 40*', value: formatVal(projectDetail?.hdgiPipe60x40 ?? 0) },
    { label: '40 X 40*', value: formatVal(projectDetail?.hdgiPipe40x40 ?? 0) },
    { label: '20 X 40 PATI PIPE*', value: formatVal(projectDetail?.hdgiPipe20x40PatiPipe ?? 0) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">EXECUTIVE PERSON VIEW</h2>
              <p className="text-xs text-slate-500">Read-Only Lead & Project Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Styled Excel Sheet Format */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Loading Executive Details...</p>
            </div>
          ) : (
            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
              {/* Header Title Bar matching screenshot */}
              <div className="bg-[#F6D2B4] border-b border-slate-300 px-4 py-2.5 text-center font-black text-slate-900 tracking-wider text-base uppercase">
                EXECUTIVE PERSON
              </div>

              {/* Excel Table Layout */}
              <table className="w-full text-left border-collapse text-sm">
                <tbody>
                  {fieldsList.map((f, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-300 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="w-1/2 px-4 py-2.5 bg-[#DCE6F1] font-bold text-slate-800 border-r border-slate-300 text-xs sm:text-sm uppercase tracking-wide">
                        {f.label}
                      </td>
                      <td className="w-1/2 px-4 py-2.5 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                        {f.value}
                      </td>
                    </tr>
                  ))}

                  {/* HDGI PIPE IN FEET Section */}
                  <tr className="border-b border-slate-300 bg-[#DCE6F1]">
                    <td
                      colSpan={2}
                      className="px-4 py-2.5 font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide border-r border-slate-300"
                    >
                      HDGI PIPE IN FEET*
                    </td>
                  </tr>

                  {hdgiSizes.map((h, idx) => (
                    <tr
                      key={`hdgi-${idx}`}
                      className="border-b border-slate-300 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="w-1/2 px-8 py-2 bg-[#EBF1F5] font-bold text-slate-700 border-r border-slate-300 text-xs sm:text-sm">
                        {h.label}
                      </td>
                      <td className="w-1/2 px-4 py-2 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                        {h.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer with Green Confirm Button */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer"
          >
            Close
          </button>

          {isVerified ? (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-bold shadow-xs">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span>Verified by Executive</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={verifying || loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Confirm (Verify Lead)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
