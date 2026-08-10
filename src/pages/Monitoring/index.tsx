import {
  CheckCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Progress,
  Space,
  Typography,
  message,
} from "antd";
import { history, useLocation } from "@umijs/max";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { RequestTable } from "@/components/RequestTable";
import { useApp } from "@/context/AppContext";
import { useCreditData } from "@/hooks/useCreditData";
import { temporaryCreditService } from "@/services/temporaryCreditService";
import type { TemporaryCreditRequest } from "@/types/domain";
import { effectiveStatus, formatMoney } from "@/utils/format";
import { canMarkAsSettled } from "@/utils/permissions";
export default function Monitoring() {
  const location = useLocation();
  const { currentUser, refresh } = useApp();
  const { requests, customers, loading, error } = useCreditData();
  const fixed =
  location.pathname === "/active-credit"
    ? "ACTIVE"
    : location.pathname === "/approved-temporary-credit"
      ? "APPROVED"
      : location.pathname === "/rejected-credit"
        ? "REJECTED"
        : location.pathname === "/overdue"
          ? "OVERDUE"
          : "";
  // const [tab, setTab] = useState(fixed || "ACTIVE");
  const [query, setQuery] = useState("");
  const [follow, setFollow] = useState<TemporaryCreditRequest>();
  const [form] = Form.useForm();
  const eligible = requests
    .filter((r) =>
      ["APPROVED", "ACTIVE", "DUE_TODAY", "OVERDUE", "REJECTED"].includes(r.status),
    )
    .map((r) => ({ ...r, status: effectiveStatus(r) }));
  const visible = useMemo(
    () =>
      eligible.filter((r) => {
        const c = customers.find((x) => x.id === r.customerId);
        const matches =
        fixed === "ACTIVE"
          ? ["ACTIVE", "DUE_TODAY"].includes(r.status)
          : fixed !== ""
            ? r.status === fixed
            : true;
        return (
          matches &&
          `${r.requestNumber} ${c?.name}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );
      }),
    [eligible, customers, fixed, query],
  );
  const due = eligible.filter((r) => r.status === "DUE_TODAY"),
    overdue = eligible.filter((r) => r.status === "OVERDUE");
  const settle = (r: TemporaryCreditRequest) =>
    Modal.confirm({
      title: `Mark ${r.requestNumber} as settled?`,
      content:
        "This action and the acting user will be recorded in the audit history.",
      okText: "Confirm Settlement",
      onOk: async () => {
        await temporaryCreditService.settle(r.id, currentUser!);
        refresh();
        message.success("Marked as settled.");
      },
    });
  const activate = async (r: TemporaryCreditRequest) => {
    await temporaryCreditService.activate(r.id, currentUser!);
    refresh();
    message.success("Temporary credit activated.");
  };
  const addFollow = async () => {
    const values = await form.validateFields();
    await temporaryCreditService.addFollowUp(
      follow!.id,
      currentUser!,
      values.comment,
    );
    setFollow(undefined);
    form.resetFields();
    refresh();
    message.success("Follow-up recorded.");
  };
  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            {fixed === "ACTIVE"
              ? "Active Requests"
              : fixed === "APPROVED"
                ? "Approved Temporary Credit"
                : fixed === "REJECTED"
                  ? "Rejected Temporary Credit"
                  : fixed === "OVERDUE"
                    ? "Overdue Temporary Credit"
                    : "Credit Control and Monitoring"}
          </Typography.Title>
          <div className="pageSubtitle">
            View and monitor approved temporary credit requests.
          </div>
        </div>
        <Button>Export</Button>
      </div>
      {error && <Typography.Text type="danger">{error}</Typography.Text>}
      <div className="kpiGrid">
        <KpiCard
          title="Active Requests"
          value={
            eligible.filter((r) => ["ACTIVE", "APPROVED"].includes(r.status))
              .length
          }
        //   prefix={<CheckCircleOutlined />}
          // helper="Currently monitored"
          color="#0a6ff2"
         
        />
        <KpiCard
          title="Due Today"
          value={due.length}
          // helper={formatMoney(due.reduce((s, r) => s + r.requestedAmount, 0))}
          // color="#f59e0b"
        />
        <KpiCard
          title="Overdue"
          value={overdue.length}
        //   prefix={<ExclamationCircleOutlined />}
          // helper={formatMoney(
          //   overdue.reduce((s, r) => s + r.requestedAmount, 0),
          // )}
          color="#e5484d"
        />
        <KpiCard
          title="Total Exposure"
          value={formatMoney(
            eligible.reduce((s, r) => s + r.requestedAmount, 0),
          )}
          //   prefix={<DollarOutlined />}
          //helper={`Across ${eligible.length} requests`}
          color="#169b62"
        />
      </div>
      <Card className="surface">
        {/* {!fixed && (
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: "ACTIVE", label: "Active" },
              { key: "DUE_TODAY", label: `Due Today (${due.length})` },
              { key: "OVERDUE", label: `Overdue (${overdue.length})` },
            ]}
          />
        )} */}
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search customer or request ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 300, marginBottom: 16 }}
        />
        <RequestTable
          requests={visible}
          customers={customers}
          loading={loading}
          action={(r) => (
            <Space>
              <Button onClick={() => history.push(`/pending-approval/${r.id}`)}>
                View
              </Button>

              {r.status === "APPROVED" &&
                currentUser &&
                ["FINANCE_AR", "ADMINISTRATOR"].includes(currentUser.role) && (
                <Button onClick={() => void activate(r)}>
                  Activate
                </Button>
              )}
            </Space>
          )}
        />
      </Card>
      <Modal
        title="Record Finance Follow-up"
        open={!!follow}
        onCancel={() => setFollow(undefined)}
        onOk={() => void addFollow()}
        okText="Record Follow-up"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, min: 5 }]}
          >
            <Input.TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
