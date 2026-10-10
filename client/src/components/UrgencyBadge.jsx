import React from "react";
import { AlertCircle, Flame, Info } from "lucide-react";

export default function UrgencyBadge({ severity = "Medium", className = "" }) {
  const norm = (severity || "Medium").toLowerCase();

  let badgeClass = "badge-medium urgency-badge-medium";
  let Icon = AlertCircle;

  if (norm === "high" || norm === "critical") {
    badgeClass = norm === "critical"
      ? "badge-critical urgency-badge-critical"
      : "badge-high urgency-badge-high";
    Icon = Flame;
  } else if (norm === "low") {
    badgeClass = "badge-low urgency-badge-low";
    Icon = Info;
  }

  return (
    <span className={`urgency-badge badge ${badgeClass} ${className}`}>
      <Icon style={{ width: 12, height: 12 }} />
      <span>{severity}</span>
    </span>
  );
}
