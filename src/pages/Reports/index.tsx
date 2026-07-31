import { DownloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Progress,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import { KpiCard } from "@/components/KpiCard";
import { useCreditData } from "@/hooks/useCreditData";
import { effectiveStatus, formatMoney, statusLabels } from "@/utils/format";
import type { RequestStatus } from "@/types/domain";
export default function Reports() {
  const { requests, customers, loading } = useCreditData();
  const statuses = requests.reduce<Partial<Record<RequestStatus, number>>>(
    (out, r) => {
      const s = effectiveStatus(r);
      out[s] = (out[s] ?? 0) + 1;
      return out;
    },
    {},
  );
  const exposure = requests
    .filter((r) =>
      ["APPROVED", "ACTIVE", "DUE_TODAY", "OVERDUE"].includes(
        effectiveStatus(r),
      ),
    )
    .reduce((s, r) => s + r.requestedAmount, 0);
  const exportCsv = () => {
    const csv = [
      "Request ID,Customer,Amount,Status",
      ...requests.map(
        (r) =>
          `${r.requestNumber},"${customers.find((c) => c.id === r.customerId)?.name}",${r.requestedAmount},${effectiveStatus(r)}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "temporary-credit-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    message.success("CSV report exported.");
  };
  const rows = Object.entries(statuses).map(([status, count]) => ({
    status: status as RequestStatus,
    count: count!,
    percent: Math.round((count! / requests.length) * 100),
  }));
  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            Reports & Analytics
          </Typography.Title>
          <div className="pageSubtitle">
            Analyse approval outcomes, exposure, risk, and aging.
          </div>
        </div>
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
      <div className="surface filterBar">
        <Space wrap>
          <DatePicker.RangePicker />
          <Select
            defaultValue="ALL"
            options={[{ value: "ALL", label: "All business units" }]}
            style={{ width: 180 }}
          />
          <Select
            defaultValue="ALL"
            options={[{ value: "ALL", label: "All risk levels" }]}
            style={{ width: 160 }}
          />
          <Button type="primary">Apply Filters</Button>
        </Space>
      </div>
      <div className="kpiGrid">
        <KpiCard
          title="Total Requests"
          value={requests.length}
          helper="Current portfolio"
        />
        <KpiCard
          title="Outstanding Exposure"
          value={formatMoney(exposure)}
          helper="Approved and active"
        />
        <KpiCard
          title="Approval Rate"
          value={`${Math.round(((statuses.APPROVED ?? 0) / Math.max(1, requests.length)) * 100)}%`}
          helper="Approved decisions"
        />
        <KpiCard
          title="High Risk Customers"
          value={customers.filter((c) => c.riskLevel === "HIGH").length}
          helper="Require monitoring"
        />
      </div>
      <div className="settingsGrid">
        <Card title="Request Outcomes" className="surface">
          <Table
            loading={loading}
            pagination={false}
            rowKey="status"
            dataSource={rows}
            columns={[
              {
                title: "Status",
                dataIndex: "status",
                render: (v: RequestStatus) => statusLabels[v],
              },
              { title: "Requests", dataIndex: "count" },
              {
                title: "Share",
                render: (_, r) => <Progress percent={r.percent} size="small" />,
              },
            ]}
          />
        </Card>
        <Card title="Exposure by Business Unit" className="surface">
          <Table
            pagination={false}
            rowKey="unit"
            dataSource={Array.from(
              new Set(customers.map((c) => c.businessUnit)),
            ).map((unit) => ({
              unit,
              amount: requests
                .filter((r) => r.businessUnit === unit)
                .reduce((s, r) => s + r.requestedAmount, 0),
            }))}
            columns={[
              { title: "Business Unit", dataIndex: "unit" },
              {
                title: "Requested Amount",
                dataIndex: "amount",
                align: "right",
                render: (v: number) => formatMoney(v),
              },
              {
                title: "Relative Exposure",
                render: (_, r) => (
                  <Progress
                    percent={Math.round(
                      (r.amount /
                        Math.max(
                          1,
                          requests.reduce((s, x) => s + x.requestedAmount, 0),
                        )) *
                        100,
                    )}
                    size="small"
                    showInfo={false}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
