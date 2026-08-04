import {
  BarChartOutlined,
  BellOutlined,
  DownOutlined,
  FileAddOutlined,
  FileTextOutlined,
  HomeOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Input, Layout, Select, Spin, Typography } from "antd";
import { Outlet, history, useLocation } from "@umijs/max";
import type { ReactNode } from "react";
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

type NavItem = {
  key: string;
  label: string;
  roles: Role[];
  icon?: ReactNode;
  badge?: number;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  {
    key: "/overview",
    label: "Overview",
    icon: <HomeOutlined />,
    roles: ["SALES_OPERATION", "SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
  },
  {
    key: "/pending-approval",
    label: "Approval Queue",
    icon: <FileTextOutlined />,
    badge: 12,
    roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
  },
  {
    key: "credit-monitoring",
    label: "Credit Monitoring",
    icon: <LineChartOutlined />,
    roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
    children: [
      {
        key: "/approved-temporary-credit",
        label: "Active Credit",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
      {
        key: "/due-today",
        label: "Due Today",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
      {
        key: "/overdue",
        label: "Overdue",
        roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
      },
    ],
  },
  {
    key: "/customer-risk",
    label: "Customer Risk",
    icon: <SafetyCertificateOutlined />,
    roles: ["SALES_OPERATION", "SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
  },
  {
    key: "requests",
    label: "Requests",
    icon: <FileAddOutlined />,
    roles: ["SALES_OPERATION", "ADMINISTRATOR"],
    children: [
      {
        key: "/my-requests",
        label: "All Requests",
        roles: ["SALES_OPERATION", "ADMINISTRATOR"],
      },
      {
        key: "/request-history",
        label: "Request History",
        roles: ["SALES_OPERATION", "ADMINISTRATOR"],
      },
    ],
  },
  {
    key: "/reports-analytics",
    label: "Reports & Analytics",
    icon: <BarChartOutlined />,
    roles: ["SALES_MANAGER", "FINANCE_AR", "ADMINISTRATOR"],
  },
];

const settingsItem: NavItem = {
  key: "/settings",
  label: "Settings",
  icon: <SettingOutlined />,
  roles: ["ADMINISTRATOR"],
};

function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "credit-monitoring": true,
    requests: true,
  });

  const { currentUser, users, setCurrentUser } = useApp();
  const location = useLocation();

  const items = useMemo<NavItem[]>(() => {
    if (!currentUser) return [];

    return navItems
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) =>
          child.roles.includes(currentUser.role),
        ),
      }))
      .filter(
        (item) =>
          item.roles.includes(currentUser.role) ||
          Boolean(item.children?.length),
      );
  }, [currentUser]);

  const canSeeSettings = Boolean(
    currentUser && settingsItem.roles.includes(currentUser.role),
  );

  const flattenedItems = useMemo(
    () =>
      items.flatMap((item) => [
        item,
        ...(item.children?.length ? item.children : []),
      ]),
    [items],
  );

  useEffect(() => {
    if (!currentUser) return;

    const availableItems = [
      ...flattenedItems,
      ...(canSeeSettings ? [settingsItem] : []),
    ];

    const allowed = availableItems.some(
      (item) =>
        item.key.startsWith("/") &&
        location.pathname.startsWith(item.key),
    );

    const requestEditor =
      location.pathname.startsWith("/requests/") &&
      ["SALES_OPERATION", "ADMINISTRATOR"].includes(currentUser.role);

    const reviewDetail =
      location.pathname.startsWith("/pending-approval/");

    if (
      !allowed &&
      !requestEditor &&
      !reviewDetail &&
      !["/", "/403"].includes(location.pathname)
    ) {
      history.replace("/403");
    }
  }, [
    currentUser,
    flattenedItems,
    canSeeSettings,
    location.pathname,
  ]);

  if (!currentUser) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  const isSelected = (key: string) =>
    key.startsWith("/") && location.pathname.startsWith(key);

  const renderNavItem = (item: NavItem, isChild = false) => {
    const hasChildren = Boolean(item.children?.length);
    const isOpen = openGroups[item.key] ?? false;
    const isItemSelected = isSelected(item.key);
    const hasSelectedChild = Boolean(
      item.children?.some((child) => isSelected(child.key)),
    );

    const itemClasses = [
      styles.navItem,
      isChild ? styles.navChild : "",
      isItemSelected ? styles.navItemActive : "",
      !isChild && hasSelectedChild ? styles.navParentActive : "",
      !isChild && hasChildren && isOpen ? styles.navParentOpen : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div key={item.key} className={styles.navGroup}>
        <button
          type="button"
          className={itemClasses}
          title={collapsed ? item.label : undefined}
          aria-expanded={hasChildren ? isOpen : undefined}
          onClick={() => {
            if (hasChildren) {
              setOpenGroups((previous) => ({
                ...previous,
                [item.key]: !isOpen,
              }));
              return;
            }

            if (item.key.startsWith("/")) {
              history.push(item.key);
            }
          }}
        >
          {item.icon && (
            <span className={styles.navIcon}>{item.icon}</span>
          )}

          <span className={styles.navLabel}>{item.label}</span>

          {item.badge !== undefined && (
            <span className={styles.navBadge}>{item.badge}</span>
          )}

          {hasChildren && !collapsed && (
            <DownOutlined
              className={`${styles.navArrow} ${
                isOpen ? styles.navArrowOpen : ""
              }`}
            />
          )}
        </button>

        {hasChildren && isOpen && !collapsed && (
          <div className={styles.navChildren}>
            {item.children!.map((child) =>
              renderNavItem(child, true),
            )}
          </div>
        )}
      </div>
    );
  };

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
              const selectedUser = users.find((user) => user.id === id);
              if (!selectedUser) return;

              setCurrentUser(selectedUser);
              history.push("/overview");
            }}
            options={users.map((user) => ({
              value: user.id,
              label: `${user.name} · ${roleLabel[user.role]}`,
            }))}
          />
        </div>
      </Layout.Header>

      <Layout>
        <Layout.Sider
          width={248}
          collapsedWidth={68}
          collapsed={collapsed}
          theme="light"
          className={styles.sider}
        >
          <nav className={styles.menu}>
            {items.map((item) => renderNavItem(item))}
          </nav>

          {canSeeSettings && (
            <div className={styles.settingsSlot}>
              {renderNavItem(settingsItem)}
            </div>
          )}

          <button
            type="button"
            className={styles.collapse}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <MenuUnfoldOutlined />
            ) : (
              <>
                <MenuFoldOutlined />
                <span>Collapse</span>
              </>
            )}
          </button>
        </Layout.Sider>

        <Layout.Content
          className={`${styles.content} ${
            collapsed ? styles.contentCollapsed : ""
          }`}
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