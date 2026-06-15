// // components/leads/LeadViewDialog.tsx
// // View dialog with editable Status + Next Follow-up (shared by List and Kanban)

// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import Dialog, { CenterDialog } from '@/components/Dialog';
// import { baseUrl, getAuthToken } from '@/config';
// import { ApiLead, ApiStatus } from './types';
// import { Eye, Download, FileText, Image, File, FileSpreadsheet } from 'lucide-react';
// import { getFileIcon } from '@/utills/utill';

// interface Props {
//   lead: ApiLead | null;
//   statuses: ApiStatus[];
//   onClose: () => void;
//   onRefresh: () => void;
// }

// export default function LeadViewDialog({ lead, statuses, onClose, onRefresh }: Props) {
//   const [editStatus, setEditStatus] = useState('');
//   const [editNextDate, setEditNextDate] = useState('');
//   const [editNextTime, setEditNextTime] = useState('');
//   const [followupNote, setFollowupNote] = useState('');
//   const [saving, setSaving] = useState(false);
//   const [addingFollowup, setAddingFollowup] = useState(false);
//   const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);

//   useEffect(() => {
//     if (lead) {
//       setEditStatus(lead.leadStatus?._id || '');
//       setEditNextDate(lead.nextFollowupDate || '');
//       setEditNextTime(lead.nextFollowupTime || '');
//     }
//   }, [lead]);

//   const handleSave = async () => {
//     if (!lead) return;
//     setSaving(true);
//     try {
//       await axios.put(
//         `${baseUrl.updateLead}/${lead._id}`,
//         {
//           leadStatus: editStatus,
//         },
//         { headers: { Authorization: `Bearer ${getAuthToken()}` } }
//       );
//       toast.success('Lead status updated');
//       onRefresh();
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message || 'Failed to update lead');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleAddFollowup = async () => {
//     if (!lead || !editNextDate || !followupNote) return;
//     setAddingFollowup(true);
//     try {
//       // Get current user from localStorage or somewhere? 
//       // Most of our other components don't store user in a hook, 
//       // but the backend will know who is logged in from the token.

//       const newFollowup = {
//         date: editNextDate,
//         time: editNextTime,
//         note: followupNote,
//         // Backend handles staff ID if not provided, but we send if we had it.
//         // For now, let's just send the data.
//       };

//       const updatedFollowUps = [...(lead.followUps || []), newFollowup];

//       await axios.put(
//         `${baseUrl.updateLead}/${lead._id}`,
//         {
//           followUps: updatedFollowUps,
//           nextFollowupDate: editNextDate, // Update the lead's main "next" date too
//           nextFollowupTime: editNextTime,
//           lastFollowUp: new Date().toISOString().split('T')[0] // Set today as last followup
//         },
//         { headers: { Authorization: `Bearer ${getAuthToken()}` } }
//       );

//       toast.success('Follow-up recorded successfully');
//       setFollowupNote('');
//       setEditNextDate('');
//       setEditNextTime('');
//       onRefresh();
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message || 'Failed to add follow-up');
//     } finally {
//       setAddingFollowup(false);
//     }
//   };

//   const handleView = (attachment: any) => {
//     const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
//     const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(attachment.filename);

//     if (isImage) {
//       setPreviewAttachment({
//         url: fileUrl,
//         name: attachment.originalName,
//         type: 'image'
//       });
//     } else {
//       window.open(fileUrl, '_blank');
//     }
//   };

//   const handleDownload = async (attachment: any) => {
//     try {
//       const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
//       const response = await fetch(fileUrl, {
//         headers: { Authorization: `Bearer ${getAuthToken()}` }
//       });

//       if (!response.ok) throw new Error('Download failed');

//       const blob = await response.blob();
//       const blobUrl = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.download = attachment.originalName;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(blobUrl);
//       toast.success('Download started');
//     } catch (error) {
//       console.error('Download error:', error);
//       toast.error('Failed to download file');
//     }
//   };

//   return (
//     <>
//       <Dialog
//         isOpen={!!lead}
//         onClose={onClose}
//         title="Lead Details"
//         size="lg"
//         footer={
//           <>
//             <button
//               onClick={onClose}
//               className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Close
//             </button>
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
//             >
//               {saving ? 'Saving...' : 'Save Changes'}
//             </button>
//           </>
//         }
//       >
//         {lead && (
//           <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
//             <h2 className="text-xl font-bold text-gray-900">{lead.fullName}</h2>

//             {/* Info grid */}
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               <InfoCard label="Company" value={lead.companyName} />
//               <InfoCard label="Phone" value={lead.contact} />
//               <InfoCard label="Email" value={lead.email} />
//               <InfoCard label="Source" value={lead.leadSource?.name} />
//               <InfoCard label="Assigned Staff" value={lead.assignedTo?.fullName} />
//               <InfoCard
//                 label="Priority"
//                 value={
//                   lead.priority ? (
//                     <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${lead.priority.toLowerCase() === 'high'
//                         ? 'bg-red-100 text-red-600'
//                         : lead.priority.toLowerCase() === 'medium'
//                           ? 'bg-yellow-100 text-yellow-700'
//                           : 'bg-green-100 text-green-700'
//                       }`}>
//                       {lead.priority}
//                     </span>
//                   ) : '-'
//                 }
//               />
//               <InfoCard label="Last Follow-Up" value={lead.lastFollowUp} />
//               <InfoCard label="Active" value={lead.isActive ? 'Yes' : 'No'} />
//             </div>

//             {/* Address */}
//             {lead.address && <InfoCard label="Address" value={lead.address} />}

//             <div className="rounded-lg bg-gray-50 p-4">
//               <div className="mb-3 text-sm font-medium text-gray-600">Status</div>
//               <div className="flex flex-wrap gap-2">
//                 {statuses.map((s) => (
//                   <button
//                     key={s._id}
//                     onClick={() => setEditStatus(s._id)}
//                     className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${editStatus === s._id
//                         ? 'bg-secondary text-white shadow'
//                         : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
//                       }`}
//                   >
//                     {s.name}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Follow-up History */}
//             <div className="rounded-lg bg-gray-50 p-4">
//               <div className="mb-3 text-sm font-bold text-gray-800 flex items-center justify-between">
//                 <span>Follow-Up History</span>
//                 <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-normal">
//                   {lead.followUps?.length || 0} Records
//                 </span>
//               </div>

//               {/* Add New Follow-up Section */}
//               <div className="mb-6 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Follow-up</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-xs font-medium text-gray-500">Date</label>
//                     <input
//                       type="date"
//                       value={editNextDate}
//                       onChange={(e) => setEditNextDate(e.target.value)}
//                       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none"
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-xs font-medium text-gray-500">Time</label>
//                     <input
//                       type="time"
//                       value={editNextTime}
//                       onChange={(e) => setEditNextTime(e.target.value)}
//                       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none"
//                     />
//                   </div>
//                 </div>
//                 <div className="mt-3 space-y-1">
//                   <label className="text-xs font-medium text-gray-500">Note / Summary</label>
//                   <textarea
//                     value={followupNote}
//                     onChange={(e) => setFollowupNote(e.target.value)}
//                     placeholder="Describe the interaction..."
//                     rows={3}
//                     className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none"
//                   />
//                 </div>
//                 <button
//                   onClick={handleAddFollowup}
//                   disabled={!editNextDate || !followupNote || addingFollowup}
//                   className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                 >
//                   {addingFollowup ? 'Recording...' : 'Record Follow-up'}
//                 </button>
//               </div>

//               {/* Follow-up Table */}
//               {lead.followUps && lead.followUps.length > 0 ? (
//                 <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
//                   <table className="w-full text-left text-sm">
//                     <thead>
//                       <tr className="bg-gray-50 border-b border-gray-100">
//                         <th className="px-4 py-3 font-semibold text-gray-600">Date & Time</th>
//                         <th className="px-4 py-3 font-semibold text-gray-600">Note</th>
//                         <th className="px-4 py-3 font-semibold text-gray-600">Staff</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-50">
//                       {[...(lead.followUps || [])].reverse().map((f, i) => (
//                         <tr key={f._id || i} className="hover:bg-gray-50/50 transition-colors">
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="font-medium text-gray-900">{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</div>
//                             <div className="text-xs text-gray-500">{f.time || ''}</div>
//                           </td>
//                           <td className="px-4 py-3 max-w-xs overflow-hidden">
//                             <p className="text-gray-700 break-words leading-relaxed">{f.note}</p>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="flex items-center gap-2">
//                               <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
//                                 {f.staff?.fullName?.charAt(0) || 'U'}
//                               </div>
//                               <span className="text-gray-600">{f.staff?.fullName || 'System'}</span>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="py-8 text-center bg-white rounded-xl border border-gray-100 border-dashed">
//                   <p className="text-gray-400">No follow-up history available yet.</p>
//                 </div>
//               )}
//             </div>

//             {/* Labels */}
//             {lead.leadLabel && lead.leadLabel.length > 0 && (
//               <div className="rounded-lg bg-gray-50 p-4">
//                 <div className="mb-2 text-sm font-medium text-gray-600">Labels</div>
//                 <div className="flex flex-wrap gap-2">
//                   {lead.leadLabel.map((l) => (
//                     <span
//                       key={l._id}
//                       style={{ backgroundColor: l.color }}
//                       className="rounded-md px-2 py-1 text-xs font-medium text-white"
//                     >
//                       {l.name}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Note */}
//             {lead.note && (
//               <div className="rounded-lg bg-gray-50 p-4">
//                 <div className="mb-1 text-sm font-medium text-gray-600">Primary Note</div>
//                 <p className="text-gray-800 whitespace-pre-wrap">{lead.note}</p>
//               </div>
//             )}

//             {/* Attachments */}
//             {lead.attachments && lead.attachments.length > 0 && (
//               <div className="rounded-lg bg-gray-50 p-4">
//                 <div className="mb-3 text-sm font-medium text-gray-600 flex items-center gap-2">
//                   <span>Attachments</span>
//                   <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
//                     {lead.attachments.length}
//                   </span>
//                 </div>
//                 <div className="space-y-2">
//                   {lead.attachments.map((att: any, idx) => {
//                     const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att?.filename || "");

//                     return (
//                       <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
//                         {/* File Icon/Thumbnail */}
//                         <div className="flex-shrink-0">
//                           {isImage ? (
//                             <div className="relative w-10 h-10 rounded overflow-hidden border border-gray-200">
//                               <img
//                                 src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${att?.path}`}
//                                 alt={att?.originalName}
//                                 className="w-full h-full object-cover"
//                               />
//                             </div>
//                           ) : (
//                             <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
//                               {getFileIcon(att?.filename || "")}
//                             </div>
//                           )}
//                         </div>

//                         {/* File Info */}
//                         <div className="flex-1 min-w-0">
//                           <p className="text-sm font-medium text-gray-900 truncate">{att.originalName}</p>
//                           <p className="text-xs text-gray-500">
//                             {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ''} •
//                             {att.filename?.split('.').pop()?.toUpperCase()}
//                           </p>
//                         </div>

//                         {/* Action Buttons */}
//                         <div className="flex items-center gap-1">
//                           <button
//                             onClick={() => handleView(att)}
//                             className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
//                             title="View"
//                           >
//                             <Eye className="h-4 w-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDownload(att)}
//                             className="p-2 hover:bg-green-50 rounded-lg transition-colors text-gray-600 hover:text-green-600"
//                             title="Download"
//                           >
//                             <Download className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* Lost info */}
//             {lead.isLost && (
//               <div className="rounded-lg bg-red-50 p-4">
//                 <div className="mb-2 text-sm font-semibold text-red-600">Lost Information</div>
//                 <div className="space-y-1 text-sm text-red-800">
//                   <div>Lost Date: {lead.lostDate ? new Date(lead.lostDate).toLocaleDateString() : 'N/A'}</div>
//                   <div>Reason: {lead.lostReason || 'Not specified'}</div>
//                 </div>
//               </div>
//             )}

//             {/* Won info */}
//             {lead.isWon && (
//               <div className="rounded-lg bg-green-50 p-4">
//                 <div className="mb-2 text-sm font-semibold text-green-700">Won Information</div>
//                 <div className="space-y-1 text-sm text-green-800">
//                   <div>Won Date: {lead.wonDate ? new Date(lead.wonDate).toLocaleDateString() : 'N/A'}</div>
//                   <div>Amount: {lead.amount ? `₹${lead.amount.toLocaleString()}` : 'Not specified'}</div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </Dialog>

//       {/* Image Preview Modal */}
//       {previewAttachment && (
//         <CenterDialog
//           isOpen={true}
//           onClose={() => setPreviewAttachment(null)}
//         >
//           <div className="relative">
//             <img
//               src={previewAttachment.url}
//               alt={previewAttachment.name}
//               className="max-w-full max-h-[70vh] object-contain mx-auto"
//             />
//             <div className="absolute top-4 right-4 flex gap-2">
//               <a
//                 href={previewAttachment.url}
//                 download={previewAttachment.name}
//                 className="bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg transition-colors"
//                 title="Download"
//               >
//                 <Download className="h-5 w-5 text-gray-700" />
//               </a>
//             </div>
//           </div>
//         </CenterDialog>
//       )}
//     </>
//   );
// }

// function InfoCard({
//   label,
//   value,
// }: {
//   label: string;
//   value?: string | React.ReactNode | null;
// }) {
//   return (
//     <div className="rounded-lg bg-gray-50 p-3">
//       <div className="mb-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
//       <div className="text-gray-900">
//         {typeof value === 'string' || value === undefined || value === null
//           ? value || '-'
//           : value}
//       </div>
//     </div>
//   );
// }
// components/leads/LeadViewDialog.tsx
// View dialog with editable Status + Next Follow-up (shared by List and Kanban)

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Dialog, { CenterDialog } from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiStatus } from './types';
import { Eye, Download, FileText, Image, File, FileSpreadsheet, Search } from 'lucide-react';
import { getFileIcon } from '@/utills/utill';

interface Props {
  lead: ApiLead | null;
  statuses: ApiStatus[];
  onClose: () => void;
  onRefresh: () => void;
}

// Interface for follow-up
interface FollowUp {
  _id?: string;
  date: string;
  time?: string;
  note: string;
  staff?: {
    _id: string;
    fullName: string;
  };
  createdAt?: string;
}

export default function LeadViewDialog({ lead, statuses, onClose, onRefresh }: Props) {
  const [editStatus, setEditStatus] = useState('');
  const [editNextDate, setEditNextDate] = useState('');
  const [editNextTime, setEditNextTime] = useState('');
  const [followupNote, setFollowupNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingFollowup, setAddingFollowup] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [localFollowUps, setLocalFollowUps] = useState<FollowUp[]>([]);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [followUpSearch, setFollowUpSearch] = useState('');

  useEffect(() => {
    if (lead) {
      setEditStatus(lead.leadStatus?._id || '');
      setEditNextDate(lead.nextFollowupDate || '');
      setEditNextTime(lead.nextFollowupTime || '');
      setLocalFollowUps(lead.followUps || []);
    }
  }, [lead]);

  const filteredFollowUps = useMemo(() => {
    if (!followUpSearch.trim()) return localFollowUps;
    const search = followUpSearch.toLowerCase();
    return localFollowUps.filter(f => 
      (f.note?.toLowerCase() || '').includes(search) ||
      (f.date?.toLowerCase() || '').includes(search) ||
      (f.time?.toLowerCase() || '').includes(search) ||
      (f.staff?.fullName?.toLowerCase() || '').includes(search)
    );
  }, [localFollowUps, followUpSearch]);

  // Get current staff info from localStorage or API
  useEffect(() => {
    const fetchCurrentStaff = async () => {
      try {
        const res = await axios.get(baseUrl.currentStaff, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        setStaffInfo(res.data?.data);
      } catch (error) {
        console.error('Failed to fetch staff info', error);
      }
    };
    fetchCurrentStaff();
  }, []);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        {
          leadStatus: editStatus,
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      toast.success('Lead status updated');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFollowup = async () => {
    if (!lead || !editNextDate || !followupNote) return;
    setAddingFollowup(true);

    // Create temporary follow-up object with optimistic update
    const tempFollowUp: FollowUp = {
      date: editNextDate,
      time: editNextTime,
      note: followupNote,
      staff: staffInfo ? {
        _id: staffInfo._id,
        fullName: staffInfo.fullName || 'Current User'
      } : undefined,
      _id: `temp_${Date.now()}`, // Temporary ID
      createdAt: new Date().toISOString()
    };

    // Optimistically add to local state
    setLocalFollowUps(prev => [tempFollowUp, ...prev]);

    // Clear form fields
    setFollowupNote('');
    setEditNextDate('');
    setEditNextTime('');

    try {
      const newFollowup = {
        date: editNextDate,
        time: editNextTime,
        note: followupNote,
      };

      const updatedFollowUps = [...(lead.followUps || []), newFollowup];

      const response = await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        {
          followUps: updatedFollowUps,
          nextFollowupDate: editNextDate,
          nextFollowupTime: editNextTime,
          lastFollowUp: new Date().toISOString().split('T')[0]
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      // Update with actual data from server
      if (response.data?.data?.followUps) {
        setLocalFollowUps(response.data.data.followUps);
      }

      toast.success('Follow-up recorded successfully');
      onRefresh();
    } catch (e: any) {
      // Remove the temporary follow-up on error
      setLocalFollowUps(prev => prev.filter(f => f._id !== tempFollowUp._id));
      toast.error(e?.response?.data?.message || 'Failed to add follow-up');
    } finally {
      setAddingFollowup(false);
    }
  };

  const handleView = (attachment: any) => {
    const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(attachment.filename);

    if (isImage) {
      setPreviewAttachment({
        url: fileUrl,
        name: attachment.originalName,
        type: 'image'
      });
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
      const response = await fetch(fileUrl, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <>
      <Dialog
        isOpen={!!lead}
        onClose={onClose}
        title="Lead Details"
        size="lg"
        footer={
          <>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {lead && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <h2 className="text-xl font-bold text-gray-900">{lead.fullName}</h2>

            {/* Info grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoCard label="Company" value={lead.companyName} />
              <InfoCard label="Phone" value={lead.contact} />
              <InfoCard label="Email" value={lead.email} />
              <InfoCard label="Source" value={lead.leadSource?.name} />
              <InfoCard label="Assigned Staff" value={lead.assignedTo?.fullName} />
              <InfoCard
                label="Priority"
                value={
                  lead.priority ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${lead.priority.toLowerCase() === 'high'
                      ? 'bg-red-100 text-red-600'
                      : lead.priority.toLowerCase() === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                      }`}>
                      {lead.priority}
                    </span>
                  ) : '-'
                }
              />
              <InfoCard label="Last Follow-Up" value={lead.lastFollowUp} />
              <InfoCard label="Active" value={lead.isActive ? 'Yes' : 'No'} />
            </div>

            {/* Address */}
            {lead.address && <InfoCard label="Address" value={lead.address} />}

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 text-sm font-medium text-gray-600">Status</div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setEditStatus(s._id)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${editStatus === s._id
                      ? 'bg-secondary text-white shadow'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up History */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 text-sm font-bold text-gray-800 flex items-center justify-between">
                <span>Follow-Up History</span>
                <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-normal">
                  {localFollowUps.length} Records
                </span>
              </div>

              {/* Add New Follow-up Section */}
              <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Follow-up</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Date</label>
                    <input
                      type="date"
                      value={editNextDate}
                      onChange={(e) => setEditNextDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Time</label>
                    <input
                      type="time"
                      value={editNextTime}
                      onChange={(e) => setEditNextTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <label className="text-xs font-medium text-gray-500">Note / Summary</label>
                  <textarea
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                    placeholder="Describe the interaction..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleAddFollowup}
                  disabled={!editNextDate || !followupNote || addingFollowup}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {addingFollowup ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Recording...
                    </span>
                  ) : 'Record Follow-up'}
                </button>
              </div>

              {/* Follow-up Table */}
              {localFollowUps && localFollowUps.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white">
                  {/* Search Bar */}
                  <div className="border-b border-gray-200 px-4 py-3">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search follow-ups..."
                        value={followUpSearch}
                        onChange={(e) => setFollowUpSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 hover:border-gray-300"
                      />
                    </div>
                    {followUpSearch && (
                      <p className="mt-2 text-xs text-gray-500">
                        Showing {filteredFollowUps.length} of {localFollowUps.length} records
                      </p>
                    )}
                  </div>
                  
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-4 py-3 font-semibold text-gray-600">Date & Time</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Note</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Staff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(followUpSearch ? filteredFollowUps : localFollowUps).map((f, i) => (
                          <tr key={f._id || i} className={`hover:bg-gray-50/50 transition-colors ${f._id?.startsWith('temp_') ? 'animate-pulse bg-blue-50/30' : ''}`}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {f.date ? new Date(f.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                              </div>
                              {f.time && (
                                <div className="text-xs text-gray-500">{f.time}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-xs overflow-hidden">
                              <p className="text-gray-700 break-words leading-relaxed">{f.note}</p>
                              {f._id?.startsWith('temp_') && (
                                <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Saving...
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                  {f.staff?.fullName?.charAt(0) || staffInfo?.fullName?.charAt(0) || 'U'}
                                </div>
                                <span className="text-gray-600">{f.staff?.fullName || staffInfo?.fullName || 'Current User'}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {followUpSearch && filteredFollowUps.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        <p className="text-sm">No follow-ups match your search.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                  <p className="text-gray-400">No follow-up history available yet.</p>
                </div>
              )}
            </div>

            {/* Labels */}
            {lead.leadLabel && lead.leadLabel.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 text-sm font-medium text-gray-600">Labels</div>
                <div className="flex flex-wrap gap-2">
                  {lead.leadLabel.map((l) => (
                    <span
                      key={l._id}
                      style={{ backgroundColor: l.color }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-white"
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {lead.note && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm font-medium text-gray-600">Primary Note</div>
                <p className="text-gray-800 whitespace-pre-wrap">{lead.note}</p>
              </div>
            )}

            {/* Attachments */}
            {lead.attachments && lead.attachments.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 text-sm font-medium text-gray-600 flex items-center gap-2">
                  <span>Attachments</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {lead.attachments.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {lead.attachments.map((att: any, idx) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att?.filename || "");

                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                        {/* File Icon/Thumbnail */}
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden border border-gray-200">
                              <img
                                src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${att?.path}`}
                                alt={att?.originalName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getFileIcon(att?.filename || "")}
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{att.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ''} •
                            {att.filename?.split('.').pop()?.toUpperCase()}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(att)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(att)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors text-gray-600 hover:text-green-600"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lost info */}
            {lead.isLost && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="mb-2 text-sm font-semibold text-red-600">Lost Information</div>
                <div className="space-y-1 text-sm text-red-800">
                  <div>Lost Date: {lead.lostDate ? new Date(lead.lostDate).toLocaleDateString() : 'N/A'}</div>
                  <div>Reason: {lead.lostReason || 'Not specified'}</div>
                </div>
              </div>
            )}

            {/* Won info */}
            {lead.isWon && (
              <div className="rounded-lg bg-green-50 p-4">
                <div className="mb-2 text-sm font-semibold text-green-700">Won Information</div>
                <div className="space-y-1 text-sm text-green-800">
                  <div>Won Date: {lead.wonDate ? new Date(lead.wonDate).toLocaleDateString() : 'N/A'}</div>
                  <div>Amount: {lead.amount ? `₹${lead.amount.toLocaleString()}` : 'Not specified'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Image Preview Modal */}
      {previewAttachment && (
        <CenterDialog
          isOpen={true}
          onClose={() => setPreviewAttachment(null)}
        >
          <div className="relative">
            <img
              src={previewAttachment.url}
              alt={previewAttachment.name}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <a
                href={previewAttachment.url}
                download={previewAttachment.name}
                className="bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5 text-gray-700" />
              </a>
            </div>
          </div>
        </CenterDialog>
      )}
    </>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | React.ReactNode | null;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-gray-900">
        {typeof value === 'string' || value === undefined || value === null
          ? value || '-'
          : value}
      </div>
    </div>
  );
}