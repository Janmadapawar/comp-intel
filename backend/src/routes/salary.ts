import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeCompany(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Validation ────────────────────────────────────────────────────────────────

const IngestSchema = z.object({
  company: z.string().min(1, "Company is required").max(100),
  role: z.string().min(1, "Role is required").max(100),
  level: z.string().min(1, "Level is required").max(20),
  location: z.string().min(1, "Location is required").max(100),
  experience_years: z
    .number({ required_error: "experience_years is required" })
    .int()
    .min(0, "Cannot be negative")
    .max(50, "Unrealistic experience"),
  base_salary: z
    .number({ required_error: "base_salary is required" })
    .positive("base_salary must be positive"),
  bonus: z.number().min(0).default(0),
  stock: z.number().min(0).default(0),
  confidence: z.number().min(0).max(1).default(1.0),
});

// ── POST /ingest-salary ───────────────────────────────────────────────────────

router.post("/ingest-salary", async (req: Request, res: Response) => {
  const parsed = IngestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  const data = parsed.data;
  const company = normalizeCompany(data.company);
  const bonus = data.bonus ?? 0;
  const stock = data.stock ?? 0;
  const total_compensation = data.base_salary + bonus + stock;

  // Duplicate check
  const existing = await prisma.salary.findFirst({
    where: {
      company,
      role: data.role,
      level: data.level,
      location: data.location,
      experience_years: data.experience_years,
      base_salary: data.base_salary,
    },
  });

  if (existing) {
    return res.status(409).json({
      error: "Duplicate entry detected",
      existing_id: existing.id,
    });
  }

  const salary = await prisma.salary.create({
    data: {
      company,
      role: data.role,
      level: data.level,
      location: data.location,
      experience_years: data.experience_years,
      base_salary: data.base_salary,
      bonus,
      stock,
      total_compensation,
      confidence_score: data.confidence,
    },
  });

  return res.status(201).json(salary);
});

// ── GET /salaries ─────────────────────────────────────────────────────────────

router.get("/salaries", async (req: Request, res: Response) => {
  const {
    company,
    role,
    level,
    location,
    sort = "total_compensation",
    order = "desc",
    page = "1",
    limit = "20",
  } = req.query;

  const where: Prisma.SalaryWhereInput = {};

  if (company) where.company = { contains: String(company), mode: "insensitive" };
  if (role) where.role = { contains: String(role), mode: "insensitive" };
  if (level) where.level = { equals: String(level), mode: "insensitive" };
  if (location) where.location = { contains: String(location), mode: "insensitive" };

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const validSorts = ["total_compensation", "base_salary", "experience_years", "created_at"];
  const sortField = validSorts.includes(String(sort)) ? String(sort) : "total_compensation";
  const sortOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc";

  const [data, total] = await Promise.all([
    prisma.salary.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
    }),
    prisma.salary.count({ where }),
  ]);

  return res.json({
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// ── GET /company/:company ──────────────────────────────────────────────────────

router.get("/company/:company", async (req: Request, res: Response) => {
  const companyName = String(req.params.company);

  const salaries = await prisma.salary.findMany({
    where: { company: { contains: companyName, mode: "insensitive" } },
    orderBy: { total_compensation: "desc" },
  });

  if (salaries.length === 0) {
    return res.status(404).json({ error: `No data found for company: ${companyName}` });
  }

  const totals = [...salaries.map((s) => s.total_compensation)].sort((a, b) => a - b);
  const mid = Math.floor(totals.length / 2);
  const median =
    totals.length % 2 === 0 ? (totals[mid - 1] + totals[mid]) / 2 : totals[mid];

  const levelDist: Record<string, number> = {};
  const roleDist: Record<string, number> = {};
  for (const s of salaries) {
    levelDist[s.level] = (levelDist[s.level] || 0) + 1;
    roleDist[s.role] = (roleDist[s.role] || 0) + 1;
  }

  const avg =
    salaries.reduce((acc, s) => acc + s.total_compensation, 0) / salaries.length;
  const max = Math.max(...salaries.map((s) => s.total_compensation));
  const min = Math.min(...salaries.map((s) => s.total_compensation));

  return res.json({
    company: salaries[0].company,
    salaries,
    stats: {
      median_compensation: Math.round(median),
      avg_compensation: Math.round(avg),
      max_compensation: max,
      min_compensation: min,
      total_entries: salaries.length,
    },
    level_distribution: levelDist,
    role_distribution: roleDist,
  });
});

// ── GET /compare ──────────────────────────────────────────────────────────────

router.get("/compare", async (req: Request, res: Response) => {
  const { id1, id2 } = req.query;

  if (!id1 || !id2) {
    return res.status(400).json({ error: "Both id1 and id2 query params are required" });
  }
  if (id1 === id2) {
    return res.status(400).json({ error: "id1 and id2 must be different" });
  }

  const [s1, s2] = await Promise.all([
    prisma.salary.findUnique({ where: { id: String(id1) } }),
    prisma.salary.findUnique({ where: { id: String(id2) } }),
  ]);

  if (!s1) return res.status(404).json({ error: "Salary record for id1 not found" });
  if (!s2) return res.status(404).json({ error: "Salary record for id2 not found" });

  const totalDiff = s1.total_compensation - s2.total_compensation;
  const winner = totalDiff > 0 ? "salary1" : totalDiff < 0 ? "salary2" : "tie";

  return res.json({
    salary1: s1,
    salary2: s2,
    comparison: {
      base_diff: s1.base_salary - s2.base_salary,
      bonus_diff: s1.bonus - s2.bonus,
      stock_diff: s1.stock - s2.stock,
      total_diff: totalDiff,
      total_diff_pct:
        s2.total_compensation > 0
          ? Math.round((totalDiff / s2.total_compensation) * 100)
          : 0,
      level_note:
        s1.level === s2.level ? "Same level" : `${s1.level} vs ${s2.level}`,
      winner,
    },
  });
});

// ── GET /companies ─────────────────────────────────────────────────────────────

router.get("/companies", async (_req: Request, res: Response) => {
  const companies = await prisma.salary.groupBy({
    by: ["company"],
    _count: { company: true },
    _avg: { total_compensation: true },
    orderBy: { _count: { company: "desc" } },
  });

  return res.json(
    companies.map((c) => ({
      name: c.company,
      count: c._count.company,
      avg_compensation: Math.round(c._avg.total_compensation ?? 0),
    }))
  );
});

// ── GET /filters ───────────────────────────────────────────────────────────────

router.get("/filters", async (_req: Request, res: Response) => {
  const [roles, levels, locations] = await Promise.all([
    prisma.salary.findMany({ select: { role: true }, distinct: ["role"] }),
    prisma.salary.findMany({ select: { level: true }, distinct: ["level"] }),
    prisma.salary.findMany({ select: { location: true }, distinct: ["location"] }),
  ]);

  return res.json({
    roles: roles.map((r) => r.role).sort(),
    levels: levels.map((l) => l.level).sort(),
    locations: locations.map((l) => l.location).sort(),
  });
});

// ── GET /stats ─────────────────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  const [total, avgResult, topCompany] = await Promise.all([
    prisma.salary.count(),
    prisma.salary.aggregate({ _avg: { total_compensation: true } }),
    prisma.salary.groupBy({
      by: ["company"],
      _avg: { total_compensation: true },
      orderBy: { _avg: { total_compensation: "desc" } },
      take: 1,
    }),
  ]);

  return res.json({
    total_entries: total,
    avg_compensation: Math.round(avgResult._avg.total_compensation ?? 0),
    top_paying_company: topCompany[0]?.company ?? "N/A",
  });
});

export default router;
