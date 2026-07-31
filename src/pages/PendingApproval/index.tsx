import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Select,
  Space,
  Tabs,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { useCreditData } from "@/hooks/useCreditData";
import { RequestTable } from "@/components/RequestTable";
export default function PendingApproval() {
  const { requests, customers, loading, error } = useCreditData();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [unit, setUnit] = useState("");
  const [tab, setTab] = useState("all");
  const [min, setMin] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);
  const map = new Map(customers.map((c) => [c.id, c]));
  const all = requests.filter(
    (r) => r.status === "PENDING_SALES_MANAGER_APPROVAL",
  );
  const data = useMemo(
    () =>
      all.filter((r) => {
        const c = map.get(r.customerId);
        if (
          query &&
          !`${r.requestNumber} ${c?.name}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
          return false;
        if (risk !== "ALL" && c?.riskLevel !== risk) return false;
        if (unit && r.businessUnit !== unit) return false;
        if (min !== null && r.requestedAmount < min) return false;
        if (max !== null && r.requestedAmount > max) return false;
        if (tab === "high") return c?.riskLevel === "HIGH";
        if (tab === "value") return r.requestedAmount >= 10000;
        if (tab === "normal")
          return c?.riskLevel !== "HIGH" && r.requestedAmount < 10000;
        return true;
      }),
    [requests, customers, query, risk, unit, tab, min, max],
  );
  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            Pending Approval
          </Typography.Title>
          <div className="pageSubtitle">
            Review and take action on temporary credit requests.
          </div>
        </div>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => message.success("Approval queue exported.")}
        >
          Export
        </Button>
      </div>
      {error && <Alert type="error" showIcon message={error} />}
      <div className="surface filterBar">
        <Space wrap>
          <Select
            style={{ width: 180 }}
            value={unit}
            onChange={setUnit}
            options={[
              { value: "", label: "All business units" },
              ...Array.from(new Set(customers.map((c) => c.businessUnit))).map(
                (v) => ({ value: v, label: v }),
              ),
            ]}
          />
          <Input
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            placeholder="Search customer or request…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            style={{ width: 150 }}
            value={risk}
            onChange={setRisk}
            options={["ALL", "HIGH", "MEDIUM", "LOW"].map((v) => ({
              value: v,
              label:
                v === "ALL"
                  ? "All risk levels"
                  : `${v[0]}${v.slice(1).toLowerCase()} Risk`,
            }))}
          />
          <InputNumber
            placeholder="Min amount"
            min={0}
            value={min}
            onChange={setMin}
          />
          <InputNumber
            placeholder="Max amount"
            min={0}
            value={max}
            onChange={setMax}
          />
          <Button icon={<FilterOutlined />}>More Filters</Button>
        </Space>
      </div>
      <Card className="surface">
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: "all", label: `All (${all.length})` },
            { key: "high", label: "High Risk" },
            { key: "value", label: "High Value" },
            { key: "normal", label: "Normal" },
          ]}
        />
        <RequestTable
          requests={data}
          customers={customers}
          loading={loading}
          review
        />
      </Card>
    </div>
  );
}
