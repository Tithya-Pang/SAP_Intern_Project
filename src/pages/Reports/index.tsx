import {
  AlertOutlined,
  CalendarOutlined,
  DownloadOutlined,
  DollarOutlined,
  LineChartOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Select,
  Table,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { useCreditData } from "@/hooks/useCreditData";
import { businessUnitOptions, provinceOptions } from "@/mocks/data";
import type { Customer, RiskLevel } from "@/types/domain";
import { daysOverdue, effectiveStatus, formatMoney } from "@/utils/format";

type CustomerChannel =
  | "Distribution"
  | "Modern Trade"
  | "Grocery"
  | "HoReCa"
  | "Corporate"
  | "Others";

type FiltersState = {
  province: string;
  customerChannel: CustomerChannel | "ALL";
  subChannel: string;
  salesperson: string;
  riskLevel: RiskLevel | "ALL";
  searchCustomer: string;
};

const riskFilterOptions: Array<{ value: RiskLevel | "ALL"; label: string }> = [
  { value: "ALL", label: "All Risk Levels" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const customerChannelOptions: Array<{ value: CustomerChannel | "ALL"; label: string }> = [
  { value: "ALL", label: "All Customer Channels" },
  { value: "Distribution", label: "Distribution" },
  { value: "Modern Trade", label: "Modern Trade" },
  { value: "Grocery", label: "Grocery" },
  { value: "HoReCa", label: "HoReCa" },
  { value: "Corporate", label: "Corporate" },
  { value: "Others", label: "Others" },
];

const customerChannelMap: Record<string, CustomerChannel> = {
  c1: "Distribution",
  c2: "Distribution",
  c3: "Grocery",
  c4: "Modern Trade",
  c5: "Modern Trade",
  c6: "Modern Trade",
  c7: "HoReCa",
  c8: "Corporate",
};

const defaultFilters: FiltersState = {
  province: "ALL",
  customerChannel: "ALL",
  subChannel: "ALL",
  salesperson: "ALL",
  riskLevel: "ALL",
  searchCustomer: "",
};

const getCustomer = (customerMap: Map<string, Customer>, customerId: string) =>
  customerMap.get(customerId);

const getMonthKey = (value: string) => dayjs(value).format("YYYY-MM");

const getRiskTextColor = (risk: RiskLevel) => {
  if (risk === "CRITICAL") return "#b91c1c";
  if (risk === "HIGH") return "#d97706";
  if (risk === "MEDIUM") return "#b45309";
  return "#15803d";
};

const getRiskText = (risk: RiskLevel) => risk[0] + risk.slice(1).toLowerCase();

const getDaysOverdueTextColor = (days: number) => {
  if (days === 0) return "#15803d";
  if (days <= 30) return "#b45309";
  return "#b91c1c";
};

export default function Reports() {
  const { requests, customers, loading } = useCreditData();
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  const uniqueSalespersons = useMemo(
    () =>
      Array.from(
        new Map(
          requests.map((request) => [request.requestedById, request.requestedBy]),
        ).entries(),
      ).map(([value, label]) => ({ value, label })),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const customer = getCustomer(customerMap, request.customerId);
      if (!customer) return false;

      const provinceMatch =
        filters.province === "ALL" || customer.province === filters.province;
      const channelMatch =
        filters.customerChannel === "ALL" ||
        customerChannelMap[customer.id] === filters.customerChannel;
      const subChannelMatch =
        filters.subChannel === "ALL" || customer.businessUnit === filters.subChannel;
      const salespersonMatch =
        filters.salesperson === "ALL" || request.requestedById === filters.salesperson;
      const riskMatch =
        filters.riskLevel === "ALL" || customer.riskLevel === filters.riskLevel;
      const searchMatch =
        !filters.searchCustomer ||
        customer.name.toLowerCase().includes(filters.searchCustomer.toLowerCase()) ||
        customer.code.toLowerCase().includes(filters.searchCustomer.toLowerCase());

      return (
        provinceMatch &&
        channelMatch &&
        subChannelMatch &&
        salespersonMatch &&
        riskMatch &&
        searchMatch
      );
    });
  }, [customerMap, filters, requests]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        filteredRequests.some((request) => request.customerId === customer.id),
      ),
    [customers, filteredRequests],
  );

  const totalActiveExposure = useMemo(
    () =>
      filteredCustomers.reduce((total, customer) => total + customer.outstandingBalance, 0),
    [filteredCustomers],
  );

  const overdueCustomers = useMemo(
    () =>
      filteredCustomers
        .filter((customer) => customer.overdueAmount > 0)
        .sort((left, right) => right.overdueAmount - left.overdueAmount),
    [filteredCustomers],
  );

  const overdueCustomerIds = useMemo(
    () => new Set(overdueCustomers.map((customer) => customer.id)),
    [overdueCustomers],
  );

  const overdueRequests = useMemo(
    () =>
      filteredRequests.filter(
        (request) =>
          overdueCustomerIds.has(request.customerId) && effectiveStatus(request) === "OVERDUE",
      ),
    [filteredRequests, overdueCustomerIds],
  );

  const tableRows = useMemo(() => {
    return overdueCustomers.map((customer, index) => {
      const customerRequests = filteredRequests
        .filter((request) => request.customerId === customer.id)
        .sort((left, right) =>
          dayjs(left.promisedPaymentDate).isBefore(dayjs(right.promisedPaymentDate)) ? -1 : 1,
        );
      const days = Math.max(
        0,
        ...customerRequests.map((request) => daysOverdue(request)),
      );
      const latestRequest = customerRequests[0];

      return {
        id: customer.id,
        code: `C${String(index + 1).padStart(5, "0")}`,
        customer,
        customerChannel: customerChannelMap[customer.id] ?? "Others",
        request: latestRequest,
        days,
        outstanding: customer.outstandingBalance,
        risk: customer.riskLevel,
      };
    });
  }, [filteredRequests, overdueCustomers]);

  const overdueExposure = useMemo(
    () => tableRows.reduce((total, row) => total + row.outstanding, 0),
    [tableRows],
  );

  const averageDaysOverdue = useMemo(() => {
    if (tableRows.length === 0) return 0;

    const totalDays = tableRows.reduce((total, row) => total + row.days, 0);

    return Math.round(totalDays / tableRows.length);
  }, [tableRows]);

  const activeShare = totalActiveExposure
    ? Math.round((overdueExposure / totalActiveExposure) * 100)
    : 0;

  const groupData = useMemo(() => {
    const grouped = new Map<string, number>();

    tableRows.forEach((row) => {
      const groupKey = row.customer.province;
      grouped.set(groupKey, (grouped.get(groupKey) ?? 0) + row.outstanding);
    });

    return Array.from(grouped.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((left, right) => right.total - left.total);
  }, [tableRows]);

  const trendSeries = useMemo(() => {
    const monthTotals = new Map<string, number>();
    const now = dayjs();

    overdueRequests.forEach((request) => {
      const monthKey = getMonthKey(request.promisedPaymentDate);
      monthTotals.set(monthKey, (monthTotals.get(monthKey) ?? 0) + request.requestedAmount);
    });

    return Array.from({ length: 6 }, (_, index) => {
      const month = now.subtract(5 - index, "month").startOf("month");
      const monthKey = month.format("YYYY-MM");
      const amount = monthTotals.get(monthKey) ?? 0;

      return {
        label: month.format("MMM YYYY"),
        value: amount,
      };
    });
  }, [overdueRequests]);

  const trendMax = Math.max(1, ...trendSeries.map((point) => point.value));
  const trendMin = Math.min(...trendSeries.map((point) => point.value));
  const trendPolyline = trendSeries
    .map((point, index) => {
      const x = index * 72 + 12;
      const y = 150 - ((point.value - trendMin) / Math.max(1, trendMax - trendMin)) * 118;
      return `${x},${y}`;
    })
    .join(" ");

  const agingBuckets = [
    { label: "1–7 Days", value: 0, color: "#0a6ff2" },
    { label: "8–15 Days", value: 0, color: "#f97316" },
    { label: "16–30 Days", value: 0, color: "#ef4444" },
    { label: "Over 30 Days", value: 0, color: "#8b5cf6" },
  ];

  tableRows.forEach((row) => {
    const days = row.days;
    if (days <= 7) agingBuckets[0]!.value += row.outstanding;
    else if (days <= 15) agingBuckets[1]!.value += row.outstanding;
    else if (days <= 30) agingBuckets[2]!.value += row.outstanding;
    else agingBuckets[3]!.value += row.outstanding;
  });

  const agingGradient = agingBuckets
    .map((bucket, index) => {
      const start = agingBuckets
        .slice(0, index)
        .reduce((sum, item) => sum + item.value, 0);
      const end = start + bucket.value;
      const total = Math.max(1, agingBuckets.reduce((sum, item) => sum + item.value, 0));

      return `${bucket.color} ${Math.round((start / total) * 100)}% ${Math.round((end / total) * 100)}%`;
    })
    .join(", ");

  const exportCsv = () => {
    const csv = [
      "Request ID,Customer,Amount,Status",
      ...filteredRequests.map(
        (request) =>
          `${request.requestNumber},"${getCustomer(customerMap, request.customerId)?.name}",${request.requestedAmount},${effectiveStatus(request)}`,
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

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            Customer Overdue Detail
          </Typography.Title>
          <div className="pageSubtitle">
            Prioritize overdue balances, collection exposure, customer segmentation, and aging status.
          </div>
        </div>
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>
          Export
        </Button>
      </div>

      <div className="surface filterBar">
        <div className="filterGrid">
          <Select
            value={filters.province}
            options={[
              { value: "ALL", label: "All Provinces" },
              ...provinceOptions.map((option) => ({ value: option, label: option })),
            ]}
            onChange={(value) =>
              setFilters((current) => ({ ...current, province: value }))
            }
            style={{ minWidth: 180 }}
          />
          <Select
            value={filters.customerChannel}
            options={customerChannelOptions}
            onChange={(value) =>
              setFilters((current) => ({ ...current, customerChannel: value }))
            }
            style={{ minWidth: 200 }}
          />
          <Select
            value={filters.subChannel}
            options={[
              { value: "ALL", label: "All Sub Channels" },
              ...businessUnitOptions.map((option) => ({ value: option, label: option })),
            ]}
            onChange={(value) =>
              setFilters((current) => ({ ...current, subChannel: value }))
            }
            style={{ minWidth: 200 }}
          />
          <Select
            value={filters.salesperson}
            options={[
              { value: "ALL", label: "All Sales Teams" },
              ...uniqueSalespersons.map((person) => ({
                value: person.value,
                label: person.label,
              })),
            ]}
            onChange={(value) =>
              setFilters((current) => ({ ...current, salesperson: value }))
            }
            style={{ minWidth: 180 }}
          />
          <Select
            value={filters.riskLevel}
            options={riskFilterOptions}
            onChange={(value) =>
              setFilters((current) => ({ ...current, riskLevel: value }))
            }
            style={{ minWidth: 180 }}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search Customer"
            value={filters.searchCustomer}
            onChange={(event) =>
              setFilters((current) => ({ ...current, searchCustomer: event.target.value }))
            }
            style={{ minWidth: 220 }}
          />
          <Button onClick={() => setFilters(defaultFilters)}>Reset Filters</Button>
        </div>
      </div>

      <div className="kpiGrid">
        <KpiCard
          title="Total Overdue Exposure"
          value={formatMoney(overdueExposure)}
          prefix={<DollarOutlined style={{ fontSize: 28, color: "#d9485f" }} />}
          color="#0f172a"
        />
        <KpiCard
          title="Customers with Overdue"
          value={overdueCustomers.length}
          prefix={<TeamOutlined style={{ fontSize: 28, color: "#0a6ff2" }} />}
          color="#0f172a"
        />
        <KpiCard
          title="Average Days Overdue"
          value={averageDaysOverdue}
          prefix={<CalendarOutlined style={{ fontSize: 28, color: "#f59e0b" }} />}
          color="#0f172a"
        />
        <KpiCard
          title="Overdue Exposure % of Active"
          value={`${activeShare}%`}
          prefix={<LineChartOutlined style={{ fontSize: 28, color: "#059669" }} />}
          color="#0f172a"
        />
      </div>

      <div className="analyticsGrid">
        <Card title="Overdue Exposure Trend" className="surface analyticsCard">
          <div className="dashboardTrend">
            <svg viewBox="0 0 500 180" className="trendSvg" preserveAspectRatio="none">
              <polyline
                points={trendPolyline}
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {trendSeries.map((point, index) => {
                const x = index * 72 + 12;
                const y = 150 - ((point.value - trendMin) / Math.max(1, trendMax - trendMin)) * 118;
                return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" fill="#ef4444" />;
              })}
            </svg>
            <div className="chartLabels">
              {trendSeries.map((point) => (
                <span key={point.label}>{point.label}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Exposure by Province" className="surface analyticsCard">
          <div className="unitList">
            {groupData.map((item) => (
              <div className="barRow" key={item.label}>
                <div className="barLabelRow">
                  <span>{item.label}</span>
                  <strong>{formatMoney(item.total)}</strong>
                </div>
                <div className="chartBar">
                  <span
                    style={{
                      width: `${Math.round((item.total / Math.max(1, groupData[0]?.total ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Credit Aging" className="surface analyticsCard">
          <div className="donutWrap">
            <div
              className="donutChart"
              style={{
                background: `conic-gradient(${agingGradient})`,
              }}
            >
              <div className="donutInner">
                <div className="donutValue">{formatMoney(overdueExposure)}</div>
                <div className="donutCaption">USD</div>
              </div>
            </div>
            <div className="legendList">
              {agingBuckets.map((item) => (
                <div className="legendItem" key={item.label}>
                  <span
                    className="legendDot"
                    style={{ background: item.color }}
                  />
                  <span>{item.label}</span>
                  <strong>{formatMoney(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="tableCardWrap">
        <Card title="Customer Overdue Detail" className="surface analyticsCard">
          <Table
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) =>
                `Showing ${range[0]}-${range[1]} of ${total} customers`,
              position: ["bottomRight"],
            }}
            scroll={{ x: 1180 }}
            rowKey="id"
            dataSource={tableRows}
            columns={[
              {
                title: "Customer Code",
                dataIndex: "code",
                render: (code: string) => code,
              },
              {
                title: "Customer Name",
                dataIndex: ["customer", "name"],
                render: (name: string, record: { customer: Customer }) => (
                  <Tooltip title={record.customer.name}>
                    <span className="tableTextEllipsis">{name}</span>
                  </Tooltip>
                ),
              },
              {
                title: "Customer Channel",
                dataIndex: "customerChannel",
                render: (channel: CustomerChannel) => <span>{channel}</span>,
              },
              {
                title: "Province",
                dataIndex: ["customer", "province"],
                render: (province: string) => province,
              },
              {
                title: "Salesperson",
                dataIndex: ["request", "requestedBy"],
                render: (requestedBy: string) => requestedBy,
              },
              {
                title: "Outstanding Amount (USD)",
                dataIndex: "outstanding",
                align: "center",
                width: 190,
                render: (value: number) => formatMoney(value),
              },
              {
                title: "Credit Risk",
                dataIndex: "risk",
                render: (value: RiskLevel) => (
                  <span style={{ color: getRiskTextColor(value) }}>{getRiskText(value)}</span>
                ),
              },
              {
                title: "Days Overdue",
                dataIndex: "days",
                align: "center",
                width: 120,
                render: (value: number) => (
                  <span style={{ color: getDaysOverdueTextColor(value) }}>
                    {`${value} day${value === 1 ? "" : "s"}`}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <div className="pageFooterNote">
        <AlertOutlined /> All amounts are in USD. Data updated as of 31 May 2025 10:30 AM (UTC+7).
      </div>
    </div>
  );
}
