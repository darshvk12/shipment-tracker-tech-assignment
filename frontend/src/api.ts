import { Shipment, ShipmentStatus } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface ShipmentFilters {
  status?: string;
  search?: string;
}

export async function fetchShipments(filters: ShipmentFilters = {}): Promise<Shipment[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const res = await fetch(`${API_URL}/api/shipments?${params.toString()}`);
  return handle<Shipment[]>(res);
}

export async function fetchShipment(id: number): Promise<Shipment> {
  const res = await fetch(`${API_URL}/api/shipments/${id}`);
  return handle<Shipment>(res);
}

export async function fetchShipmentByReference(referenceNumber: string): Promise<Shipment> {
  const res = await fetch(`${API_URL}/api/shipments/track/${referenceNumber}`);
  return handle<Shipment>(res);
}

export interface CreateShipmentInput {
  referenceNumber: string;
  origin: string;
  destination: string;
  currentStatus?: ShipmentStatus;
  expectedDeliveryDate: string;
  carrier?: string;
  notes?: string;
}

export async function createShipment(input: CreateShipmentInput): Promise<Shipment> {
  const res = await fetch(`${API_URL}/api/shipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<Shipment>(res);
}

export async function updateShipmentStatus(
  id: number,
  status: ShipmentStatus,
  note?: string
): Promise<Shipment> {
  const res = await fetch(`${API_URL}/api/shipments/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }),
  });
  return handle<Shipment>(res);
}

export async function fetchNextReference(): Promise<string> {
  const res = await fetch(`${API_URL}/api/shipments/next-reference`);
  const data = await handle<{ referenceNumber: string }>(res);
  return data.referenceNumber;
}

export type UpdateShipmentInput = Partial<Omit<CreateShipmentInput, "currentStatus">>;

export async function updateShipment(
  id: number,
  input: UpdateShipmentInput
): Promise<Shipment> {
  const res = await fetch(`${API_URL}/api/shipments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<Shipment>(res);
}

export async function deleteShipment(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/api/shipments/${id}`, {
    method: "DELETE",
  });
  return handle<{ success: boolean }>(res);
}

export async function login(username: string, password: string): Promise<{ success: boolean; token: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      throw new Error("Invalid credentials");
    }
    return response.json();
  } catch (error) {
    throw error;
  }
}
