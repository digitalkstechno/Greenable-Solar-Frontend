export type ApiUser = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
};

export type ApiSource = {
  _id: string;
  name: string;
};

export type ApiStatus = {
  _id: string;
  name: string;
};

export type LeadLabel = {
  _id: string;
  name: string;
  color?: string;
};

export type ApiLead = {
  _id: string;
  fullName: string;
  companyName?: string;
  address?: string;
  contact: string;
  email: string;
  leadSource?: ApiSource;
  leadLabel?: LeadLabel[];
  leadStatus?: ApiStatus;
  assignedTo?: ApiUser;
  priority?: "High" | "Medium" | "Low";
  lastFollowUp?: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  isActive?: boolean;
  attachments?: { name: string; url?: string }[];
  isLost?: boolean;
  isWon?: boolean;
  amount?: number;
  lostReason?: string;
  lostDate?: string;
  wonDate?: string;
  labels?: string[] | LeadLabel[];
};

export type StatusGroup = {
  id: string;
  title: string;
  leads: ApiLead[];
};

export type AddLeadForm = {
  name: string;
  companyName?: string;
  address?: string;
  phone: string;
  email: string;
  source: string;
  label: string[];
  status: string;
  staff: string;
  priority: "High" | "Medium" | "Low";
  lastFollowUp: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  isActive?: boolean;
  attachments?: File[];
};
