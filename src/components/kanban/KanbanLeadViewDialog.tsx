import React from "react";
import Dialog from "@/components/Dialog";
import TimePicker from "@/components/ui/TimePicker";
import { ApiLead, ApiStatus } from "./types";

interface KanbanLeadViewDialogProps {
  viewLead: ApiLead | null;
  setViewLead: (lead: ApiLead | null) => void;
  handleSaveViewChanges: () => void;
  editingStatus: string;
  setEditingStatus: (status: string) => void;
  editingNextFollowupDate: string;
  setEditingNextFollowupDate: (date: string) => void;
  editingNextFollowupTime: string;
  setEditingNextFollowupTime: (time: string) => void;
  statuses: ApiStatus[];
}

export default function KanbanLeadViewDialog({
  viewLead,
  setViewLead,
  handleSaveViewChanges,
  editingStatus,
  setEditingStatus,
  editingNextFollowupDate,
  setEditingNextFollowupDate,
  editingNextFollowupTime,
  setEditingNextFollowupTime,
  statuses,
}: KanbanLeadViewDialogProps) {
  return (
    <Dialog
      isOpen={!!viewLead}
      onClose={() => setViewLead(null)}
      title="Lead Details"
      footer={
        <>
          <button
            onClick={() => setViewLead(null)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleSaveViewChanges}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
          >
            Save Changes
          </button>
        </>
      }
    >
      {viewLead && (
        <div className="space-y-4">
          <div className="font-semibold text-xl">{viewLead.fullName}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Company</div>
              <div>{viewLead.companyName || "-"}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Phone</div>
              <div>{viewLead.contact || "-"}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Email</div>
              <div>{viewLead.email || "-"}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Source</div>
              <div>{viewLead.leadSource?.name || "-"}</div>
            </div>
            {/* Status Selection Boxes */}
            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
              <div className="text-sm text-gray-600 mb-3">Status</div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setEditingStatus(s._id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editingStatus === s._id
                        ? "bg-secondary text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Assigned Staff</div>
              <div>{viewLead.assignedTo?.fullName || "-"}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Priority</div>
              <div>{viewLead.priority || "-"}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Last Follow-Up</div>
              <div>{viewLead.lastFollowUp || "-"}</div>
            </div>
          </div>
          {/* Editable Next Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Next Follow-Up Date
              </div>
              <input
                type="date"
                value={editingNextFollowupDate}
                onChange={(e) => setEditingNextFollowupDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Next Follow-Up Time
              </div>
              <TimePicker
                value={editingNextFollowupTime}
                onChange={(time) => setEditingNextFollowupTime(time)}
              />
            </div>
          </div>
          {viewLead.note && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Note</div>
              <div>{viewLead.note}</div>
            </div>
          )}
          {viewLead.attachments && viewLead.attachments.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Attachments</div>
              <div className="space-y-2 mt-2">
                {viewLead.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline block"
                  >
                    {attachment.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          {viewLead.isLost && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 font-medium">
                Lost Information
              </div>
              <div className="mt-2 text-sm">
                <div>
                  Lost Date:{" "}
                  {viewLead.lostDate
                    ? new Date(viewLead.lostDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <div>Reason: {viewLead.lostReason || "Not specified"}</div>
              </div>
            </div>
          )}
          {viewLead.isWon && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Won Information
              </div>
              <div className="mt-2 text-sm">
                <div>
                  Won Date:{" "}
                  {viewLead.wonDate
                    ? new Date(viewLead.wonDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <div>
                  Amount:{" "}
                  {viewLead.amount
                    ? `₹${viewLead.amount.toLocaleString()}`
                    : "Not specified"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
