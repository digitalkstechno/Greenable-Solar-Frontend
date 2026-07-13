const API = process.env.NEXT_PUBLIC_API_URL;
import axios from "axios";

export const baseUrl = {
  userSignup: `${API}users/signup`,
  userLogin: `${API}users/login`,
  userAdd: `${API}users/add-user`,
  getAllUsers: `${API}users`,
  findUserById: `${API}users`,
  userUpdate: `${API}users`,
  deleteUser: `${API}users`,
  currentStaff: `${API}users/me`,
  addRole: `${API}role`,
  getAllRoles: `${API}role`,
  findRoleById: `${API}role`,
  updateRole: `${API}role`,
  deleteRole: `${API}role`,
  department: `${API}role`,
  // addStaff: `${API}staff/create`,
  // getAllStaff: `${API}staff`,
  // findStaffById: `${API}staff`,
  // updateStaff: `${API}staff`,
  // deleteStaff: `${API}staff`,
  addLead: `${API}lead/create`,
  getAllLeads: `${API}lead`,
  myLeads: `${API}lead/my`,
  findLeadById: `${API}lead`,
  updateLead: `${API}lead`,
  deleteLead: `${API}lead`,
  leadSources: `${API}leadsources`,
  leadStatuses: `${API}leadstatus`,
  leadCountSummary: `${API}lead/count-summary`,
  myLeadCountSummary: `${API}lead/count-summary/my`,
  downloadAttachment: `${API}lead/attachments/download`,
  generateQuotationPdf: `${API}quotation/generate`,
  getKanbanData: `${API}lead/kanban`,
  getKanbanStatusLeads: `${API}lead/kanban-status`,
  getKanbanStatusTasks: `${API}task/kanban-status`,
  updateKanbanStatus: `${API}lead`,
  leadUpcomingFollowups: `${API}lead/followups/upcoming`,
  leadUpcomingFollowupsMy: `${API}lead/followups/upcoming/my`,
  leadDueFollowups: `${API}lead/followups/due`,
  leadDueFollowupsMy: `${API}lead/followups/due/my`,
  leadLabels: `${API}leadlabel`,
  getWonLeads: `${API}lead/won`,
  getLostLeads: `${API}lead/lost`,
  exportLeads: `${API}lead/export`,
  importLeadsTemplate: `${API}lead/import-template`,
  bulkImportLeads: `${API}lead/bulk-import`,
  teams: `${API}team`,
  organizations: `${API}organization`,
  myTasks: `${API}task/my`,
  taskSummary: `${API}task/summary`,
  myTaskSummary: `${API}task/my-summary`,
  taskKanban: `${API}task/kanban`,
  taskStatuses: `${API}taskstatus`,
  createTask: `${API}task/create`,
  getAllTasks: `${API}task`,
  findTaskById: `${API}task`,
  updateTask: `${API}task`,
  deleteTask: `${API}task`,
  updateTaskStatus: `${API}task`,
  updateTaskPriority: `${API}task`,
  todayTasks: `${API}task/today`,
  category: `${API}category`,
  product: `${API}product`,
  stock: `${API}stock`,
  getBaseUrl: API,
  projectDetail: `${API}project-detail`,
  leadPayments: `${API}lead`,
  dashboard: `${API}dashboard`,
  dashboardRevenue: `${API}dashboard/revenue`,
  dashboardKwGrowth: `${API}dashboard/kw-growth`,
  dashboardFollowupAnalysis: `${API}dashboard/followup-analysis`,
};

const TOKEN_COOKIE_NAME = "crm_token";

export function setAuthToken(token: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(
    token,
  )}; path=/; expires=${expires.toUTCString()}`;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    if (c.startsWith(`${TOKEN_COOKIE_NAME}=`)) {
      return decodeURIComponent(c.substring(TOKEN_COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export function clearAuthToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// axios.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error?.response?.status === 401) {
//       console.error("🔴 401 Unauthorized on API:", error?.config?.url, error?.config?.method);
//       clearAuthToken();
//       if (typeof window !== "undefined") {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );
