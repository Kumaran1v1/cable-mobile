export interface MonthlyEntry {
  _id?: string;
  customerId: string;
  month: string; // YYYY-MM e.g. "2026-09"
  amount: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentStatus: "PAID" | "PENDING";
  remarks?: string;
  isCurrentMonth?: boolean;
  isPastPending?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  _id: string;
  name: string;
  mobile: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  monthlyEntry?: MonthlyEntry | null;
  hasPreviousPending?: boolean;
  previousPendingTotal?: number;
}

export interface GridCustomer {
  _id: string;
  name: string;
  mobile: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  entries: Record<string, MonthlyEntry | null>; // keyed by "YYYY-MM"
}

export interface YearGridResponse {
  success: boolean;
  count: number;
  year: string;
  monthSummaries: Record<string, { totalAmount: number; totalPaid: number; totalPending: number }>;
  data: GridCustomer[];
}

export interface CreateCustomerPayload {
  name: string;
  mobile: string;
  status?: "active" | "inactive";
}

export interface SaveMonthlyEntryPayload {
  customerId: string;
  month: string;
  amount: number;
  paymentStatus: "PAID" | "PENDING";
  paidAmount?: number;
  remarks?: string;
}

export interface CustomerHistoryResponse {
  success: boolean;
  customer: Customer;
  currentMonth: string;
  count: number;
  data: MonthlyEntry[];
}
