import { Tag } from "antd";
import type { RequestStatus, RiskLevel } from "@/types/domain";
import { riskColors, statusColors, statusLabels } from "@/utils/format";
export const StatusBadge = ({ status }: { status: RequestStatus }) => (
  <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
);
export const RiskBadge = ({ risk }: { risk: RiskLevel }) => (
  <Tag
    color={riskColors[risk]}
  >{`${risk[0]}${risk.slice(1).toLowerCase()} Risk`}</Tag>
);
