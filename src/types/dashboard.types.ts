export interface MonthlyOverviewItem {
  month: string; // YYYY-MM
  short: string; // Jan, Feb
  name: string;  // January
  collected: number;
  pending: number;
  paidCount: number;
  pendingCount: number;
}

export interface UnpaidCustomerItem {
  _id: string;
  name: string;
  mobile: string;
  status: "PENDING" | "UNPAID";
  amount: number;
  existingEntry: any | null;
}

export interface DashboardSummaryData {
  year: string;
  month: string;
  customerCount: number;
  currentMonthCollection: number;
  currentMonthPendingAmount: number;
  thisMonthNotPaidCount: number;
  paidCustomersCount: number;
  oneYearCollection: number;
  oneYearPendingAmount: number;
  monthlyOverview: MonthlyOverviewItem[];
  unpaidCustomers: UnpaidCustomerItem[];
}
