import { Button, Card, Progress, Table, Typography } from 'antd';
import { history, useParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import type {
  Customer,
  PaymentRecord,
  TemporaryCreditRequest,
} from '@/types/domain';
import { temporaryCreditService } from '@/services/temporaryCreditService';
import { useCreditData } from '@/hooks/useCreditData';
import { CustomerCell } from '@/components/CustomerCell';
import { RiskBadge } from '@/components/Badges';
import { formatDate, formatMoney } from '@/utils/format';

const getRiskColor = (score: number) => {
  if (score >= 70) return '#ef4444'; // Red: high risk
  if (score >= 40) return '#f59e0b'; // Orange: medium risk
  return '#22c55e'; // Green: low risk
};

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
      void temporaryCreditService
        .getCustomer(customerId)
        .then(setDetail);
    }
  }, [customerId]);

  if (customerId && detail) {
    const d = detail;
    const riskColor = getRiskColor(d.customer.riskScore);

    return (
      <div className="page">
        <Button
          type="link"
          onClick={() => history.push('/customer-risk')}
        >
          Back to Customer Risk
        </Button>

        <div className="pageHeader">
          <div>
            <Typography.Title level={2}>
              {d.customer.name}
            </Typography.Title>

            <div className="pageSubtitle">
              {d.customer.code} · {d.customer.businessUnit}
            </div>
          </div>

          <RiskBadge risk={d.customer.riskLevel} />
        </div>

        <Card
          title="Risk Profile"
          className="surface"
          style={{ marginBottom: 24 }}
        >
          <div className="twoColumn">
            <Progress
              type="circle"
              percent={d.customer.riskScore}
              strokeColor={riskColor}
              trailColor="#f0f0f0"
              strokeLinecap="round"
              format={(percent) => (
                <span
                  style={{
                    color: riskColor,
                    fontWeight: 700,
                  }}
                >
                  {percent}%
                </span>
              )}
            />

            <div>
              <p>
                <strong>Outstanding Balance:</strong>{' '}
                {formatMoney(d.customer.outstandingBalance)}
              </p>

              <p>
                <strong>Overdue Amount:</strong>{' '}
                {formatMoney(d.customer.overdueAmount)}
              </p>

              <p>
                <strong>Overdue Invoices:</strong>{' '}
                {d.customer.overdueInvoices}
              </p>

              <p>
                <strong>Late Payments (6M):</strong>{' '}
                {d.customer.latePayments6m}
              </p>

              <p>
                <strong>Credit Utilisation:</strong>{' '}
                {d.customer.creditUtilisation}%
              </p>
            </div>
          </div>
        </Card>

        <Card title="Payment History" className="surface">
          <Table<PaymentRecord>
            rowKey="id"
            dataSource={d.payments}
            pagination={false}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                render: (value: string) => formatDate(value),
              },
              {
                title: 'Reference',
                dataIndex: 'reference',
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                align: 'right',
                render: (value: number) => formatMoney(value),
              },
              {
                title: 'Result',
                dataIndex: 'result',
              },
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            Customer Risk
          </Typography.Title>

          <div className="pageSubtitle">
            Monitor payment behaviour, exposure, and credit utilisation.
          </div>
        </div>
      </div>

      <Card className="surface">
        <Table<Customer>
          loading={loading}
          rowKey="id"
          dataSource={customers}
          pagination={false}
          columns={[
            {
              title: 'Customer',
              render: (_, item) => (
                <CustomerCell customer={item} />
              ),
            },
            {
              title: 'Business Unit',
              dataIndex: 'businessUnit',
            },
            {
              title: 'Risk Level',
              render: (_, item) => (
                <RiskBadge risk={item.riskLevel} />
              ),
            },
            {
              title: 'Risk Score',
              dataIndex: 'riskScore',
              render: (value: number) => (
                <Progress
                  percent={value}
                  size="small"
                  strokeColor={getRiskColor(value)}
                  trailColor="#f0f0f0"
                />
              ),
            },
            {
              title: 'Outstanding',
              dataIndex: 'outstandingBalance',
              align: 'right',
              render: (value: number) => formatMoney(value),
            },
            {
              title: 'Overdue',
              dataIndex: 'overdueAmount',
              align: 'right',
              render: (value: number) => formatMoney(value),
            },
            {
              title: 'Action',
              render: (_, item) => (
                <Button
                  type="link"
                  onClick={() =>
                    history.push(`/customer-risk/${item.id}`)
                  }
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