export type Role =
  "SALES_OPERATION" | "SALES_MANAGER" | "FINANCE_AR" | "ADMINISTRATOR";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RequestStatus =
  | "DRAFT"
  | "PENDING_SALES_MANAGER_APPROVAL"
  | "MORE_INFO_REQUIRED"
  | "RESUBMITTED"
  | "APPROVED"
  | "ACTIVE"
  | "REJECTED"
  | "DUE_TODAY"
  | "OVERDUE"
  | "SETTLED"
  | "CANCELLED";

export interface User {
  id: string;
  name: string;
  initials: string;
  role: Role;
  businessUnit: string;
}
export interface Customer {
  id: string;
  code: string;
  name: string;
  businessUnit: string;
  province: string;
  riskLevel: RiskLevel;
  riskScore: number;
  outstandingBalance: number;
  overdueAmount: number;
  overdueInvoices: number;
  latePayments6m: number;
  creditUtilisation: number;
  activeTemporaryCredit: number;
  promisedDate?: string;
  settlementDate?: string;
}
export interface Attachment {
  id: string;
  name: string;
  size: string;
}
export interface HistoryEvent {
  id: string;
  requestId: string;
  timestamp: string;
  action: string;
  actorId: string;
  actor: string;
  role: Role;
  fromStatus?: RequestStatus;
  toStatus: RequestStatus;
  reason?: string;
  comment?: string;
}
export interface FollowUp {
  id: string;
  actor: string;
  role: Role;
  timestamp: string;
  comment: string;
}
export interface PaymentRecord {
  id: string;
  customerId: string;
  date: string;
  type: string;
  reference: string;
  amount: number;
  result: string;
  daysLate?: number;
  promisedDate?: string;
  settlementDate?: string;
}
export interface TemporaryCreditRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  requestedById: string;
  requestedBy: string;
  salesOperation: string;
  businessUnit: string;
  requestedAmount: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  promisedPaymentDate: string;
  status: RequestStatus;
  reason: string;
  comments: string;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
  settledAt?: string;
  attachments: Attachment[];
  history: HistoryEvent[];
  followUps: FollowUp[];
}
export interface DecisionPayload {
  actor: User;
  comment?: string;
  reason?: string;
  informationTypes?: string[];
}
export interface RequestFilters {
  query?: string;
  status?: RequestStatus | "ALL";
  risk?: RiskLevel | "ALL";
  businessUnit?: string;
  requestedById?: string;
  minAmount?: number;
  maxAmount?: number;
}
export interface AppSettings {
  requestPrefix: string;
  nextSequence: number;
  lowRiskMax: number;
  mediumRiskMax: number;
  notificationsEnabled: boolean;
  businessUnits: string[];
  rejectionReasons: string[];
  informationTypes: string[];
}
export interface DashboardSummary {
  pending: number;
  highRisk: number;
  pendingAmount: number;
  approvedToday: number;
}
