export const STATUS_VALUES = [
  "BOOKED",
  "IN_TRANSIT",
  "CUSTOMS_HOLD",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
] as const;

export type ShipmentStatus = (typeof STATUS_VALUES)[number];

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  BOOKED: "Booked",
  IN_TRANSIT: "In Transit",
  CUSTOMS_HOLD: "Customs Hold",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
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
