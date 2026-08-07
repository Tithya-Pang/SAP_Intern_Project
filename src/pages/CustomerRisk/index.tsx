import { Button, Card, Progress, Table, Tag, Typography } from "antd";
import { history, useParams } from "@umijs/max";
import { useEffect, useState } from "react";
import type {
  Customer,
  PaymentRecord,
  TemporaryCreditRequest,
} from "@/types/domain";
import { temporaryCreditService } from "@/services/temporaryCreditService";
import { useCreditData } from "@/hooks/useCreditData";
import { CustomerCell } from "@/components/CustomerCell";
import { RiskBadge } from "@/components/Badges";
import { formatDate, formatMoney } from "@/utils/format";

const getRiskColor = (score: number) => {
  if (score >= 85) return "#d32f2f";
  if (score >= 60) return "#e9730c";
  if (score >= 35) return "#e5a100";
  return "#188918";
};

const pageStyles = `
  .customer-risk-page .back-button {
    height: auto;
    margin: 0 0 12px -15px;
    padding-top: 0;
    padding-bottom: 0;
  }

  .customer-risk-page .risk-snapshot {
    margin-bottom: 24px;
    overflow: hidden;
  }

  .customer-risk-page .risk-snapshot .ant-card-head {
    min-height: 68px;
    padding: 0 30px;
    border-bottom: 1px solid #edf0f2;
  }

  .customer-risk-page .risk-snapshot .ant-card-head-title {
    color: #202124;
    font-size: 18px;
    font-weight: 700;
  }

  .customer-risk-page .risk-snapshot .ant-card-body {
    padding: 30px;
  }

  .customer-risk-page .risk-snapshot-content {
    display: grid;
    grid-template-columns: 230px minmax(0, 1fr);
    gap: 34px;
    align-items: center;
  }

  .customer-risk-page .risk-score-section {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .customer-risk-page .risk-score-display {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .customer-risk-page .risk-score-display strong {
    font-size: 36px;
    line-height: 1;
  }

  .customer-risk-page .risk-score-display span {
    margin-top: 7px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
  }

  .customer-risk-page .risk-score-badge {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .customer-risk-page .risk-metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    gap: 16px;
  }

  .customer-risk-page .risk-metric-card {
    display: flex;
    min-height: 105px;
    padding: 20px 22px;
    border: 1px solid #dde3ea;
    border-radius: 10px;
    background: #fafbfc;
    justify-content: center;
    flex-direction: column;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .customer-risk-page .risk-metric-card:hover {
    border-color: #b8c7d9;
    box-shadow: 0 3px 10px rgba(34, 53, 72, 0.06);
  }

  .customer-risk-page .risk-metric-card span {
    margin-bottom: 9px;
    color: #7a7f85;
    font-size: 14px;
    line-height: 1.3;
  }

  .customer-risk-page .risk-metric-card strong {
    color: #1f2937;
    font-size: 22px;
    line-height: 1.2;
  }

  @media (max-width: 800px) {
    .customer-risk-page .risk-snapshot-content {
      grid-template-columns: 180px minmax(0, 1fr);
      gap: 24px;
    }
  }

  @media (max-width: 700px) {
    .customer-risk-page .risk-snapshot-content {
      grid-template-columns: 1fr;
    }

    .customer-risk-page .risk-score-section {
      padding-bottom: 24px;
      border-bottom: 1px solid #edf0f2;
    }

    .customer-risk-page .risk-metric-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 500px) {
    .customer-risk-page .risk-snapshot .ant-card-body {
      padding: 24px 16px;
    }

    .customer-risk-page .risk-metric-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default function CustomerRisk() {
  const { customerId } = useParams<{ customerId?: string }>();
  const { customers, loading } = useCreditData();
  const [detail, setDetail] = useState<{
    customer: Customer;
    payments: PaymentRecord[];
    requests: TemporaryCreditRequest[];
  }>();

  useEffect(() => {
    if (customerId) {
      void temporaryCreditService.getCustomer(customerId).then(setDetail);
    }
  }, [customerId]);

  if (customerId && detail) {
    const { customer, payments } = detail;
    const riskColor = getRiskColor(customer.riskScore);

    return (
      <div className="page customer-risk-page">
        <style>{pageStyles}</style>

        <Button
          type="link"
          className="back-button"
          onClick={() => history.push("/customer-risk")}
        >
          ← Back to Customer Risk
        </Button>

        <div className="pageHeader">
          <div>
            <Typography.Title level={2} className="pageTitle">
              {customer.name}
            </Typography.Title>

            <div className="pageSubtitle">
              {customer.code} · {customer.businessUnit}
            </div>
          </div>
        </div>

        <Card title="Customer Risk Snapshot" className="surface risk-snapshot">
          <div className="risk-snapshot-content">
            <div className="risk-score-section">
              <Progress
                type="circle"
                percent={customer.riskScore}
                width={150}
                strokeWidth={8}
                strokeColor={riskColor}
                trailColor="#edf0f2"
                strokeLinecap="round"
                format={() => (
                  <div className="risk-score-display">
                    <strong style={{ color: riskColor }}>
                      {customer.riskScore}
                    </strong>
                    <span>Risk score</span>
                  </div>
                )}
              />

              <div className="risk-score-badge">
                <RiskBadge risk={customer.riskLevel} />
              </div>
            </div>

            <div className="risk-metric-grid">
              <div className="risk-metric-card">
                <span>Outstanding balance</span>
                <strong>{formatMoney(customer.outstandingBalance)}</strong>
              </div>

              <div className="risk-metric-card">
                <span>Overdue amount</span>
                <strong>{formatMoney(customer.overdueAmount)}</strong>
              </div>

              <div className="risk-metric-card">
                <span>Overdue invoices</span>
                <strong>{customer.overdueInvoices}</strong>
              </div>

              <div className="risk-metric-card">
                <span>Credit utilization</span>
                <strong>{customer.creditUtilisation}%</strong>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Temporary Credit Payment History" className="surface">
          <Table<PaymentRecord & { promisedDate?: string }>
            rowKey="id"
            dataSource={payments.filter(
              (item) => item.type === "TEMPORARY_CREDIT",
            )}
            pagination={false}
            scroll={{ x: 900 }}
            columns={[
              {
                title: "Payment Date",
                dataIndex: "date",
                width: 150,
                render: (value: string) => formatDate(value),
              },
              {
                title: "Reference",
                dataIndex: "reference",
                width: 180,
                render: (value: string) => {
                  const number = value.replace(/\D/g, "");

                  return `TCR-${new Date().getFullYear()}-${number}`;
                },
              },
              {
                title: "Promised Date",
                dataIndex: "promisedDate",
                width: 160,
                render: (value?: string) => (value ? formatDate(value) : "—"),
              },
              {
                title: "Amount",
                dataIndex: "amount",
                align: "right",
                width: 160,
                render: (value: number) => formatMoney(value),
              },
              {
                title: "Days Late",
                dataIndex: "daysLate",
                align: "center",
                width: 130,
                render: (value?: number) =>
                  value && value > 0 ? `${value} days` : "—",
              },
              {
                title: "Result",
                key: "result",
                width: 140,
                render: (_, record) => {
                  const result = record.result?.toLowerCase() ?? "";
                  const isOverdue =
                    result.includes("overdue") || result.includes("unpaid");
                  const isLate = (record.daysLate ?? 0) > 0;

                  if (isOverdue) return <Tag color="red">Unpaid/Overdue</Tag>;
                  if (isLate) return <Tag color="orange">Late</Tag>;
                  return <Tag color="green">On time</Tag>;
                },
              },
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page customer-risk-page">
      <style>{pageStyles}</style>

      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            Customer Risk
          </Typography.Title>

          <div className="pageSubtitle">
            Monitor payment behaviour, exposure, and credit utilization.
          </div>
        </div>
      </div>

      <Card className="surface">
        <Table<Customer>
          loading={loading}
          rowKey="id"
          dataSource={customers}
          pagination={false}
          scroll={{ x: 950 }}
          columns={[
            {
              title: "Customer",
              width: 220,
              render: (_, item) => <CustomerCell customer={item} />,
            },
            {
              title: "Business Unit",
              dataIndex: "businessUnit",
              width: 160,
            },
            {
              title: "Risk Level",
              width: 130,
              render: (_, item) => <RiskBadge risk={item.riskLevel} />,
            },
            {
              title: "Risk Score",
              dataIndex: "riskScore",
              width: 180,
              render: (value: number) => (
                <Progress
                  percent={value}
                  size="small"
                  strokeColor={getRiskColor(value)}
                  trailColor="#edf0f2"
                  format={() => `${value}/100`}
                />
              ),
            },
            {
              title: "Outstanding",
              dataIndex: "outstandingBalance",
              align: "right",
              width: 150,
              render: (value: number) => formatMoney(value),
            },
            {
              title: "Overdue",
              dataIndex: "overdueAmount",
              align: "right",
              width: 140,
              render: (value: number) => formatMoney(value),
            },
            {
              title: "Action",
              align: "center",
              width: 90,
              render: (_, item) => (
                <Button
                  type="link"
                  onClick={() => history.push(`/customer-risk/${item.id}`)}
                >
                  View
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
