import React from "react";
import { useTranslation } from "react-i18next";
import { Clock, AlertCircle, CheckCircle2, RefreshCw, AlertTriangle, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  Submitted: {
    className: "badge-submitted status-badge-submitted",
    icon: Clock,
  },
  "In Review": {
    className: "badge-in-review status-badge-in-review",
    icon: AlertCircle,
  },
  "In Progress": {
    className: "badge-in-progress status-badge-in-progress",
    icon: RefreshCw,
  },
  Resolved: {
    className: "badge-resolved status-badge-resolved",
    icon: CheckCircle2,
  },
  Escalated: {
    className: "badge-escalated status-badge-escalated",
    icon: AlertTriangle,
  },
  Rejected: {
    className: "badge-rejected status-badge-rejected",
    icon: XCircle,
  },
};

export default function StatusBadge({ status = "Submitted", className = "" }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Submitted;
  const Icon = config.icon;
  const label = t(`status.${status}`, status);

  return (
    <span className={`status-badge badge ${config.className} ${className}`}>
      <Icon style={{ width: 14, height: 14 }} />
      <span>{label}</span>
    </span>
  );
}
