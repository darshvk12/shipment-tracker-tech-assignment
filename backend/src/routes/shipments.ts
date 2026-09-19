import { Router, Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const ShipmentStatus = {
  BOOKED: "BOOKED",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  RETURN_DUE_TO_CUSTOMER: "RETURN_DUE_TO_CUSTOMER",
  DELIVERED: "DELIVERED",
} as const;

export type ShipmentStatus = typeof ShipmentStatus[keyof typeof ShipmentStatus];
import { prisma } from "../prisma";

const router = Router();

const STATUS_VALUES = Object.values(ShipmentStatus) as [string, ...string[]];

const createShipmentSchema = z.object({
  referenceNumber: z.string().trim().min(1, "referenceNumber is required"),
  origin: z.string().trim().min(1, "origin is required"),
  destination: z.string().trim().min(1, "destination is required"),
  currentStatus: z.enum(STATUS_VALUES).optional().default("BOOKED"),
  expectedDeliveryDate: z.coerce.date(),
  carrier: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(STATUS_VALUES),
  note: z.string().trim().optional(),
});

const updateShipmentSchema = z.object({
  referenceNumber: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(1).optional(),
  destination: z.string().trim().min(1).optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  carrier: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

// GET /api/shipments?status=&search=
// search matches against referenceNumber (case-insensitive, partial).
router.get("/", async (req: Request, res: Response) => {
  const { status, search } = req.query;

  const where: Prisma.ShipmentWhereInput = {};

  if (status && typeof status === "string" && status !== "ALL") {
    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: `Invalid status filter: ${status}` });
    }
    where.currentStatus = status as ShipmentStatus;
  }

  if (search && typeof search === "string" && search.trim() !== "") {
    where.OR = [
      { referenceNumber: { contains: search.trim() } },
      { origin: { contains: search.trim() } },
      { destination: { contains: search.trim() } },
    ];
  }

  const shipments = await prisma.shipment.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  res.json(shipments);
});

// POST /api/shipments
router.post("/", async (req: Request, res: Response) => {
  const parsed = createShipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  try {
    const shipment = await prisma.shipment.create({
      data: {
        referenceNumber: data.referenceNumber,
        origin: data.origin,
        destination: data.destination,
        currentStatus: data.currentStatus as ShipmentStatus,
        expectedDeliveryDate: data.expectedDeliveryDate,
        carrier: data.carrier,
        notes: data.notes,
        // Creating a shipment also seeds its first history entry so the
        // timeline always reflects the full lifecycle, not just later changes.
        statusHistory: {
          create: {
            status: data.currentStatus as ShipmentStatus,
            note: "Shipment created",
          },
        },
      },
      include: { statusHistory: { orderBy: { changedAt: "asc" } } },
    });
    res.status(201).json(shipment);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "referenceNumber already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

// GET /api/shipments/next-reference
router.get("/next-reference", async (req: Request, res: Response) => {
  const year = new Date().getFullYear();
  const prefix = `NGK-${year}-`;
  
  try {
    const shipments = await prisma.shipment.findMany({
      where: { referenceNumber: { startsWith: prefix } },
      select: { referenceNumber: true }
    });

    let maxNum = 0;
    for (const s of shipments) {
      const numPart = s.referenceNumber.slice(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const padded = nextNum.toString().padStart(4, '0');
    res.json({ referenceNumber: `${prefix}${padded}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate reference number" });
  }
});

// GET /api/shipments/track/:referenceNumber
router.get("/track/:referenceNumber", async (req: Request, res: Response) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { referenceNumber: req.params.referenceNumber },
      include: { statusHistory: { orderBy: { changedAt: "asc" } } },
    });
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });
    res.json(shipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shipment" });
  }
});

// GET /api/shipments/:id  (includes full status history)
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { statusHistory: { orderBy: { changedAt: "asc" } } },
  });

  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  res.json(shipment);
});

// PATCH /api/shipments/:id/status
router.patch("/:id/status", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { status, note } = parsed.data;

  try {
    const currentShipment = await prisma.shipment.findUnique({ where: { id } });
    if (!currentShipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    const AVAILABLE_NEXT_STATUSES: Record<string, string[]> = {
      BOOKED: ["IN_TRANSIT"],
      IN_TRANSIT: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED", "RETURN_DUE_TO_CUSTOMER"],
      RETURN_DUE_TO_CUSTOMER: ["OUT_FOR_DELIVERY"],
      DELIVERED: [],
    };

    const allowedNextStatuses = AVAILABLE_NEXT_STATUSES[currentShipment.currentStatus] || [];
    
    if (allowedNextStatuses.length === 0) {
      return res.status(400).json({ error: "Cannot update status of a finalized shipment" });
    }

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status progression from ${currentShipment.currentStatus} to ${status}` });
    }

    const [, shipment] = await prisma.$transaction([
      prisma.statusHistory.create({
        data: { shipmentId: id, status: status as ShipmentStatus, note },
      }),
      prisma.shipment.update({
        where: { id },
        data: { currentStatus: status as ShipmentStatus },
        include: { statusHistory: { orderBy: { changedAt: "asc" } } },
      }),
    ]);
    res.json(shipment);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Shipment not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// PUT /api/shipments/:id
router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateShipmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  try {
    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Shipment not found" });

    const [, shipment] = await prisma.$transaction([
      prisma.statusHistory.create({
        data: { 
          shipmentId: id, 
          status: existing.currentStatus, 
          note: "Shipment details updated" 
        },
      }),
      prisma.shipment.update({
        where: { id },
        data: {
          referenceNumber: data.referenceNumber,
          origin: data.origin,
          destination: data.destination,
          expectedDeliveryDate: data.expectedDeliveryDate,
          carrier: data.carrier,
          notes: data.notes,
        },
        include: { statusHistory: { orderBy: { changedAt: "asc" } } },
      }),
    ]);
    res.json(shipment);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "referenceNumber already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update shipment" });
  }
});

// DELETE /api/shipments/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    await prisma.shipment.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Shipment not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete shipment" });
  }
});

export default router;
