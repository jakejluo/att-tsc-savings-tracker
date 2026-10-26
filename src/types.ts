export const CATEGORIES = ["Network Equipment", "Fleet", "Facilities", "IT Services"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Status = "pending" | "approved";

export interface SavingsEvent {
  id: number;
  supplier: string;
  category: Category;
  baselinePrice: number;
  negotiatedPrice: number;
  date: string;
  status: Status;
}

export const savingsOf = (e: SavingsEvent) => e.baselinePrice - e.negotiatedPrice;
