import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type {
  RequestStatus,
  RiskLevel,
  TemporaryCreditRequest,
} from "@/types/domain";
dayjs.extend(utc);
dayjs.extend(timezone);

export const APP_TIMEZONE = "Asia/Phnom_Penh";
export const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export const formatPercent = (value: number) => `${Math.round(value)}%`;
export const formatDate = (value?: string, withTime = false) =>
  value
    ? dayjs(value)
        .tz(APP_TIMEZONE)
        .format(withTime ? "DD MMM YYYY, hh:mm A" : "DD MMM YYYY")
    : "—";
export const statusLabels: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  PENDING_SALES_MANAGER_APPROVAL: "Pending Approval",
  MORE_INFO_REQUIRED: "More Info Required",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  DUE_TODAY: "Due Today",
  OVERDUE: "Overdue",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
};
export const statusColors: Record<RequestStatus, string> = {
  DRAFT: "default",
  PENDING_SALES_MANAGER_APPROVAL: "orange",
  MORE_INFO_REQUIRED: "blue",
  RESUBMITTED: "cyan",
  APPROVED: "green",
  ACTIVE: "green",
  REJECTED: "red",
  DUE_TODAY: "orange",
  OVERDUE: "red",
  SETTLED: "green",
  CANCELLED: "default",
};
export const riskColors: Record<RiskLevel, string> = { LOW:'green', MEDIUM:'yellow', HIGH:'orange', CRITICAL:'red' };
export function effectiveStatus(request: TemporaryCreditRequest): RequestStatus {
  if (request.settledAt || request.status === 'SETTLED') return 'SETTLED';
  if (!['APPROVED','ACTIVE','DUE_TODAY','OVERDUE'].includes(request.status)) return request.status;
  const due = dayjs.tz(request.promisedPaymentDate, APP_TIMEZONE).startOf('day');
  const today = dayjs().tz(APP_TIMEZONE).startOf('day');
  if (due.isSame(today)) return 'DUE_TODAY';
  if (due.isBefore(today)) return 'OVERDUE';
  return request.status === 'APPROVED' ? 'APPROVED' : 'ACTIVE';
}
export const requestExposure = (request: TemporaryCreditRequest) =>
  !request.settledAt &&
  ["APPROVED", "ACTIVE", "DUE_TODAY", "OVERDUE"].includes(request.status)
    ? request.requestedAmount
    : 0;

export const overdueExposure = (request: TemporaryCreditRequest) =>
  effectiveStatus(request) === "OVERDUE" ? requestExposure(request) : 0;

export const daysOverdue = (request: TemporaryCreditRequest) =>
  effectiveStatus(request) === "OVERDUE"
    ? dayjs()
        .tz(APP_TIMEZONE)
        .startOf("day")
        .diff(
          dayjs.tz(request.promisedPaymentDate, APP_TIMEZONE).startOf("day"),
          "day",
        )
    : 0;
