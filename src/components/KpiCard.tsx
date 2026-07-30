import { Card } from 'antd';
import type { ReactNode } from 'react';

export function KpiCard({ title, value, prefix, helper, color = '#172033' }: { title: string; value: number | string; prefix?: ReactNode; helper?: string; color?: string }) {
  return (
    <Card className="surface" style={{ minHeight: 122 }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 72 }}>
        <div style={{ fontSize: 12, color: '#667085' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {prefix}
          <span style={{ color, fontSize: 25, fontWeight: 700 }}>{value}</span>
        </div>
        {helper && <div className="muted" style={{ marginTop: 6 }}>{helper}</div>}
      </div>
    </Card>
  );
}
