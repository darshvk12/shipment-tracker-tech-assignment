import express from "express";
import cors from "cors";
import shipmentsRouter from "./routes/shipments";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/shipments", shipmentsRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`Shipment tracker API listening on port ${PORT}`);
});
