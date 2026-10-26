export const CATEGORIES = ["Network Equipment", "Fleet", "Facilities", "IT Services"] as const;
export type Category = (typeof CATEGORIES)[number];

export const ROLES = ["sourcing_manager", "finance_approver"] as const;
export type Role = (typeof ROLES)[number];

export type Status = "pending" | "approved";

export interface SavingsEvent {
  id: number;
  supplier: string;
  category: Category;
  baselinePrice: number;
  negotiatedPrice: number;
  date: string;
  status: Status;
  createdBy: string;
  approvedBy: string | null;
  costCenter: string | null;
}

export interface AuditEntry {
  id: number;
  at: string;
  actor: string;
  role: Role;
  action: string;
  eventId: number | null;
  detail: string;
}

export interface Summary {
  approvedTotal: number;
  pendingTotal: number;
  approvedCount: number;
  pendingCount: number;
  byCategory: { category: Category; total: number }[];
}

export const savingsOf = (e: Pick<SavingsEvent, "baselinePrice" | "negotiatedPrice">) =>
  e.baselinePrice - e.negotiatedPrice;
