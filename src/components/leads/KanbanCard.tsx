// components/leads/LeadsKanbanView.tsx
// Kanban board with Board / Lost / Won sub-views + drag-and-drop

import { useState, useCallback, useEffect } from 'react';
import { FiSearch, FiPhone, FiMail, FiEye, FiEdit } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiStatus } from './types';
import { Edit, Eye, RefreshCw } from 'lucide-react';
import DataTable, { Column } from '@/components/DataTable';

interface Props {
    leads: ApiLead[];
    lostLeads: ApiLead[];
    wonLeads: ApiLead[];
    statuses: any[];
    onEdit: (lead: ApiLead) => void;
    onView: (lead: ApiLead) => void;
    onRefresh: () => void;
    counts?: Record<string, number>;
    permissions?: { create: boolean; update: boolean; delete: boolean };
}

type SubView = 'board' | 'lost' | 'won';

export default function KanbanCard({
    lead, onDragStart, onView, onEdit, onMarkLost, onMarkWon, isUpdating
}: {
    lead: ApiLead;
    onDragStart: () => void;
    onView: () => void;
    onEdit?: () => void;
    onMarkLost?: () => void;
    onMarkWon?: () => void;
    isUpdating?: boolean;
}) {
    return (
        <div
            draggable={!isUpdating}
            onDragStart={!isUpdating ? onDragStart : undefined}
            className={`relative rounded-xl bg-white p-3 shadow-sm transition-shadow ${
                isUpdating ? "opacity-60 pointer-events-none" : "cursor-move hover:shadow-md"
            }`}
        >
            {isUpdating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/40">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                </div>
            )}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{lead.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{lead.companyName || '-'}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={onView}
                        title="View"
                        className="h-7 w-7 cursor-pointer rounded-full bg-blue-500 text-white flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                    >
                        <FiEye className="h-3.5 w-3.5" />
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            title="Edit"
                            className="h-7 w-7 cursor-pointer rounded-full bg-green-600 text-white flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                        >
                            <FiEdit className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <FiPhone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{lead.contact}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    <FiMail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {lead.assignedTo?.avatar ? (
                            <img src={lead.assignedTo.avatar} className="h-5 w-5 rounded-full object-cover flex-shrink-0" alt="" />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                {lead.assignedTo?.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        <span className="truncate text-xs">{lead.assignedTo?.fullName || 'Unassigned'}</span>
                    </div>
                    {lead.priority && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${lead.priority.toLowerCase() === 'high'
                            ? 'bg-red-100 text-red-600'
                            : lead.priority.toLowerCase() === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                            {lead.priority}
                        </span>
                    )}
                </div>
            </div>

            {/* Labels */}
            {lead.leadLabel && lead.leadLabel.length > 0 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto">
                    {lead.leadLabel.map((label) => (
                        <span
                            key={label._id}
                            style={{ backgroundColor: label.color }}
                            className="flex-shrink-0 rounded px-2 py-0.5 text-[11px] font-medium text-white"
                        >
                            {label.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}