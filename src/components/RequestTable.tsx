import { EyeOutlined } from '@ant-design/icons';
import { Button,Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { history } from '@umijs/max';
import type { Customer,TemporaryCreditRequest } from '@/types/domain';
import { CustomerCell } from './CustomerCell';
import { RiskBadge,StatusBadge } from './Badges';
import { effectiveStatus,formatDate,formatMoney } from '@/utils/format';
interface Props{requests:TemporaryCreditRequest[];customers:Customer[];loading?:boolean;review?:boolean;action?:(request:TemporaryCreditRequest)=>React.ReactNode;pageSize?:number}
export function RequestTable({requests,customers,loading=false,review=false,action,pageSize=7}:Props){const map=new Map(customers.map(c=>[c.id,c]));const columns:ColumnsType<TemporaryCreditRequest>=[
  {title:'Request ID',dataIndex:'requestNumber',width:150,sorter:(a,b)=>a.requestNumber.localeCompare(b.requestNumber)},
  {title:'Customer',width:260,render:(_,r)=><CustomerCell customer={map.get(r.customerId)}/>},
  {title:'Requested Amount',dataIndex:'requestedAmount',align:'right',sorter:(a,b)=>a.requestedAmount-b.requestedAmount,render:(v:number)=>formatMoney(v)},
  {title:'Risk Level',render:(_,r)=><RiskBadge risk={map.get(r.customerId)?.riskLevel??'LOW'}/>},
  {title:'Promised Payment',dataIndex:'promisedPaymentDate',render:(v:string)=>formatDate(v)},
  {title:'Status',render:(_,r)=><StatusBadge status={effectiveStatus(r)}/>},
  {title:'Submitted At',dataIndex:'submittedAt',render:(v?:string)=>formatDate(v,true)},
  {title:'Action',fixed:'right',width:120,render:(_,r)=>action?.(r)??<Button aria-label={`View ${r.requestNumber}`} icon={review?undefined:<EyeOutlined/>} onClick={()=>history.push(`/pending-approval/${r.id}`)}>{review?'Review':undefined}</Button>}
];return<Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={requests} scroll={{x:1150}} locale={{emptyText:'No temporary credit requests match the current view.'}} pagination={{pageSize,showSizeChanger:true,showTotal:total=>`${total} requests`}}/>;}
