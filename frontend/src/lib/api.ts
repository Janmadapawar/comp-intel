import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const api = axios.create({ baseURL: BASE, timeout: 10000 });

export interface Salary {
  id: string;
  company: string;
  role: string;
  level: string;
  location: string;
  experience_years: number;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  confidence_score: number;
  created_at: string;
}

export interface SalaryFilters {
  company?: string;
  role?: string;
  level?: string;
  location?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedResponse {
  data: Salary[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CompanyData {
  company: string;
  salaries: Salary[];
  stats: {
    median_compensation: number;
    avg_compensation: number;
    max_compensation: number;
    min_compensation: number;
    total_entries: number;
  };
  level_distribution: Record<string, number>;
  role_distribution: Record<string, number>;
}

export interface CompareData {
  salary1: Salary;
  salary2: Salary;
  comparison: {
    base_diff: number;
    bonus_diff: number;
    stock_diff: number;
    total_diff: number;
    total_diff_pct: number;
    level_note: string;
    winner: "salary1" | "salary2" | "tie";
  };
}

export interface FilterOptions {
  roles: string[];
  levels: string[];
  locations: string[];
}

export interface StatsData {
  total_entries: number;
  avg_compensation: number;
  top_paying_company: string;
}

export const salaryApi = {
  getSalaries: (filters: SalaryFilters = {}): Promise<PaginatedResponse> =>
    api.get("/salaries", { params: filters }).then((r) => r.data),

  getCompany: (company: string): Promise<CompanyData> =>
    api.get(`/company/${encodeURIComponent(company)}`).then((r) => r.data),

  compare: (id1: string, id2: string): Promise<CompareData> =>
    api.get("/compare", { params: { id1, id2 } }).then((r) => r.data),

  getCompanies: (): Promise<{ name: string; count: number; avg_compensation: number }[]> =>
    api.get("/companies").then((r) => r.data),

  getFilters: (): Promise<FilterOptions> =>
    api.get("/filters").then((r) => r.data),

  getStats: (): Promise<StatsData> =>
    api.get("/stats").then((r) => r.data),

  ingestSalary: (data: Partial<Salary> & { confidence?: number }): Promise<Salary> =>
    api.post("/ingest-salary", data).then((r) => r.data),
};

export function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function diffClass(n: number): string {
  if (n > 0) return "diff-pos";
  if (n < 0) return "diff-neg";
  return "diff-zero";
}

export function diffSign(n: number): string {
  if (n > 0) return `+${formatINR(n)}`;
  if (n < 0) return `-${formatINR(Math.abs(n))}`;
  return "Same";
}
