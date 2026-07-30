import type { RequestConfig } from '@umijs/max';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import './global.less';

export async function getInitialState() {
  return {};
}

export const request: RequestConfig = { timeout: 10000 };

export function rootContainer(container: ReactNode) {
  return <ConfigProvider theme={{ token: { colorPrimary: '#0a6ff2', borderRadius: 10 } }}>{container}</ConfigProvider>;
}
