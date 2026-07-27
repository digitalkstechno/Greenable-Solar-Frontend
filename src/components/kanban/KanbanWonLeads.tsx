import React from "react";
import { FiPhone, FiMail } from "react-icons/fi";
import { ApiLead } from "./types";

interface KanbanWonLeadsProps {
  wonLeads: ApiLead[];
  wonSearch: string;
  setWonSearch: (value: string) => void;
  handleView: (id: string) => void;
  handleEdit: (id: string) => void;
  wonTotalAmount: number;
}

export default function KanbanWonLeads({
  wonLeads,
  wonSearch,
  setWonSearch,
  handleView,
  handleEdit,
  wonTotalAmount,
}: KanbanWonLeadsProps) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-semibold text-green-800">Won Leads</h2>
            <p className="text-sm text-green-700">Leads that were converted</p>
          </div>
        </div>
        <span className="rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-800">
          {wonLeads.length} Total
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-white border border-green-100 p-4">
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
              value={wonSearch}
              onChange={(e) => setWonSearch(e.target.value)}
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
                <th className="px-4 py-3 text-left">Won Date</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="sticky right-0 z-10 bg-[#dee2e6] px-4 py-3 text-left shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {wonLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-600"
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                wonLeads.map((l) => (
                  <tr key={l._id} className="border-b">
                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[140px] truncate text-sm font-semibold text-gray-900"
                        title={l.fullName}
                      >
                        {l.fullName}
                      </span>
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
                        className="block max-w-[100px] truncate overflow-hidden text-sm text-red-700"
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
                      {l.wonDate
                        ? new Date(l.wonDate).toLocaleDateString()
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
                        className="block max-w-[120px] truncate overflow-hidden text-sm text-gray-700"
                        title={l.amount ? `₹${l.amount.toLocaleString()}` : ""}
                      >
                        {l.amount ? `₹${l.amount.toLocaleString()}` : "-"}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {wonLeads.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 text-sm font-semibold text-gray-900">
                  <td colSpan={6} className="px-4 py-3 text-right">
                    Total
                  </td>
                  <td className="px-4 py-3">
                    ₹{wonTotalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">&nbsp;</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
