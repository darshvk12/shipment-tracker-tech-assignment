export const STATUS_VALUES = [
  "BOOKED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "RETURN_DUE_TO_CUSTOMER",
  "DELIVERED",
] as const;

export type ShipmentStatus = (typeof STATUS_VALUES)[number];

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  BOOKED: "Booked",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  RETURN_DUE_TO_CUSTOMER: "Return (Customer Unavailable)",
  DELIVERED: "Delivered",
};

export const AVAILABLE_NEXT_STATUSES: Record<ShipmentStatus, ShipmentStatus[]> = {
  BOOKED: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURN_DUE_TO_CUSTOMER"],
  RETURN_DUE_TO_CUSTOMER: ["OUT_FOR_DELIVERY"],
  DELIVERED: [],
};

export interface StatusHistoryEntry {
  id: number;
  shipmentId: number;
  status: ShipmentStatus;
  note: string | null;
  changedAt: string;
}

export interface Shipment {
  id: number;
  referenceNumber: string;
  origin: string;
  destination: string;
  currentStatus: ShipmentStatus;
  expectedDeliveryDate: string;
  carrier: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: StatusHistoryEntry[];
}
