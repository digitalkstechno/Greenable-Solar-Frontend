import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { baseUrl, getAuthToken } from "@/config";
import { ListCollapse, Plus } from "lucide-react";

import KanbanBoardView from "@/components/kanban/KanbanBoardView";
import KanbanLostLeads from "@/components/kanban/KanbanLostLeads";
import KanbanWonLeads from "@/components/kanban/KanbanWonLeads";
import KanbanLeadAddDialog from "@/components/kanban/KanbanLeadAddDialog";
import KanbanLeadViewDialog from "@/components/kanban/KanbanLeadViewDialog";
import {
  ApiUser,
  ApiSource,
  ApiStatus,
  LeadLabel,
  ApiLead,
  StatusGroup,
  AddLeadForm,
} from "@/components/kanban/types";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [staffMembers, setStaffMembers] = useState<ApiUser[]>([]);
  const [leadLabels, setLeadLabels] = useState<LeadLabel[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "board" | "lost" | "won">("board");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);
  const [viewLead, setViewLead] = useState<ApiLead | null>(null);
  const [addingLead, setAddingLead] = useState(false);
  const [lostSearch, setLostSearch] = useState("");
  const [wonSearch, setWonSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [visibleStatusNames, setVisibleStatusNames] = useState<string[] | null>(null);
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const [loadingMoreMap, setLoadingMoreMap] = useState<Record<string, boolean>>({});
  const [lostLeadsList, setLostLeadsList] = useState<ApiLead[]>([]);
  const [wonLeadsList, setWonLeadsList] = useState<ApiLead[]>([]);

  const [addForm, setAddForm] = useState<AddLeadForm>({
    name: "",
    companyName: "",
    address: "",
    phone: "",
    email: "",
    source: "",
    label: [],
    status: "",
    staff: "",
    priority: "Medium",
    lastFollowUp: new Date().toISOString().split("T")[0],
    nextFollowupDate: "",
    nextFollowupTime: "",
    note: "",
    isActive: true,
    attachments: [],
  });
  const [editingStatus, setEditingStatus] = useState("");
  const [editingNextFollowupDate, setEditingNextFollowupDate] = useState("");
  const [editingNextFollowupTime, setEditingNextFollowupTime] = useState("");
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  useEffect(() => {
    const loadRequiredFields = () => {
      const saved = localStorage.getItem('leadRequiredFields');
      if (saved) {
        try {
          setRequiredFields(JSON.parse(saved));
        } catch {
          setRequiredFields(['fullName', 'contact', 'email', 'leadSource', 'leadStatus', 'assignedTo']);
        }
      } else {
        setRequiredFields(['fullName', 'contact', 'email', 'leadSource', 'leadStatus', 'assignedTo']);
      }
    };

    loadRequiredFields();
    window.addEventListener('fieldSettingsUpdated', loadRequiredFields);
    return () => window.removeEventListener('fieldSettingsUpdated', loadRequiredFields);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("kanbanVisibleStatusNames");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setVisibleStatusNames(parsed.filter((x) => typeof x === "string"));
          }
        } catch {
        }
      }
    }
  }, []);

  const fetchLeads = async () => {
    try {
      const token = getAuthToken();
      const kanbanUrl = baseUrl.getAllLeads.replace(/\/?$/, '') + '/kanban';
      const kanbanRes = await axios.get(kanbanUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const kanbanData = kanbanRes.data?.data || [];
      const initialLeads: ApiLead[] = kanbanData.flatMap((g: any) => g.leads || []);
      setLeads(initialLeads);

      const initPages: Record<string, number> = {};
      const initHasMore: Record<string, boolean> = {};
      kanbanData.forEach((g: any) => {
        initPages[g.statusId] = 1;
        initHasMore[g.statusId] = g.leads?.length === 10;
      });
      setPageMap(initPages);
      setHasMoreMap(initHasMore);
    } catch (error) {
      console.error("Failed to fetch leads", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreLeads = async (statusId: string) => {
    if (loadingMoreMap[statusId] || !hasMoreMap[statusId]) return;
    setLoadingMoreMap(prev => ({ ...prev, [statusId]: true }));
    try {
      const token = getAuthToken();
      const nextPage = (pageMap[statusId] || 1) + 1;
      const res = await axios.get(`${baseUrl.getAllLeads}?status=${statusId}&page=${nextPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data || [];
      if (data.length > 0) {
        setLeads(prev => {
          const existingIds = new Set(prev.map(l => l._id));
          const newUnique = data.filter((l: ApiLead) => !existingIds.has(l._id));
          return [...prev, ...newUnique];
        });
        setPageMap(prev => ({ ...prev, [statusId]: nextPage }));
        setHasMoreMap(prev => ({ ...prev, [statusId]: data.length === 10 }));
      } else {
        setHasMoreMap(prev => ({ ...prev, [statusId]: false }));
      }
    } catch (error) {
      console.error("Failed to load more leads", error);
    } finally {
      setLoadingMoreMap(prev => ({ ...prev, [statusId]: false }));
    }
  };

  const fetchLostLeads = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.getLostLeads, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLostLeadsList(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch lost leads", error);
      setLostLeadsList([]);
    }
  };

  const fetchWonLeads = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.getWonLeads, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWonLeadsList(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch won leads", error);
      setWonLeadsList([]);
    }
  };

  const fetchSources = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.leadSources, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data ?? res.data;
      setSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch sources", error);
    }
  };

  const fetchLeadLabels = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.leadLabels, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data;
      setLeadLabels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch lead labels", error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.leadStatuses, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data ?? res.data;
      setStatuses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.getAllUsers, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data ?? res.data;
      setStaffMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch staff", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.currentStaff, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch current user", error);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchSources();
    fetchStatuses();
    fetchStaff();
    fetchCurrentUser();
    fetchLostLeads();
    fetchWonLeads();
    fetchLeadLabels();
  }, []);

  const handleSaveLead = async () => {
    const roleStr = `${currentUser?.role?.roleName || ''} ${currentUser?.role?.name || ''} ${currentUser?.roleName || ''} ${typeof currentUser?.department === 'string' ? currentUser.department : ''} ${currentUser?.department?.roleName || ''} ${currentUser?.department?.name || ''} ${currentUser?.departmentName || ''}`.toLowerCase();
    const isSalesExecutive = roleStr.includes('sales');
    if (!addForm.staff && currentUser?._id && isSalesExecutive) {
      setAddForm((prev) => ({ ...prev, staff: String(currentUser._id) }));
    }
    const missingFields: string[] = [];
    if (requiredFields.includes('fullName') && !addForm.name) missingFields.push('Full Name');
    if (requiredFields.includes('companyName') && !addForm.companyName) missingFields.push('Company Name');
    if (requiredFields.includes('address') && !addForm.address) missingFields.push('Address');
    if (requiredFields.includes('contact') && !addForm.phone) missingFields.push('Phone');
    if (requiredFields.includes('email') && !addForm.email) missingFields.push('Email');
    if (requiredFields.includes('leadSource') && !addForm.source) missingFields.push('Source');
    if (requiredFields.includes('leadStatus') && !addForm.status && !editingLead) missingFields.push('Status');
    if (requiredFields.includes('assignedTo') && !addForm.staff) missingFields.push('Assigned Staff');
    if (requiredFields.includes('priority') && !addForm.priority) missingFields.push('Priority');
    if (requiredFields.includes('labels') && (!addForm.label || addForm.label.length === 0)) missingFields.push('Lead Labels');

    if (missingFields.length > 0) {
      toast.error(`Required fields missing: ${missingFields.join(', ')}`);
      return;
    }

    setAddingLead(true);
    try {
      const token = getAuthToken();
      const payload = {
        fullName: addForm.name.trim(),
        companyName: addForm.companyName?.trim() || "",
        address: addForm.address?.trim() || "",
        contact: addForm.phone.trim(),
        email: addForm.email.trim().toLowerCase(),
        leadSource: addForm.source,
        leadStatus: addForm.status,
        assignedTo: addForm.staff || (isSalesExecutive ? String(currentUser?._id || '') : undefined),
        priority: addForm.priority.toLowerCase(),
        lastFollowUp: addForm.lastFollowUp,
        nextFollowupDate: addForm.nextFollowupDate || null,
        nextFollowupTime: addForm.nextFollowupTime || null,
        note: addForm.note?.trim() || "",
        isActive: addForm.isActive ?? true,
        leadLabel: addForm.label || [], 
      };

      if (editingLead) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { leadStatus, nextFollowupDate, ...editPayload } = payload;
        await axios.put(`${baseUrl.updateLead}/${editingLead._id}`, editPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Lead updated successfully");
      } else {
        await axios.post(baseUrl.addLead, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Lead added successfully");
      }

      setShowAddDialog(false);
      setEditingLead(null);
      resetForm();
      fetchLeads();
      fetchLostLeads();
      fetchWonLeads();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save lead");
    } finally {
      setAddingLead(false);
    }
  };

  const resetForm = () => {
    setAddForm({
      name: "",
      companyName: "",
      address: "",
      phone: "",
      email: "",
      source: "",
      label: [],
      status: "",
      staff: "",
      priority: "Medium",
      lastFollowUp: new Date().toISOString().split("T")[0],
      nextFollowupDate: "",
      nextFollowupTime: "",
      note: "",
      isActive: true,
      attachments: [],
    });
  };

  const handleEdit = (id: string) => {
    const lead = leads.find((l) => l._id === id) ||
      lostLeadsList.find((l) => l._id === id) ||
      wonLeadsList.find((l) => l._id === id);

    if (!lead) return;
    let labelIds: string[] = [];
    if (lead.leadLabel) {
      labelIds = lead.leadLabel.map((label: any) =>
        typeof label === 'string' ? label : label._id
      );
    }

    setEditingLead(lead);
    setAddForm({
      name: lead.fullName || "",
      companyName: lead.companyName || "",
      address: lead.address || "",
      phone: lead.contact || "",
      email: lead.email || "",
      source: lead.leadSource?._id || "",
      label: labelIds,
      status: lead.leadStatus?._id || "",
      staff: lead.assignedTo?._id || "",
      priority: lead.priority || "Medium",
      lastFollowUp: lead.lastFollowUp || new Date().toISOString().split("T")[0],
      nextFollowupDate: lead.nextFollowupDate || "",
      nextFollowupTime: lead.nextFollowupTime || "",
      note: lead.note || "",
      isActive: lead.isActive ?? true,
      attachments: [],
    });
    setShowAddDialog(true);
  };

  const handleView = (id: string) => {
    const lead = leads.find((l) => l._id === id) ||
      lostLeadsList.find((l) => l._id === id) ||
      wonLeadsList.find((l) => l._id === id);

    if (!lead) return;

    setViewLead(lead);
    setEditingStatus(lead.leadStatus?._id || "");
    setEditingNextFollowupDate(lead.nextFollowupDate || "");
    setEditingNextFollowupTime(lead.nextFollowupTime || "");
  };

  const handleSaveViewChanges = async () => {
    if (!viewLead) return;

    try {
      const token = getAuthToken();
      const payload: any = {
        leadStatus: editingStatus,
        nextFollowupDate: editingNextFollowupDate || null,
        nextFollowupTime: editingNextFollowupTime || null,
      };

      await axios.put(`${baseUrl.updateLead}/${viewLead._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Lead updated successfully");
      fetchLeads();
      fetchLostLeads();
      fetchWonLeads();
      setViewLead(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update lead");
    }
  };

  const reactivateLead = async (id: string) => {
    try {
      const token = getAuthToken();
      const qualifiedStatus = statuses.find(s => s.name.toLowerCase() === 'qualified');

      await axios.put(
        `${baseUrl.updateLead}/${id}`,
        {
          isLost: false,
          isWon: false,
          leadStatus: qualifiedStatus?._id || null
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Lead reactivated successfully");
      fetchLeads();
      fetchLostLeads();
      fetchWonLeads();
    } catch {
      toast.error("Failed to reactivate lead");
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggingId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (statusId: string) => {
    if (!draggingId) return;

    const lead = leads.find((l) => l._id === draggingId);
    if (!lead) return;

    const status = statuses.find((s) => s._id === statusId);
    if (!status) return;

    const updateLeadStatus = async () => {
      try {
        const token = getAuthToken();
        await axios.put(
          `${baseUrl.updateLead}/${draggingId}`,
          { leadStatus: statusId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success(`Lead moved to ${status.name}`);
        fetchLeads();
      } catch {
        toast.error("Failed to update lead status");
      }
    };

    updateLeadStatus();
    setDraggingId(null);
  };

  const filteredLeads = leads.filter(
    (lead) =>
      !lead.isLost &&
      !lead.isWon &&
      (lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
        lead.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase())),
  );

  const lostLeads = lostLeadsList.filter(
    (lead) =>
      lead.fullName.toLowerCase().includes(lostSearch.toLowerCase()) ||
      lead.companyName?.toLowerCase().includes(lostSearch.toLowerCase())
  );

  const wonLeads = wonLeadsList.filter(
    (lead) =>
      lead.fullName.toLowerCase().includes(wonSearch.toLowerCase()) ||
      lead.companyName?.toLowerCase().includes(wonSearch.toLowerCase())
  );

  const wonTotalAmount = wonLeads.reduce((sum, lead) => {
    const amount = typeof lead.amount === 'number' ? lead.amount : parseFloat(String(lead.amount || 0));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const statusGroups: StatusGroup[] = statuses.map((status) => ({
    id: status._id,
    title: status.name,
    leads: filteredLeads.filter((lead) => lead.leadStatus?._id === status._id),
  }));

  if (loading) {
    return (
      <>
        <div className="flex h-full items-center justify-center">
          <div className="text-xl text-gray-600">Loading leads...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 p-4 mb-2 rounded-3xl border border-gray-200 bg-white shadow-sm">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-600">Manage your leads pipeline</p>
          </div>

          <button
            className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary hover:bg-blue-700 text-white text-sm font-semibold shadow"
            onClick={() => {
              setEditingLead(null);
              resetForm();
              setShowAddDialog(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>

          <button
            onClick={() => router.push('/leads')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition text-sm"
          >
            <ListCollapse className="w-4 h-4 text-gray-700" />
            List
          </button>
        </div>

       
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("board")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "board"
                ? "bg-secondary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Board View
            </button>
            <button
              onClick={() => setView("lost")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "lost"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Lost Leads
            </button>
            <button
              onClick={() => setView("won")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "won"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Won Leads
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
        </div>

   
        <div className="flex-1 overflow-auto px-4 pb-2">

          {view === "board" && (
            <KanbanBoardView
              statusGroups={statusGroups}
              visibleStatusNames={visibleStatusNames}
              draggingId={draggingId}
              loadingMoreMap={loadingMoreMap}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleView={handleView}
              handleEdit={handleEdit}
              loadMoreLeads={loadMoreLeads}
            />
          )}

    
          {view === "lost" && (
            <KanbanLostLeads
              lostLeads={lostLeads}
              lostSearch={lostSearch}
              setLostSearch={setLostSearch}
              handleView={handleView}
              handleEdit={handleEdit}
              reactivateLead={reactivateLead}
            />
          )}

       
          {view === "won" && (
            <KanbanWonLeads
              wonLeads={wonLeads}
              wonSearch={wonSearch}
              setWonSearch={setWonSearch}
              handleView={handleView}
              handleEdit={handleEdit}
              wonTotalAmount={wonTotalAmount}
            />
          )}
        </div>

    
        <KanbanLeadAddDialog
          isOpen={showAddDialog}
          onClose={() => {
            setShowAddDialog(false);
            setEditingLead(null);
            resetForm();
          }}
          editingLead={editingLead}
          addForm={addForm}
          setAddForm={setAddForm}
          handleSaveLead={handleSaveLead}
          addingLead={addingLead}
          requiredFields={requiredFields}
          sources={sources}
          statuses={statuses}
          staffMembers={staffMembers}
          leadLabels={leadLabels}
        />

        
        <KanbanLeadViewDialog
          viewLead={viewLead}
          setViewLead={setViewLead}
          handleSaveViewChanges={handleSaveViewChanges}
          editingStatus={editingStatus}
          setEditingStatus={setEditingStatus}
          editingNextFollowupDate={editingNextFollowupDate}
          setEditingNextFollowupDate={setEditingNextFollowupDate}
          editingNextFollowupTime={editingNextFollowupTime}
          setEditingNextFollowupTime={setEditingNextFollowupTime}
          statuses={statuses}
        />
      </div>
    </>
  );
}