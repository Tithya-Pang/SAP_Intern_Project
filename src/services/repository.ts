import dayjs from "dayjs";
import {
  customers as seedCustomers,
  defaultSettings,
  payments as seedPayments,
  requests as seedRequests,
  users as seedUsers,
} from "@/mocks/data";
import type {
  AppSettings,
  DecisionPayload,
  RequestFilters,
  RequestStatus,
  TemporaryCreditRequest,
  User,
} from "@/types/domain";
import {
  canApproveRequest,
  canCreateRequest,
  canEditRequest,
  canManageSettings,
  canMarkAsSettled,
} from "@/utils/permissions";

let requests = structuredClone(seedRequests);
let customers = structuredClone(seedCustomers);
let settings = structuredClone(defaultSettings);
const users = structuredClone(seedUsers);
const payments = structuredClone(seedPayments);
const copy = <T>(value: T): T => structuredClone(value);
const delay = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 300 + Math.random() * 400);
  });
const getRequestRef = (id: string) => {
  const item = requests.find((r) => r.id === id || r.requestNumber === id);
  if (!item) throw new Error("Temporary credit request was not found.");
  return item;
};
const event = (
  request: TemporaryCreditRequest,
  actor: User,
  action: string,
  fromStatus: RequestStatus | undefined,
  toStatus: RequestStatus,
  extra?: { reason?: string; comment?: string },
) =>
  request.history.unshift({
    id: crypto.randomUUID(),
    requestId: request.id,
    timestamp: dayjs().toISOString(),
    action,
    actorId: actor.id,
    actor: actor.name,
    role: actor.role,
    fromStatus,
    toStatus,
    ...extra,
  });

export const repository = {
  async getUsers() {
    await delay();
    return copy(users);
  },
  async getSettings() {
    await delay();
    return copy(settings);
  },
  async updateSettings(next: AppSettings, actor: User) {
    await delay();
    if (!canManageSettings(actor.role))
      throw new Error("Administrator permission is required.");
    settings = copy(next);
    return copy(settings);
  },
  async resetSettings(actor: User) {
    await delay();
    if (!canManageSettings(actor.role))
      throw new Error("Administrator permission is required.");
    settings = copy(defaultSettings);
    return copy(settings);
  },
  async getCustomers() {
    await delay();
    return copy(customers);
  },
  async getCustomer(id: string) {
    await delay();
    const customer = customers.find((c) => c.id === id);
    if (!customer) throw new Error("Customer was not found.");
    return {
      customer: copy(customer),
      payments: copy(payments.filter((p) => p.customerId === id)),
      requests: copy(requests.filter((r) => r.customerId === id)),
    };
  },
  async getRequests(filters: RequestFilters = {}, actor?: User) {
    await delay();
    let result = requests;
    if (actor?.role === "SALES_OPERATION")
      result = result.filter((r) => r.requestedById === actor.id);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter((r) =>
        `${r.requestNumber} ${customers.find((c) => c.id === r.customerId)?.name}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (filters.status && filters.status !== "ALL")
      result = result.filter((r) => r.status === filters.status);
    if (filters.risk && filters.risk !== "ALL")
      result = result.filter(
        (r) =>
          customers.find((c) => c.id === r.customerId)?.riskLevel ===
          filters.risk,
      );
    if (filters.businessUnit)
      result = result.filter((r) => r.businessUnit === filters.businessUnit);
    if (filters.requestedById)
      result = result.filter((r) => r.requestedById === filters.requestedById);
    if (filters.minAmount !== undefined)
      result = result.filter((r) => r.requestedAmount >= filters.minAmount!);
    if (filters.maxAmount !== undefined)
      result = result.filter((r) => r.requestedAmount <= filters.maxAmount!);
    return copy(result);
  },
  async getRequest(id: string, actor?: User) {
    await delay();
    const request = getRequestRef(id);
    if (actor?.role === "SALES_OPERATION" && request.requestedById !== actor.id)
      throw new Error("You do not have access to this request.");
    const customer = customers.find((c) => c.id === request.customerId);
    if (!customer) throw new Error("Customer risk record was not found.");
    return {
      request: copy(request),
      customer: copy(customer),
      payments: copy(payments.filter((p) => p.customerId === customer.id)),
    };
  },
  async saveRequest(
    values: Partial<TemporaryCreditRequest>,
    actor: User,
    submit: boolean,
  ) {
    await delay();
    if (!canCreateRequest(actor.role))
      throw new Error("You do not have permission to create requests.");
    const now = dayjs().toISOString();
    if (
      values.requestedAmount &&
      values.invoiceAmount &&
      values.requestedAmount > values.invoiceAmount
    )
      throw new Error("Requested amount cannot exceed invoice amount.");
    if (values.id) {
      const current = getRequestRef(values.id);
      if (!canEditRequest(actor.role, current))
        throw new Error("This request can no longer be edited.");
      const from = current.status;
      Object.assign(current, values, {
        status: submit ? "PENDING_SALES_MANAGER_APPROVAL" : current.status,
        submittedAt: submit ? now : current.submittedAt,
        updatedAt: now,
      });
      event(
        current,
        actor,
        submit
          ? from === "MORE_INFO_REQUIRED"
            ? "Information updated and resubmitted"
            : "Submitted for approval"
          : "Draft updated",
        from,
        current.status,
      );
      return copy(current);
    }
    const id = crypto.randomUUID();
    const status: RequestStatus = submit
      ? "PENDING_SALES_MANAGER_APPROVAL"
      : "DRAFT";
    const request: TemporaryCreditRequest = {
      id,
      requestNumber: `${settings.requestPrefix}-${dayjs().year()}-${String(settings.nextSequence++).padStart(4, "0")}`,
      customerId: values.customerId!,
      requestedById: actor.id,
      requestedBy: actor.name,
      salesOperation: actor.businessUnit,
      businessUnit: values.businessUnit!,
      requestedAmount: values.requestedAmount!,
      invoiceNumber: values.invoiceNumber!,
      invoiceDate: values.invoiceDate!,
      invoiceAmount: values.invoiceAmount!,
      promisedPaymentDate: values.promisedPaymentDate!,
      status,
      reason: values.reason!,
      comments: values.comments ?? "",
      createdAt: now,
      submittedAt: submit ? now : undefined,
      updatedAt: now,
      attachments: values.attachments ?? [],
      history: [],
      followUps: [],
    };
    event(
      request,
      actor,
      submit ? "Request created and submitted" : "Request created",
      undefined,
      status,
    );
    requests.unshift(request);
    return copy(request);
  },
  async decide(
    id: string,
    decision: "APPROVE" | "REJECT" | "MORE_INFO",
    payload: DecisionPayload,
  ) {
    await delay();
    const request = getRequestRef(id);
    if (!canApproveRequest(payload.actor.role))
      throw new Error("You do not have permission to decide requests.");
    if (request.status !== "PENDING_SALES_MANAGER_APPROVAL")
      throw new Error("A decision has already been recorded.");
    if (decision === "REJECT" && !payload.reason)
      throw new Error("A rejection reason is required.");
    if (
      decision === "REJECT" &&
      payload.reason === "Other" &&
      !payload.comment?.trim()
    )
      throw new Error("A comment is required for Other.");
    if (
      decision === "MORE_INFO" &&
      (!payload.informationTypes?.length || !payload.comment?.trim())
    )
      throw new Error("Information types and a comment are required.");
    const from = request.status;
    const next: RequestStatus =
      decision === "APPROVE"
        ? "APPROVED"
        : decision === "REJECT"
          ? "REJECTED"
          : "MORE_INFO_REQUIRED";
    request.status = next;
    request.updatedAt = dayjs().toISOString();
    event(
      request,
      payload.actor,
      decision === "APPROVE"
        ? "Approved by Sales Manager"
        : decision === "REJECT"
          ? "Rejected by Sales Manager"
          : "More information requested",
      from,
      next,
      { reason: payload.reason, comment: payload.comment },
    );
    return copy(request);
  },
  async activate(id: string, actor: User) {
    await delay();
    const request = getRequestRef(id);
    if (!canApproveRequest(actor.role) || request.status !== "APPROVED")
      throw new Error("This request cannot be activated.");
    const from = request.status;
    request.status = "ACTIVE";
    request.updatedAt = dayjs().toISOString();
    event(request, actor, "Temporary credit activated", from, "ACTIVE");
    return copy(request);
  },
  async addFollowUp(id: string, actor: User, comment: string) {
    await delay();
    const request = getRequestRef(id);
    if (
      !["FINANCE_AR", "ADMINISTRATOR"].includes(actor.role) ||
      !comment.trim()
    )
      throw new Error("A finance follow-up comment is required.");
    request.followUps.unshift({
      id: crypto.randomUUID(),
      actor: actor.name,
      role: actor.role,
      timestamp: dayjs().toISOString(),
      comment,
    });
    event(
      request,
      actor,
      "Follow-up recorded",
      request.status,
      request.status,
      { comment },
    );
    return copy(request);
  },
  async settle(id: string, actor: User, comment?: string) {
    await delay();
    const request = getRequestRef(id);
    if (!canMarkAsSettled(actor.role))
      throw new Error("You do not have permission to settle requests.");
    if (
      !["APPROVED", "ACTIVE", "DUE_TODAY", "OVERDUE"].includes(request.status)
    )
      throw new Error("This request cannot be settled.");
    const from = request.status;
    request.status = "SETTLED";
    request.settledAt = dayjs().toISOString();
    request.updatedAt = request.settledAt;
    event(request, actor, "Marked as settled", from, "SETTLED", { comment });
    return copy(request);
  },
  async cancel(id: string, actor: User, comment: string) {
    await delay();
    const request = getRequestRef(id);
    if (!canEditRequest(actor.role, request) || !comment.trim())
      throw new Error("A cancellation comment is required.");
    const from = request.status;
    request.status = "CANCELLED";
    request.updatedAt = dayjs().toISOString();
    event(request, actor, "Request cancelled", from, "CANCELLED", { comment });
    return copy(request);
  },
};
