import express from "express";
import cors from "cors";
import salaryRoutes from "./routes/salary";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", salaryRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
