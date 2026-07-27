import React from "react";
import Dialog from "@/components/Dialog";
import Select from "react-select";
import TimePicker from "@/components/ui/TimePicker";
import { AddLeadForm, ApiLead, ApiSource, ApiStatus, ApiUser, LeadLabel } from "./types";

interface KanbanLeadAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingLead: ApiLead | null;
  addForm: AddLeadForm;
  setAddForm: React.Dispatch<React.SetStateAction<AddLeadForm>>;
  handleSaveLead: () => void;
  addingLead: boolean;
  requiredFields: string[];
  sources: ApiSource[];
  statuses: ApiStatus[];
  staffMembers: ApiUser[];
  leadLabels: LeadLabel[];
}

export default function KanbanLeadAddDialog({
  isOpen,
  onClose,
  editingLead,
  addForm,
  setAddForm,
  handleSaveLead,
  addingLead,
  requiredFields,
  sources,
  statuses,
  staffMembers,
  leadLabels,
}: KanbanLeadAddDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingLead ? "Edit Lead" : "Add Lead"}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLead}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={addingLead}
          >
            {addingLead
              ? "Saving..."
              : editingLead
              ? "Update Lead"
              : "Save Lead"}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Full Name{" "}
            {requiredFields.includes("fullName") && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="text"
            value={addForm.name}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, name: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Company Name{" "}
            {requiredFields.includes("companyName") && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="text"
            value={addForm.companyName ?? ""}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, companyName: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Address{" "}
            {requiredFields.includes("address") && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <textarea
            rows={3}
            value={addForm.address ?? ""}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, address: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Phone{" "}
            {requiredFields.includes("contact") && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="text"
            value={addForm.phone}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, phone: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email{" "}
            {requiredFields.includes("email") && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="email"
            value={addForm.email}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, email: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Source{" "}
              {requiredFields.includes("leadSource") && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <select
              value={addForm.source}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, source: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Source</option>
              {sources.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {/* Status field only shown in add mode */}
          {!editingLead && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Status{" "}
                {requiredFields.includes("leadStatus") && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <select
                value={addForm.status}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="">Select Status</option>
                {statuses.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Assigned Staff{" "}
              {requiredFields.includes("assignedTo") && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <select
              value={addForm.staff}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, staff: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Staff</option>
              {staffMembers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Priority{" "}
              {requiredFields.includes("priority") && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <select
              value={addForm.priority}
              onChange={(e) =>
                setAddForm((p) => ({
                  ...p,
                  priority: e.target.value as AddLeadForm["priority"],
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Lead Labels{" "}
            {requiredFields.includes("labels") && (
              <span className="text-red-500">*</span>
            )}
          </label>

          <Select
            isMulti
            options={leadLabels.map((label) => ({
              value: label._id,
              label: label.name,
            }))}
            value={leadLabels
              .filter((label) => addForm.label.includes(label._id))
              .map((label) => ({
                value: label._id,
                label: label.name,
              }))}
            onChange={(selected) => {
              const values = selected ? selected.map((item) => item.value) : [];
              setAddForm((p) => ({ ...p, label: values }));
            }}
            className="mt-1"
            classNamePrefix="react-select"
            placeholder="Select labels..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Last Follow-Up
          </label>
          <input
            type="date"
            value={addForm.lastFollowUp}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, lastFollowUp: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Next Follow-up fields only shown in add mode */}
        {!editingLead && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={addForm.nextFollowupDate ?? ""}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    nextFollowupDate: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Next Follow-Up Time
              </label>
              <TimePicker
                value={addForm.nextFollowupTime ?? ""}
                onChange={(time) =>
                  setAddForm((p) => ({
                    ...p,
                    nextFollowupTime: time,
                  }))
                }
              />
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Note
          </label>
          <textarea
            rows={3}
            value={addForm.note ?? ""}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, note: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Attachments
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              setAddForm((p) => ({ ...p, attachments: files }));
            }}
            className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {addForm?.attachments && addForm.attachments.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {addForm.attachments.map((file, index) => (
                <li key={index}>📎 {file.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={addForm.isActive ?? true}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, isActive: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="isActive"
            className="text-sm font-medium text-slate-700"
          >
            Active
          </label>
        </div>
      </form>
    </Dialog>
  );
}
