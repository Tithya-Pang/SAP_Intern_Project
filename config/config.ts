import { defineConfig } from '@umijs/max';

export default defineConfig({
  access: {},
  initialState: {},
  model: {},
  request: {},
  antd: {},
  npmClient: 'npm',
  hash: true,
  routes: [
    { path: '/', redirect: '/overview' },
    {
      path: '/',
      component: '@/layouts/MainLayout',
      routes: [
        { path: '/overview', component: '@/pages/Overview' },
        { path: '/my-requests', component: '@/pages/MyRequests' },
        { path: '/requests/new', component: '@/pages/RequestForm' },
        { path: '/requests/:requestId/edit', component: '@/pages/RequestForm' },
        { path: '/pending-approval', component: '@/pages/PendingApproval' },
        { path: '/pending-approval/:requestId', component: '@/pages/RequestReview' },
        { path: '/customer-risk', component: '@/pages/CustomerRisk' },
        { path: '/customer-risk/:customerId', component: '@/pages/CustomerRisk' },
        { path: '/approved-temporary-credit', component: '@/pages/Monitoring' },
        { path: '/due-today', component: '@/pages/Monitoring' },
        { path: '/overdue', component: '@/pages/Monitoring' },
        { path: '/request-history', component: '@/pages/RequestHistory' },
        { path: '/reports-analytics', component: '@/pages/Reports' },
        { path: '/settings', component: '@/pages/Settings' },
        { path: '/403', component: '@/pages/Exception', props: { type: '403' } },
        { path: '*', component: '@/pages/Exception', props: { type: '404' } }
      ]
    }
  ]
});
