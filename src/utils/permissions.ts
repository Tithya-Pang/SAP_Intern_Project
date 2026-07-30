import type { Role, TemporaryCreditRequest } from '@/types/domain';

export const canCreateRequest = (role: Role) => ['SALES_OPERATION', 'ADMINISTRATOR'].includes(role);
export const canEditRequest = (role: Role, request: TemporaryCreditRequest) =>
  canCreateRequest(role) && ['DRAFT', 'MORE_INFO_REQUIRED'].includes(request.status);
export const canSubmitRequest = canCreateRequest;
export const canApproveRequest = (role: Role) => ['SALES_MANAGER', 'ADMINISTRATOR'].includes(role);
export const canRejectRequest = canApproveRequest;
export const canRequestMoreInfo = canApproveRequest;
export const canMarkAsSettled = (role: Role) => ['FINANCE_AR', 'ADMINISTRATOR'].includes(role);
export const canViewCustomerRisk = (role: Role) => role !== 'SALES_OPERATION';
export const canViewReports = (role: Role) => role !== 'SALES_OPERATION';
export const canManageSettings = (role: Role) => role === 'ADMINISTRATOR';
