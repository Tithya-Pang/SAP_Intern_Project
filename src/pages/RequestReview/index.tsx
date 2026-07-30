import { CheckOutlined, CloseOutlined, DownloadOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, List, Modal, Progress, Select, Space, Spin, Table, Typography } from 'antd';
import { history, useParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { temporaryCreditService } from '@/services/temporaryCreditService';
import type { Customer, PaymentRecord, TemporaryCreditRequest } from '@/types/domain';
import { RiskBadge, StatusBadge } from '@/components/Badges';
import { canApproveRequest } from '@/utils/permissions';
import { formatDate, formatMoney } from '@/utils/format';

type ModalType = 'APPROVE' | 'REJECT' | 'MORE_INFO';

export default function RequestReview() {
  const { requestId = '' } = useParams<{ requestId: string }>();
  const { currentUser, refresh } = useApp();
  const [data, setData] = useState<{ request: TemporaryCreditRequest; customer: Customer; payments: PaymentRecord[] }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalType>();
  const [form] = Form.useForm();
  const load = () => { setLoading(true); void temporaryCreditService.getRequest(requestId, currentUser).then(setData).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); };
  useEffect(load, [requestId]);
  const decide = async () => {
    if (!modal || !currentUser) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await temporaryCreditService.decide(requestId, modal, { actor: currentUser, ...values });
      setModal(undefined); form.resetFields();
      setSuccess(modal === 'APPROVE' ? 'Request approved successfully.' : modal === 'REJECT' ? 'Request rejected successfully.' : 'Information request sent successfully.');
      refresh(); load();
    } catch (reason) { if (reason instanceof Error) setError(reason.message); }
    finally { setSubmitting(false); }
  };
  if (loading && !data) return <Spin fullscreen />;
  if (!data) return <Alert type="error" message="Request not found" action={<Button onClick={() => history.push('/pending-approval')}>Back</Button>} />;
  const { request, customer, payments } = data;
  const decisionEnabled = request.status === 'PENDING_SALES_MANAGER_APPROVAL' && !!currentUser && canApproveRequest(currentUser.role);
  return (
    <div className="page">
      <div className="pageHeader">
        <div><Typography.Text type="secondary">Pending Approval / Review Request</Typography.Text><Typography.Title level={2} className="pageTitle">Temporary Credit Request Review</Typography.Title><Space><StatusBadge status={request.status} /><Typography.Text strong>Request ID: {request.requestNumber}</Typography.Text></Space></div>
        <Space><Button type="primary" disabled={!decisionEnabled} icon={<CheckOutlined />} onClick={() => setModal('APPROVE')}>Approve</Button><Button danger disabled={!decisionEnabled} icon={<CloseOutlined />} onClick={() => setModal('REJECT')}>Reject</Button><Button disabled={!decisionEnabled} icon={<InfoCircleOutlined />} onClick={() => setModal('MORE_INFO')}>Request More Info</Button></Space>
      </div>
      {success && <Alert type="success" showIcon closable message="Decision submitted successfully" description={success} onClose={() => setSuccess('')} style={{ marginBottom: 16 }} />}
      {error && <Alert type="error" showIcon closable message={error} onClose={() => setError('')} style={{ marginBottom: 16 }} />}
      <div className="twoColumn">
        <div className="stack">
          <Card title="Decision Summary" className="surface"><div className="decisionSummary">{[['Requested Amount', formatMoney(request.requestedAmount)], ['Promised Payment', formatDate(request.promisedPaymentDate)], ['Customer Risk', <RiskBadge key="risk" risk={customer.riskLevel} />], ['Outstanding Balance', formatMoney(customer.outstandingBalance)], ['Active Temp. Credit', formatMoney(customer.activeTemporaryCredit)]].map(([label, value]) => <div className="decisionItem" key={String(label)}><div className="muted">{label}</div><Typography.Title level={4}>{value}</Typography.Title></div>)}</div>{customer.riskLevel === 'HIGH' && <Alert type="warning" message={`Customer has ${customer.overdueInvoices} overdue invoices.`} />}</Card>
          <Card title="Request Details" className="surface"><p><strong>Customer:</strong> {customer.name} ({customer.code})</p><p><strong>Invoice Number:</strong> {request.invoiceNumber}</p><p><strong>Invoice Date:</strong> {formatDate(request.invoiceDate)}</p><p><strong>Invoice Amount:</strong> {formatMoney(request.invoiceAmount)}</p><p><strong>Reason:</strong> {request.reason}</p><p><strong>Promised Payment:</strong> {formatDate(request.promisedPaymentDate)}</p><p><strong>Comments:</strong> {request.comments}</p><List header="Supporting Documents" dataSource={request.attachments} renderItem={(attachment) => <List.Item actions={[<Button key="preview" aria-label={`Preview ${attachment.name}`} type="link" icon={<EyeOutlined />} />, <Button key="download" aria-label={`Download ${attachment.name}`} type="link" icon={<DownloadOutlined />} />]}>{attachment.name} <Typography.Text type="secondary">{attachment.size}</Typography.Text></List.Item>} /></Card>
          <Card title="Payment & Credit History" className="surface"><Table<PaymentRecord> rowKey="id" dataSource={payments} pagination={false} columns={[{ title: 'Date', dataIndex: 'date', render: (value:string) => formatDate(value) }, { title: 'Type', dataIndex: 'type' }, { title: 'Reference', dataIndex: 'reference' }, { title: 'Amount', dataIndex: 'amount', align: 'right', render: (value:number) => formatMoney(value) }, { title: 'Result / Status', dataIndex: 'result' }, { title: 'Days Late', dataIndex: 'daysLate', render: (value?:number) => value ? <Typography.Text type="danger">{value} days late</Typography.Text> : 'On time' }]} /></Card>
        </div>
        <div className="stack"><Card title="Customer Risk Snapshot" extra={<RiskBadge risk={customer.riskLevel} />} className="surface"><Progress type="circle" percent={customer.riskScore} /><p><strong>Outstanding Balance:</strong> {formatMoney(customer.outstandingBalance)}</p><p><strong>Overdue Amount:</strong> {formatMoney(customer.overdueAmount)}</p><p><strong>Credit Utilisation:</strong> {customer.creditUtilisation}%</p><Button type="link" onClick={() => history.push(`/customer-risk/${customer.id}`)}>View full customer risk dashboard</Button></Card><Card title="Approval History" className="surface"><List dataSource={request.history} renderItem={(event) => <List.Item><List.Item.Meta title={event.action} description={`${formatDate(event.timestamp, true)} by ${event.actor}`} /></List.Item>} /></Card></div>
      </div>
      <Modal title={modal === 'APPROVE' ? 'Approve Temporary Credit Request' : modal === 'REJECT' ? 'Reject Temporary Credit Request' : 'Request More Information'} open={!!modal} onCancel={() => { setModal(undefined); form.resetFields(); }} onOk={() => void decide()} okText={modal === 'APPROVE' ? 'Confirm Approval' : modal === 'REJECT' ? 'Confirm Rejection' : 'Send Request'} okButtonProps={{ danger: modal === 'REJECT', loading: submitting }}><div style={{ width: 42, height: 4, borderRadius: 4, background: '#cbd5e1', margin: '-8px auto 18px' }} /><Form form={form} layout="vertical">{modal === 'REJECT' && <Form.Item name="reason" label="Rejection Reason" rules={[{ required: true }]}><Select options={['Existing overdue invoices','High outstanding balance','Poor payment history','Excessive credit utilisation','Active temporary credit already exists','Requested amount is too high','Insufficient supporting information','Promised payment date is not acceptable','Duplicate request','Other'].map((value) => ({ value, label: value }))} /></Form.Item>}{modal === 'MORE_INFO' && <Form.Item name="informationTypes" label="Required Information" rules={[{ required: true, type: 'array', min: 1 }]}><Select mode="multiple" options={['Updated promised payment date','Payment evidence','Customer confirmation','Invoice document','Delivery or Sales Order document','Customer payment explanation','Manager confirmation','Other'].map((value) => ({ value, label: value }))} /></Form.Item>}<Form.Item name="comment" label={modal === 'APPROVE' ? 'Approval Comment / Conditions (optional)' : 'Comment'} rules={modal === 'MORE_INFO' ? [{ required: true }] : []}><Input.TextArea rows={4} maxLength={1000} showCount /></Form.Item></Form></Modal>
    </div>
  );
}
