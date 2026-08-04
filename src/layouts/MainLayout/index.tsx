import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileAddOutlined,
  FileTextOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Input,
  Layout,
  Menu,
  Select,
  Spin,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { Outlet, history, useLocation } from "@umijs/max";
import { useEffect, useMemo, useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import type { Role } from "@/types/domain";
import styles from "./styles.less";

const roleLabel: Record<Role, string> = {
  SALES_OPERATION: "Sales Operation",
  SALES_MANAGER: "Sales Manager",
  FINANCE_AR: "Finance AR",
  ADMINISTRATOR: "Administrator",
};
function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, users, setCurrentUser } = useApp();
  const location = useLocation();
  const items = useMemo<MenuProps["items"]>(() => {
    if (!currentUser) return [];
    const all = [
      {
        key: "/overview",
        icon: <AppstoreOutlined />,
        label: "Overview",
        roles: [
          "SALES_OPERATION",
          "SALES_MANAGER",
          "FINANCE_AR",
          "ADMINISTRATOR",
        ],
      },
      {
        key: "/my-requests",
        icon: <FileAddOutlined />,
        label: "My Requests",
        roles: ["SALES_OPERATION", "ADMINISTRATOR"],
      },
      {
        key: "/pending-approval",
        icon: <FileTextOutlined />,
        label: "Pending Approval",
        roles: ["SALES_MANAGER", "ADMINISTRATOR"],
      },
      {
        key: "/customer-risk",
        icon: <SafetyCertificateOutlined />,
        label: "Customer Risk",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
      {
        key: "/approved-temporary-credit",
        icon: <CheckCircleOutlined />,
        label: "Approved Credit",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
      {
        key: "/due-today",
        icon: <ClockCircleOutlined />,
        label: "Due Today",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
      {
        key: "/overdue",
        icon: <AuditOutlined />,
        label: "Overdue",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
      {
        key: "/request-history",
        icon: <HistoryOutlined />,
        label: "Request History",
        roles: [
          "SALES_OPERATION",
          "SALES_MANAGER",
          "FINANCE_AR",
          "ADMINISTRATOR",
        ],
      },
      {
        key: "/reports-analytics",
        icon: <BarChartOutlined />,
        label: "Reports & Analytics",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
      {
        key: "/settings",
        icon: <SettingOutlined />,
        label: "Settings",
        roles: ["ADMINISTRATOR"],
      },
    ];
    return all
      .filter((i) => i.roles.includes(currentUser.role))
      .map(({ key, icon, label }) => ({ key, icon, label }));
  }, [currentUser]);
  useEffect(() => {
    if (!currentUser) return;
    const allowed = items?.some(
      (i) =>
        i &&
        "key" in i &&
        typeof i.key === "string" &&
        location.pathname.startsWith(i.key),
    );
    const editor =
      location.pathname.startsWith("/requests/") &&
      ["SALES_OPERATION", "ADMINISTRATOR"].includes(currentUser.role);
    const reviewDetail = location.pathname.startsWith("/pending-approval/");
    if (
      !allowed &&
      !editor &&
      !reviewDetail &&
      !["/403", "/"].includes(location.pathname)
    )
      history.replace("/403");
  }, [currentUser, items, location.pathname]);
  if (!currentUser)
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  const selected =
    items
      ?.filter(
        (i) =>
          i &&
          "key" in i &&
          typeof i.key === "string" &&
          location.pathname.startsWith(i.key),
      )
      .map((i) => String(i!.key)) ?? [];
  return (
    <Layout className={styles.shell}>
      <Layout.Header className={styles.header}>
        <img
          src="/images/sap_logo.png"
          alt="SAP logo"
          className={styles.sapLogo}
        />
        <div className={styles.brand}>
          <Typography.Text strong className={styles.brandName}>
            COD Temporary Credit
          </Typography.Text>
        </div>
        <Input
          className={styles.search}
          prefix={<SearchOutlined />}
          placeholder="Search menu or transaction…"
        />
        <div className={styles.profile}>
          <Badge count={7} size="small">
            <BellOutlined className={styles.bell} />
          </Badge>
          <Avatar>{currentUser.initials}</Avatar>
          <Select
            variant="borderless"
            value={currentUser.id}
            popupMatchSelectWidth={310}
            onChange={(id) => {
              const user = users.find((u) => u.id === id);
              if (user) {
                setCurrentUser(user);
                history.push("/overview");
              }
            }}
            options={users.map((u) => ({
              value: u.id,
              label: `${u.name} · ${roleLabel[u.role]}`,
            }))}
          />
        </div>
      </Layout.Header>
      <Layout>
        <Layout.Sider
          width={216}
          collapsedWidth={68}
          collapsed={collapsed}
          theme="light"
          className={styles.sider}
        >
          <Menu
            mode="inline"
            selectedKeys={selected}
            items={items}
            onClick={({ key }) => history.push(key)}
            className={styles.menu}
          />
          <button
            type="button"
            className={styles.collapse}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <MenuUnfoldOutlined />
            ) : (
              <>
                <MenuFoldOutlined /> Collapse
              </>
            )}
          </button>
        </Layout.Sider>
        <Layout.Content
          className={`${styles.content} ${collapsed ? styles.contentCollapsed : ""}`}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
export default function MainLayout() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
