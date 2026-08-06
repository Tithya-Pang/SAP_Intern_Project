import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  List,
  Segmented,
  Space,
  Typography,
} from 'antd';
import { history } from '@umijs/max';
import { useMemo, useState } from 'react';
import { useCreditData } from '@/hooks/useCreditData';
import { KpiCard } from '@/components/KpiCard';
import { RequestTable } from '@/components/RequestTable';
import {
  effectiveStatus,
  formatDate,
  formatMoney,
} from '@/utils/format';

export default function Overview() {
  const { requests, customers, loading, error } = useCreditData();
  const [priority, setPriority] = useState<string>('All');

  const map = new Map(
    customers.map((customer) => [customer.id, customer]),
  );

  const pending = requests.filter(
    (request) =>
      request.status === 'PENDING_SALES_MANAGER_APPROVAL',
  );

  const filtered = useMemo(
    () =>
      pending.filter((request) => {
        const customer = map.get(request.customerId);

        if (priority === 'High Risk') {
          return customer?.riskLevel === 'HIGH';
        }

        if (priority === 'High Value') {
          return request.requestedAmount >= 10000;
        }

        if (priority === 'Normal') {
          return (
            customer?.riskLevel !== 'HIGH' &&
            request.requestedAmount < 10000
          );
        }

        return true;
      }),
    [pending, priority, customers],
  );

  const highRisk = pending.filter(
    (request) =>
      map.get(request.customerId)?.riskLevel === 'HIGH',
  ).length;

  const approvedToday = requests.filter(
    (request) =>
      request.status === 'APPROVED' &&
      formatDate(request.updatedAt) ===
        formatDate(new Date().toISOString()),
  ).length;

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <Typography.Title level={2} className="pageTitle">
            Overview
          </Typography.Title>

          <div className="pageSubtitle">
            Review and manage temporary credit requests.
          </div>
        </div>

        <Space>
          <DatePicker.RangePicker />

          <Button
            type="primary"
            onClick={() => history.push('/pending-approval')}
          >
            Open Approval Queue <ArrowRightOutlined />
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="kpiGrid">
        <KpiCard
          title="Pending Approval"
          value={pending.length}
          prefix={
            <FileTextOutlined
              style={{
                fontSize: 28,
                color: '#0a6ff2',
              }}
            />
          }
          // helper="Requests need your decision"
          color="#0a6ff2"
        />

        <KpiCard
          title="High Risk Requests"
          value={highRisk}
          prefix={
            <ExclamationCircleOutlined
              style={{
                fontSize: 28,
                color: '#e5484d',
              }}
            />
          }
          // helper="Require careful review"
          color="#e5484d"
        />

        <KpiCard
          title="Total Requested Amount"
          value={formatMoney(
            pending.reduce(
              (sum, item) => sum + item.requestedAmount,
              0,
            ),
          )}
          prefix={
            <DollarOutlined
              style={{
                fontSize: 28,
                color: '#169b62',
              }}
            />
          }
          // helper="Across pending requests"
          color="#169b62"
        />
                <KpiCard
          title="Approved Today"
          value={approvedToday}
          prefix={
            <CheckCircleOutlined
              style={{
                fontSize: 28,
                color: '#7c3aed',
              }}
            />
          }
          // helper="Completed approvals"
          color="#7c3aed"
        />
      </div>

      <Card
        title="Pending Approval Queue"
        className="surface"
        style={{ marginBottom: 16 }}
        extra={
          <Segmented
            value={priority}
            onChange={(value) => setPriority(String(value))}
            options={[
              'All',
              'High Risk',
              'High Value',
              'Normal',
            ]}
          />
        }
      >
        <RequestTable
          requests={filtered}
          customers={customers}
          loading={loading}
          review
        />
      </Card>

      <Card
        title="Recent Activity"
        className="surface"
        extra={
          <Button
            type="link"
            onClick={() => history.push('/request-history')}
          >
            View full history <ArrowRightOutlined />
          </Button>
        }
      >
        <List
          dataSource={requests
            .filter(
              (item) =>
                ![
                  'DRAFT',
                  'PENDING_SALES_MANAGER_APPROVAL',
                ].includes(item.status),
            )
            .slice(0, 3)}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  effectiveStatus(item) === 'REJECTED'
                    ? 'Rejected temporary credit'
                    : 'Updated temporary credit'
                }
                description={`${
                  map.get(item.customerId)?.name
                } · ${formatMoney(
                  item.requestedAmount,
                )} · ${formatDate(item.updatedAt, true)}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}