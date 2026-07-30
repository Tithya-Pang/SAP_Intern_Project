import { Avatar, Typography } from 'antd';
import type { Customer } from '@/types/domain';

export function CustomerCell({ customer }: { customer?: Customer }) {
  if (!customer) return <>Unknown customer</>;
  const initials = customer.name.split(' ').slice(0, 2).map((part) => part[0]).join('');
  return (
    <div className="tableCustomer">
      <Avatar style={{ background: '#e8f2ff', color: '#0a6ff2' }}>{initials}</Avatar>
      <div>
        <Typography.Text strong>{customer.name}</Typography.Text>
        <div className="muted">{customer.code}</div>
      </div>
    </div>
  );
}
