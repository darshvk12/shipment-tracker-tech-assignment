import { ShipmentStatus, STATUS_LABELS } from "../types";

const COLORS: Record<ShipmentStatus, { bg: string; text: string }> = {
  BOOKED: { bg: "#f1f5f9", text: "#475569" }, // slate
  IN_TRANSIT: { bg: "#eff6ff", text: "#2563eb" }, // blue
  OUT_FOR_DELIVERY: { bg: "#f5f3ff", text: "#7c3aed" }, // violet
  RETURN_DUE_TO_CUSTOMER: { bg: "#fffbeb", text: "#d97706" }, // amber
  DELIVERED: { bg: "#ecfdf5", text: "#059669" }, // emerald
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const theme = COLORS[status];
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.text}33`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
