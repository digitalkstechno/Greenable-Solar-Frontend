import React from "react";
import { FiPhone, FiMail, FiEye, FiEdit } from "react-icons/fi";
import { StatusGroup } from "./types";

interface KanbanBoardViewProps {
  statusGroups: StatusGroup[];
  visibleStatusNames: string[] | null;
  draggingId: string | null;
  loadingMoreMap: Record<string, boolean>;
  handleDragStart: (leadId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (statusId: string) => void;
  handleView: (leadId: string) => void;
  handleEdit: (leadId: string) => void;
  loadMoreLeads: (statusId: string) => void;
}

export default function KanbanBoardView({
  statusGroups,
  visibleStatusNames,
  draggingId,
  loadingMoreMap,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleView,
  handleEdit,
  loadMoreLeads,
}: KanbanBoardViewProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 h-[calc(100vh-288px)] w-100">
        {statusGroups
          .filter(
            (status) =>
              !visibleStatusNames || visibleStatusNames.includes(status.title)
          )
          .map((status) => (
            <div key={status.id} className="w-80 flex-shrink-0">
              <div className="bg-secondary rounded-t-xl px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white capitalize">
                    {status.title}
                  </h3>
                  <span className="rounded-full bg-[#ffffff] px-3 py-1 text-sm font-medium text-[#0a2352]">
                    {status.leads.length}
                  </span>
                </div>
              </div>
              <div
                className="flex-1 h-[calc(100vh-385px)] overflow-y-auto rounded-b-lg bg-[#f4f7fb] p-4"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status.id)}
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  if (
                    target.scrollHeight - target.scrollTop <=
                    target.clientHeight + 20
                  ) {
                    loadMoreLeads(status.id);
                  }
                }}
              >
                {status.leads.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No leads
                  </div>
                ) : (
                  <div className="space-y-3">
                    {status.leads.map((lead) => (
                      <div
                        key={lead._id}
                        className="cursor-move rounded-lg bg-[#ffffff] p-3 transition-shadow hover:shadow-md"
                        draggable
                        onDragStart={() => handleDragStart(lead._id)}
                      >
                        
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {lead.fullName}
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              {lead.companyName || "-"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(lead._id)}
                              className="h-8 w-8 rounded-full bg-[#007bff] text-[#ffffff] flex items-center justify-center hover:-translate-y-1 hover:shadow-md transition-transform transition-shadow duration-200 ease-out"
                              title="View"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleEdit(lead._id)}
                              className="h-8 w-8 rounded-full bg-[#008001] text-[#ffffff] flex items-center justify-center hover:-translate-y-1 hover:shadow-md transition-transform transition-shadow duration-200 ease-out"
                              title="Edit"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                   
                        <div className="mt-2 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2">
                                <FiPhone className="h-4 w-4 text-dark flex-shrink-0" />
                                <span className="truncate">{lead.contact}</span>
                              </div>

                              <div className="flex items-center gap-2 min-w-0">
                                <FiMail className="h-4 w-4 text-dark flex-shrink-0" />
                                <span className="truncate">{lead.email}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {lead.assignedTo?.avatar ? (
                                  <img
                                    src={lead.assignedTo.avatar}
                                    alt={lead.assignedTo.fullName}
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#9160ff] to-[#c387ff] flex items-center justify-center text-xs font-semibold text-white">
                                    {lead.assignedTo?.fullName
                                      ?.charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate">
                                  {lead.assignedTo?.fullName || "Unassigned"}
                                </span>
                              </div>
                            </div>

                           
                            {lead.priority && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600 capitalize whitespace-nowrap">
                                {lead.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        
                        <div className="mt-3 flex gap-2 overflow-x-auto whitespace-nowrap">
                          {lead.leadLabel?.map((label) => (
                            <span
                              key={label._id}
                              style={{ backgroundColor: label.color }}
                              className="px-2 py-1 text-xs font-medium text-white rounded-md flex-shrink-0"
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {loadingMoreMap[status.id] && (
                  <div className="flex justify-center mt-3 p-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
