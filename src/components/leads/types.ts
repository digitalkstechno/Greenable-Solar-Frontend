// components/leads/types.ts
// Shared types used across all leads components

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

export type ApiFollowUp = {
  _id?: string;
  date: string;
  time: string;
  note: string;
  staff: ApiUser;
  createdAt?: string;
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
  priority?: 'High' | 'Medium' | 'Low' | 'high' | 'medium' | 'low';
  lastFollowUp?: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  isActive?: boolean;
  followUps?: ApiFollowUp[];
  attachments?: {
    _id?: string;
    originalName?: string;
    name?: string;
    path: string;
    filename: string;
    size?: number;
  }[];
  isLost?: boolean;
  isWon?: boolean;
  amount?: number;
  lostReason?: string;
  lostDate?: string;
  wonDate?: string;
  amountDate?: string;
};

export type AddLeadForm = {
  name: string;
  companyName?: string;
  address?: string;
  phone: string;
  email: string;
  source: string;
  labels: string[];
  status: string;
  staff: string;
  priority: 'High' | 'Medium' | 'Low';
  lastFollowUp: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  isActive?: boolean;
  attachments?: File[];
};

export type LeadCountSummary = {
  statusCounts: Record<string, number>;
  totalLeads: number;
  totalLost: number;
  totalWon: number;
};