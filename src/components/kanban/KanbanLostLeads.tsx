import React from "react";
import { FiPhone, FiMail } from "react-icons/fi";
import { ApiLead } from "./types";

interface KanbanLostLeadsProps {
  lostLeads: ApiLead[];
  lostSearch: string;
  setLostSearch: (value: string) => void;
  handleView: (id: string) => void;
  handleEdit: (id: string) => void;
  reactivateLead: (id: string) => void;
}

export default function KanbanLostLeads({
  lostLeads,
  lostSearch,
  setLostSearch,
  handleView,
  handleEdit,
  reactivateLead,
}: KanbanLostLeadsProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center">
            ×
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-800">Lost Leads</h2>
            <p className="text-sm text-red-700">Leads that were not converted</p>
          </div>
        </div>
        <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-semibold text-red-800">
          {lostLeads.length} Total
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-white border border-red-100 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            Show
            <select className="border rounded px-2 py-1">
              <option>100</option>
            </select>
            entries
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Search:</span>
            <input
              value={lostSearch}
              onChange={(e) => setLostSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="table-responsive overflow-x-auto mt-4">
          <table className="min-w-[1000px] w-full whitespace-nowrap">
            <thead>
              <tr className="bg-[#dee2e6] text-black text-xs font-bold">
                <th className="px-4 py-3 text-left">Lead Name</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Lost Date</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="sticky right-0 z-10 bg-[#dee2e6] px-4 py-3 text-left shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {lostLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-600"
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                lostLeads.map((l) => (
                  <tr key={l._id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {l.fullName}
                        </span>
                        <span className="text-xs text-red-600">• Lost</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[180px] truncate text-sm text-gray-700"
                        title={l.companyName || ""}
                      >
                        {l.companyName || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[220px] truncate text-sm text-gray-700"
                        title={l.address || ""}
                      >
                        {l.address || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <FiPhone className="h-4 w-4 text-gray-500" />
                          <span
                            title={l.contact || ""}
                            className="truncate max-w-[140px] block"
                          >
                            {l.contact}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMail className="h-4 w-4 text-gray-500" />
                          <span
                            title={l.email || ""}
                            className="truncate max-w-[140px] block"
                          >
                            {l.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {l.lostDate
                        ? new Date(l.lostDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[160px] truncate text-sm text-gray-700"
                        title={l.assignedTo?.fullName || ""}
                      >
                        {l.assignedTo?.fullName || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[160px] truncate text-sm text-gray-700"
                        title={l.lostReason || ""}
                      >
                        {l.lostReason || "Not specified"}
                      </span>
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-4 py-3 shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.1)]">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(l._id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(l._id)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => reactivateLead(l._id)}
                          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                        >
                          Reactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
