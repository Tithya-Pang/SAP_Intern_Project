import { Result, Button } from 'antd';
import { history } from '@umijs/max';

export default function Exception({ type = '404' }: { type?: '403' | '404' }) {
  return <Result status={type} title={type} subTitle={type === '403' ? 'You are not authorized to access this page.' : 'Page not found.'} extra={<Button type="primary" onClick={() => history.push('/overview')}>Back Home</Button>} />;
}
