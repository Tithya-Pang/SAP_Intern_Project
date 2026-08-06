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
import {
  businessUnitOptions,
  overdueExposureSnapshots,
  provinceOptions,
} from "@/mocks/data";
import type { Customer, RiskLevel } from "@/types/domain";
import {
  daysOverdue,
  effectiveStatus,
  formatDate,
  formatMoney,
  overdueExposure as getOverdueExposure,
  requestExposure,
} from "@/utils/format";

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
  businessUnit: string;
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
  c1: 'Distribution',
  c2: 'Grocery',
  c3: 'Modern Trade',
  c4: 'Distribution',
  c5: 'Grocery',
  c6: 'Modern Trade',
  c7: 'Corporate',
  c8: 'Distribution',
  c9: 'Grocery',
  c10: 'Corporate',
  c11: 'Others',
  c12: 'Distribution',
  c13: 'Modern Trade',
  c14: 'Modern Trade',
  c15: 'HoReCa',
  c16: 'Modern Trade',
  c17: 'Modern Trade',
  c18: 'Others',
  c19: 'Grocery',
  c20: 'Others',
  c21: 'HoReCa',
  c22: 'HoReCa',
  c23: 'Distribution',
  c24: 'Others',
  c25: 'Grocery',
  c26: 'Corporate',
  c27: 'Corporate',
  c28: 'HoReCa',
  c29: 'Corporate',
  c30: 'Modern Trade',
  c31: 'Grocery',
  c32: 'Corporate',
  c33: 'Corporate',
  c34: 'Corporate',
  c35: 'Distribution',
  c36: 'HoReCa',
  c37: 'Others',
  c38: 'Modern Trade',
  c39: 'Modern Trade',
  c40: 'Grocery',
  c41: 'HoReCa',
  c42: 'Modern Trade',
  c43: 'Distribution',
  c44: 'Distribution',
  c45: 'Corporate',
  c46: 'Others',
  c47: 'Modern Trade',
  c48: 'Grocery',
  c49: 'Modern Trade',
  c50: 'Distribution',
  c51: 'Modern Trade',
  c52: 'Distribution',
  c53: 'Corporate',
  c54: 'Grocery',
  c55: 'Distribution',
  c56: 'Corporate',
  c57: 'Grocery',
  c58: 'Modern Trade',
  c59: 'Grocery',
  c60: 'HoReCa',
  c61: 'Corporate',
  c62: 'Modern Trade',
  c63: 'Corporate',
  c64: 'HoReCa',
  c65: 'HoReCa',
  c66: 'Grocery',
  c67: 'Modern Trade',
  c68: 'Modern Trade',
  c69: 'Distribution',
  c70: 'Modern Trade',
  c71: 'Distribution',
  c72: 'Modern Trade',
  c73: 'Modern Trade',
  c74: 'Others',
  c75: 'HoReCa',
  c76: 'HoReCa',
  c77: 'Others',
  c78: 'Distribution',
  c79: 'Distribution',
  c80: 'Grocery',
  c81: 'Grocery',
  c82: 'HoReCa',
  c83: 'Modern Trade',
  c84: 'Grocery',
  c85: 'Distribution',
  c86: 'Grocery',
  c87: 'Grocery',
  c88: 'Grocery',
  c89: 'Corporate',
  c90: 'Others',
  c91: 'Modern Trade',
  c92: 'Distribution',
  c93: 'Distribution',
  c94: 'Modern Trade',
  c95: 'Modern Trade',
  c96: 'Grocery',
  c97: 'Grocery',
  c98: 'Corporate',
  c99: 'Grocery',
  c100: 'Grocery',
  c101: 'Corporate',
  c102: 'Grocery',
  c103: 'HoReCa',
  c104: 'Grocery',
  c105: 'Distribution',
  c106: 'Grocery',
  c107: 'Distribution',
  c108: 'Grocery',
  c109: 'Modern Trade',
  c110: 'Distribution',
  c111: 'Distribution',
  c112: 'Corporate',
  c113: 'Corporate',
  c114: 'Grocery',
  c115: 'HoReCa',
  c116: 'HoReCa',
  c117: 'Distribution',
  c118: 'Modern Trade',
  c119: 'Others',
  c120: 'Modern Trade',
  c121: 'Modern Trade',
  c122: 'Corporate',
  c123: 'Modern Trade',
  c124: 'Grocery',
  c125: 'Modern Trade',
  c126: 'Others',
  c127: 'Modern Trade',
  c128: 'Distribution',
  c129: 'Distribution',
  c130: 'Distribution',
  c131: 'Others',
  c132: 'Corporate',
  c133: 'Distribution',
  c134: 'Corporate',
  c135: 'HoReCa',
  c136: 'Others',
  c137: 'Distribution',
  c138: 'Distribution',
  c139: 'Others',
  c140: 'Grocery',
  c141: 'Corporate',
  c142: 'Grocery',
  c143: 'Grocery',
  c144: 'Modern Trade',
  c145: 'Distribution',
  c146: 'Distribution',
  c147: 'Distribution',
  c148: 'Modern Trade',
  c149: 'Distribution',
  c150: 'Corporate',
  c151: 'Distribution',
  c152: 'Grocery',
  c153: 'Grocery',
  c154: 'Grocery',
  c155: 'Modern Trade',
  c156: 'Corporate',
  c157: 'Modern Trade',
  c158: 'Grocery',
  c159: 'Others',
  c160: 'Modern Trade',
  c161: 'Grocery',
  c162: 'Grocery',
  c163: 'Others',
  c164: 'Others',
  c165: 'Distribution',
  c166: 'Modern Trade',
  c167: 'Distribution',
  c168: 'Corporate',
  c169: 'Modern Trade',
  c170: 'Grocery',
  c171: 'Others',
  c172: 'Others',
  c173: 'Modern Trade',
  c174: 'Modern Trade',
  c175: 'Corporate',
  c176: 'Modern Trade',
  c177: 'Distribution',
  c178: 'Distribution',
  c179: 'Grocery',
  c180: 'HoReCa',
  c181: 'Grocery',
  c182: 'Corporate',
  c183: 'HoReCa',
  c184: 'Grocery',
  c185: 'Distribution',
  c186: 'Grocery',
  c187: 'Modern Trade',
  c188: 'Distribution',
  c189: 'Modern Trade',
  c190: 'Modern Trade',
  c191: 'Modern Trade',
  c192: 'HoReCa',
  c193: 'Distribution',
  c194: 'Others',
  c195: 'Distribution',
  c196: 'HoReCa',
  c197: 'Grocery',
  c198: 'Others',
  c199: 'Distribution',
  c200: 'Modern Trade',
};

const defaultFilters: FiltersState = {
  province: "ALL",
  customerChannel: "ALL",
  businessUnit: "ALL",
  salesperson: "ALL",
  riskLevel: "ALL",
  searchCustomer: "",
};

const getCustomer = (customerMap: Map<string, Customer>, customerId: string) =>
  customerMap.get(customerId);

const ReportRiskBadge = ({ risk }: { risk: RiskLevel }) => (
  <span className={`reportRiskBadge reportRiskBadge--${risk.toLowerCase()}`}>
    {`${risk[0]}${risk.slice(1).toLowerCase()} Risk`}
  </span>
);

const formatTrendAxisValue = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
};

const formatTrendSummaryValue = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
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
      const businessUnitMatch =
        filters.businessUnit === "ALL" || customer.businessUnit === filters.businessUnit;
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
        businessUnitMatch &&
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
    () => filteredRequests.reduce((total, request) => total + requestExposure(request), 0),
    [filteredRequests],
  );

  const overdueRequests = useMemo(
    () =>
      filteredRequests.filter(
        (request) => getOverdueExposure(request) > 0,
      ),
    [filteredRequests],
  );

  const overdueCustomerIds = useMemo(
    () => new Set(overdueRequests.map((request) => request.customerId)),
    [overdueRequests],
  );

  const overdueCustomers = useMemo(
    () => filteredCustomers.filter((customer) => overdueCustomerIds.has(customer.id)),
    [filteredCustomers, overdueCustomerIds],
  );

  const tableRows = useMemo(() => {
    return overdueCustomers.map((customer) => {
      const customerRequests = overdueRequests
        .filter((request) => request.customerId === customer.id)
        .sort((left, right) =>
          dayjs(left.promisedPaymentDate).isBefore(dayjs(right.promisedPaymentDate)) ? -1 : 1,
        );
      const days = Math.max(
        0,
        ...customerRequests.map((request) => daysOverdue(request)),
      );
      const oldestRequest = customerRequests[0]!;
      const exposure = customerRequests.reduce(
        (total, request) => total + getOverdueExposure(request),
        0,
      );

      return {
        id: customer.id,
        code: customer.code,
        customer,
        customerChannel: customerChannelMap[customer.id] ?? "Others",
        request: oldestRequest,
        requestCount: customerRequests.length,
        oldestDueDate: oldestRequest.promisedPaymentDate,
        days,
        exposure,
        risk: customer.riskLevel,
      };
    }).sort((left, right) => right.exposure - left.exposure);
  }, [overdueCustomers, overdueRequests]);
  const topOverdueCustomers = useMemo(
  () => tableRows.slice(0, 5),
  [tableRows],
);

  const overdueExposure = useMemo(
    () => overdueRequests.reduce((total, request) => total + getOverdueExposure(request), 0),
    [overdueRequests],
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
      grouped.set(groupKey, (grouped.get(groupKey) ?? 0) + row.exposure);
    });

    return Array.from(grouped.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((left, right) => right.total - left.total);
  }, [tableRows]);

  const provinceChartMax = useMemo(
    () => Math.max(1, ...groupData.map((item) => item.total)),
    [groupData],
  );

  const trendSeries = overdueExposureSnapshots.map((snapshot) => ({
    label: snapshot.month,
    value: snapshot.exposure,
  }));

  const trendMax = Math.max(1, ...trendSeries.map((point) => point.value));
  const trendPoints = trendSeries.map((point, index) => {
  const chartStart = 70;
  const chartEnd = 520;

  const x =
    chartStart +
    (index * (chartEnd - chartStart)) /
      Math.max(trendSeries.length - 1, 1);

  const y = 146 - (point.value / trendMax) * 106;

  return { x, y };
});

  const trendPolyline = trendPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const trendTickValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    label: formatTrendAxisValue(Math.round(trendMax * ratio)),
}));

  const latestTrendValue = trendSeries[trendSeries.length - 1]?.value ?? 0;
  const previousTrendValue = trendSeries[trendSeries.length - 2]?.value ?? latestTrendValue;
const trendDeltaPercent = previousTrendValue ? ((latestTrendValue - previousTrendValue) / previousTrendValue) * 100 : null;
const trendDeltaLabel =
  trendDeltaPercent === null
    ? `New vs ${trendSeries[trendSeries.length - 2]?.label ?? "Prev Month"}`
    : `${trendDeltaPercent >= 0 ? "↑" : "↓"} ${Math.abs(trendDeltaPercent).toFixed(1)}% vs ${trendSeries[trendSeries.length - 2]?.label ?? "Prev Month"}`;

  const agingBuckets = [
    { label: "1–7 Days", value: 0, color: "#0a6ff2" },
    { label: "8–15 Days", value: 0, color: "#f97316" },
    { label: "16–30 Days", value: 0, color: "#ef4444" },
    { label: "Over 30 Days", value: 0, color: "#8b5cf6" },
  ];

  overdueRequests.forEach((request) => {
    const days = daysOverdue(request);
    const amount = getOverdueExposure(request);

    if (days <= 7) agingBuckets[0]!.value += amount;
    else if (days <= 15) agingBuckets[1]!.value += amount;
    else if (days <= 30) agingBuckets[2]!.value += amount;
    else agingBuckets[3]!.value += amount;
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
            value={filters.businessUnit}
            options={[
              { value: "ALL", label: "All Business Units" },
              ...businessUnitOptions.map((option) => ({ value: option, label: option })),
            ]}
            onChange={(value) =>
              setFilters((current) => ({ ...current, businessUnit: value }))
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
        <div className="analyticsTopRow">
          <Card
            title="Overdue Exposure Trend"
            className="surface analyticsCard"
            extra={
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#475467" }}>
                <span style={{ fontWeight: 700, color: "#111827" }}>{formatTrendSummaryValue(latestTrendValue)}</span>
                <span style={{ color:  trendDeltaPercent === null || trendDeltaPercent >= 0 ? "#0a6ff2" : "#dc2626" }}>{trendDeltaLabel}</span>
              </div>
            }
          >
            <div className="dashboardTrend">
              <svg viewBox="0 0 560 190" className="trendSvg" preserveAspectRatio="none">
                <line x1="70" y1="18" x2="70" y2="146" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="70" y1="146" x2="520" y2="146" stroke="#e5e7eb" strokeWidth="1" />
                {trendTickValues.map((tick) => {
                  const y = 146 - tick.ratio * 106;
                  return (
                    <g key={tick.label}>
                      <line x1="70" y1={y} x2="520" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                      <text
                        x="6"
                        y={y + 2}
                        fontSize="10.5"
                        fill="#667085"
                        dominantBaseline="middle"
                        textAnchor="start"
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}
                <polyline
                  points={trendPolyline}
                  fill="none"
                  stroke="#0a6ff2"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {trendPoints.map((point, index) => (
                  <circle 
                    key={`${trendSeries[index]!.label}-${index}`} 
                    cx={point.x} 
                    cy={point.y} 
                    r="3.2" 
                    fill="#0a6ff2" 
                    />
                ))}
                {trendPoints.map((point, index) => (
                  <text
                    key={trendSeries[index]!.label}
                    x={point.x}
                    y="175"
                    fontSize="12"
                    fill="#667085"
                    textAnchor="middle"
                  >
                    {trendSeries[index]!.label}
                  </text>
                ))}
              </svg>
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

        <div className="analyticsBottomRow">
          <Card
            title="Overdue Exposure by Province"
            className="surface analyticsCard analyticsProvinceCard"
          >
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
                        width: `${Math.round(
                          (item.total / provinceChartMax) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Top Overdue Customers"
            className="surface analyticsCard topOverdueCard"
          >
            <div className="topOverdueTable" role="table" aria-label="Top overdue customers">
              <div className="topOverdueTableHeader" role="row">
                <span role="columnheader">Customer</span>
                <span role="columnheader">Days Overdue</span>
                <span role="columnheader">Risk Level</span>
                <span role="columnheader">Amount</span>
              </div>
              {topOverdueCustomers.map((item) => (
                <div className="topOverdueTableRow" role="row" key={item.id}>
                  <Tooltip title={item.customer.name}>
                    <span className="topOverdueCustomerName" role="cell">
                      {item.customer.name}
                    </span>
                  </Tooltip>
                  <span className="topOverdueDays" role="cell">{item.days}</span>
                  <span role="cell"><ReportRiskBadge risk={item.risk} /></span>
                  <strong className="topOverdueAmount" role="cell">
                    {formatMoney(item.exposure)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="topOverdueFooter">
              <a href="#customer-overdue-detail">View all customers</a>
            </div>
          </Card>
        </div>
      </div>

      <div className="tableCardWrap" id="customer-overdue-detail">
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
                title: "Overdue Exposure (USD)",
                dataIndex: "exposure",
                align: "center",
                width: 190,
                render: (value: number) => formatMoney(value),
              },
              {
                title: "Overdue Requests",
                dataIndex: "requestCount",
                align: "center",
                width: 140,
              },
              {
                title: "Oldest Due Date",
                dataIndex: "oldestDueDate",
                width: 150,
                render: (value: string) => formatDate(value),
              },
              {
                title: "Credit Risk",
                dataIndex: "risk",
                width: 140,
                render: (value: RiskLevel) => <ReportRiskBadge risk={value} />,
              },
              {
                title: "Days Overdue",
                dataIndex: "days",
                align: "center",
                width: 120,
                render: (value: number) => value,
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
