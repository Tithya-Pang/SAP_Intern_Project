import dayjs from 'dayjs';
import type { AppSettings, Customer, HistoryEvent, PaymentRecord, RequestStatus, TemporaryCreditRequest, User } from '@/types/domain';

const now = dayjs();
const date = (offset: number) => now.add(offset, 'day').format('YYYY-MM-DD');
const stamp = (offset: number, hour = 9) => now.add(offset, 'day').hour(hour).minute(15).second(0).toISOString();
export const users: User[] = [
  { id:'u1', name:'Sophea Dara', initials:'SD', role:'SALES_OPERATION', businessUnit:'Phnom Penh' },
  { id:'u2', name:'Mina Chan', initials:'MC', role:'SALES_MANAGER', businessUnit:'Cambodia' },
  { id:'u3', name:'Rithy Sok', initials:'RS', role:'FINANCE_AR', businessUnit:'Cambodia' },
  { id:'u4', name:'Admin User', initials:'AU', role:'ADMINISTRATOR', businessUnit:'All Units' }
];
const customerRows: Array<[string,string,string,string,'LOW'|'MEDIUM'|'HIGH',number,number,number,number,number,number,number]> = [
  ['c1','KH0001','Angkor Retail Group','Phnom Penh','LOW',22,18000,0,0,1,45,4000],
  ['c2','KH0002','Mekong Distribution','Phnom Penh','HIGH',86,72500,18600,4,5,92,12000],
  ['c3','KH0003','Phnom Penh Mart','Phnom Penh','MEDIUM',58,39400,3400,1,2,68,8000],
  ['c4','KH0004','Tonle Fresh Foods','Kandal','LOW',31,11600,0,0,0,38,0],
  ['c5','KH0005','Khmer Harvest Supply','Kampong Cham','MEDIUM',53,24600,1800,1,2,63,3500],
  ['c6','KH0006','Golden Bay Wholesale','Sihanoukville','HIGH',74,48800,9200,3,4,85,9600],
  ['c7','KH0007','Lotus Market Cambodia','Battambang','LOW',18,9400,0,0,0,29,0],
  ['c8','KH0008','Royal Home Stores','Siem Reap','MEDIUM',61,31200,2700,1,3,71,5200]
];
export const customers: Customer[] = customerRows.map(([id,code,name,businessUnit,riskLevel,riskScore,outstandingBalance,overdueAmount,overdueInvoices,latePayments6m,creditUtilisation,activeTemporaryCredit]) => ({ id,code,name,businessUnit,riskLevel,riskScore,outstandingBalance,overdueAmount,overdueInvoices,latePayments6m,creditUtilisation,activeTemporaryCredit }));
const statuses: RequestStatus[] = ['PENDING_SALES_MANAGER_APPROVAL','PENDING_SALES_MANAGER_APPROVAL','PENDING_SALES_MANAGER_APPROVAL','PENDING_SALES_MANAGER_APPROVAL','PENDING_SALES_MANAGER_APPROVAL','PENDING_SALES_MANAGER_APPROVAL','PENDING_SALES_MANAGER_APPROVAL','DRAFT','MORE_INFO_REQUIRED','RESUBMITTED','APPROVED','ACTIVE','ACTIVE','APPROVED','REJECTED','SETTLED','ACTIVE','ACTIVE','CANCELLED','DRAFT'];
export const requests: TemporaryCreditRequest[] = statuses.map((status, index) => {
  const customer = customers[index % customers.length]!;
  const creator = index % 4 === 0 ? users[0]! : { ...users[0]!, id:'u5', name:'Nary Chhim' };
  const id = `r${index + 1}`; const createdAt = stamp(-20 + index);
  const dueOffset = index === 16 ? 0 : index === 17 ? -5 : index > 9 ? (index % 8) - 2 : index + 2;
  const history: HistoryEvent[] = [
    { id:`h${index}-1`, requestId:id, timestamp:createdAt, action:'Request created', actorId:creator.id, actor:creator.name, role:'SALES_OPERATION' as const, toStatus:'DRAFT' as const },
    ...(!['DRAFT'].includes(status) ? [{ id:`h${index}-2`, requestId:id, timestamp:stamp(-18 + index), action:'Submitted for approval', actorId:creator.id, actor:creator.name, role:'SALES_OPERATION' as const, fromStatus:'DRAFT' as const, toStatus:'PENDING_SALES_MANAGER_APPROVAL' as const }] : [])
  ];
  if (['APPROVED','ACTIVE','SETTLED'].includes(status)) history.unshift({ id:`h${index}-3`, requestId:id, timestamp:stamp(-4), action:'Approved by Sales Manager', actorId:'u2', actor:'Mina Chan', role:'SALES_MANAGER', fromStatus:'PENDING_SALES_MANAGER_APPROVAL', toStatus:'APPROVED' });
  if (status === 'REJECTED') history.unshift({ id:`h${index}-3`, requestId:id, timestamp:stamp(-3), action:'Rejected by Sales Manager', actorId:'u2', actor:'Mina Chan', role:'SALES_MANAGER', fromStatus:'PENDING_SALES_MANAGER_APPROVAL', toStatus:'REJECTED', reason:'Existing overdue invoices' });
  if (status === 'SETTLED') history.unshift({ id:`h${index}-4`, requestId:id, timestamp:stamp(-1), action:'Marked as settled', actorId:'u3', actor:'Rithy Sok', role:'FINANCE_AR', fromStatus:'ACTIVE', toStatus:'SETTLED' });
  return {
    id, requestNumber:`TCR-${now.year()}-${String(index + 1).padStart(4,'0')}`, customerId:customer.id,
    requestedById:creator.id, requestedBy:creator.name, salesOperation:creator.businessUnit,
    businessUnit:customer.businessUnit, requestedAmount:4200 + (index % 7) * 1750,
    invoiceNumber:`INV-${8800 + index}`, invoiceDate:date(-24 + index), invoiceAmount:9000 + index * 925,
    promisedPaymentDate:date(dueOffset), status, reason:index % 2 ? 'Short-term credit required to release an urgent customer delivery.' : 'Payment is awaiting customer receivable clearance.',
    comments:'Sales Operation confirmed the payment plan and will follow up with the customer.',
    createdAt, submittedAt:status === 'DRAFT' ? undefined : stamp(-18 + index), updatedAt:stamp(-Math.max(0,5-index)),
    settledAt:status === 'SETTLED' ? stamp(-1) : undefined,
    attachments:index % 3 === 0 ? [{ id:`a${index}`, name:`Invoice-${8800+index}.pdf`, size:`${180+index*4} KB` }] : [],
    history, followUps:[]
  };
});
export const payments: PaymentRecord[] = customers.flatMap((customer,index) => [
  { id:`p${index}-1`, customerId:customer.id, date:date(-7), type:'PAYMENT', reference:`RCPT-${7000+index}`, amount:8000+index*600, result:'Paid', daysLate:index%3===0?7:0 },
  { id:`p${index}-2`, customerId:customer.id, date:date(-35), type:'TEMPORARY_CREDIT', reference:`TCR-${now.year()}-${90+index}`, amount:5200+index*400, result:index%2?'Settled':'Active' },
  { id:`p${index}-3`, customerId:customer.id, date:date(-65), type:'INVOICE', reference:`INV-${8100+index}`, amount:9400+index*300, result:'Paid', daysLate:index%2?3:0 }
]);
export const defaultSettings: AppSettings = {
  requestPrefix:'TCR', nextSequence:21, lowRiskMax:35, mediumRiskMax:65, notificationsEnabled:true,
  businessUnits:['Phnom Penh','Kandal','Kampong Cham','Sihanoukville','Battambang','Siem Reap'],
  rejectionReasons:['Existing overdue invoices','High outstanding balance','Poor payment history','Excessive credit utilisation','Active temporary credit already exists','Requested amount is too high','Insufficient supporting information','Promised payment date is not acceptable','Duplicate request','Other'],
  informationTypes:['Updated promised payment date','Payment evidence','Customer confirmation','Invoice document','Delivery or Sales Order document','Customer payment explanation','Manager confirmation','Other']
};
