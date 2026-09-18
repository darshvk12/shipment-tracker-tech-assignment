import { ShipmentStatus, STATUS_LABELS } from "../types";

const COLORS: Record<ShipmentStatus, { bg: string; text: string }> = {
  BOOKED: { bg: "#f1f5f9", text: "#475569" }, // slate
  IN_TRANSIT: { bg: "#eff6ff", text: "#2563eb" }, // blue
  CUSTOMS_HOLD: { bg: "#fffbeb", text: "#d97706" }, // amber
  OUT_FOR_DELIVERY: { bg: "#f5f3ff", text: "#7c3aed" }, // violet
  DELIVERED: { bg: "#ecfdf5", text: "#059669" }, // emerald
  EXCEPTION: { bg: "#fef2f2", text: "#dc2626" }, // red
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
