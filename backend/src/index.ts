import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import shipmentsRouter from "./routes/shipments";
import authRouter from "./routes/auth";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/shipments", shipmentsRouter);
app.use("/api/auth", authRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

async function seedAdmin() {
  try {
    const adminCount = await prisma.adminUser.count();
    if (adminCount === 0) {
      await prisma.adminUser.create({
        data: {
          username: "admin",
          password: "password123" // Mock password for the assignment
        }
      });
      console.log("Seeded default admin user: admin / password123");
    }
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }
}

app.listen(PORT, async () => {
  await seedAdmin();
  console.log(`Shipment tracker API listening on port ${PORT}`);
});
