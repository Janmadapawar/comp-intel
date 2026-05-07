"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ChevronUp, ChevronDown, X, Plus, Check, AlertCircle } from "lucide-react";
import { salaryApi, formatINR, type Salary, type FilterOptions } from "@/lib/api";
import Link from "next/link";

function SalariesContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ roles: [], levels: [], locations: [] });

  const [company, setCompany] = useState(params.get("company") || "");
  const [role, setRole] = useState(params.get("role") || "");
  const [level, setLevel] = useState(params.get("level") || "");
  const [location, setLocation] = useState(params.get("location") || "");
  const [sort, setSort] = useState("total_compensation");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    company: "", role: "", level: "", location: "",
    experience_years: "", base_salary: "", bonus: "", stock: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState<"success" | "error" | "dup" | null>(null);
  const [addError, setAddError] = useState("");

  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    salaryApi.getFilters().then(setFilters).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salaryApi.getSalaries({ company, role, level, location, sort, order, page, limit: 20 });
      setSalaries(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch {
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  }, [company, role, level, location, sort, order, page]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field: string) => {
    if (sort === field) setOrder(o => o === "desc" ? "asc" : "desc");
    else { setSort(field); setOrder("desc"); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sort !== field) return <span className="opacity-20">↕</span>;
    return order === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />;
  };

  const maxComp = Math.max(...salaries.map(s => s.total_compensation), 1);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddResult(null);
    try {
      await salaryApi.ingestSalary({
        company: addForm.company,
        role: addForm.role,
        level: addForm.level,
        location: addForm.location,
        experience_years: parseInt(addForm.experience_years),
        base_salary: parseFloat(addForm.base_salary),
        bonus: parseFloat(addForm.bonus || "0"),
        stock: parseFloat(addForm.stock || "0"),
      });
      setAddResult("success");
      setTimeout(() => { setShowAdd(false); setAddResult(null); load(); }, 1500);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } };
      if (e?.response?.status === 409) setAddResult("dup");
      else { setAddResult("error"); setAddError(e?.response?.data?.error || "Failed to submit"); }
    } finally {
      setAddLoading(false);
    }
  };

  const clearFilters = () => { setCompany(""); setRole(""); setLevel(""); setLocation(""); setPage(1); };
  const hasFilters = company || role || level || location;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Salary Table</h1>
          <p className="text-faint text-sm">
            {loading ? "Loading…" : `${total.toLocaleString()} entries · level-standardized`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {compareIds.length === 2 && (
            <Link href={`/compare?id1=${compareIds[0]}&id2=${compareIds[1]}`} className="btn">
              Compare selected →
            </Link>
          )}
          <button onClick={() => setShowAdd(true)} className="btn-ghost">
            <Plus size={14} /> Add salary
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={13} className="text-faint" />
          <span className="text-xs text-faint uppercase tracking-widest">Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-sub flex items-center gap-1 hover:text-faint transition-colors">
              <X size={11} /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
            <input className="input pl-8 text-sm" placeholder="Company" value={company}
              onChange={e => { setCompany(e.target.value); setPage(1); }} />
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
            <input className="input pl-8 text-sm" placeholder="Role" value={role}
              onChange={e => { setRole(e.target.value); setPage(1); }} />
          </div>
          <select className="input text-sm" value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}>
            <option value="">All Levels</option>
            {filters.levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="input text-sm" value={location} onChange={e => { setLocation(e.target.value); setPage(1); }}>
            <option value="">All Locations</option>
            {filters.locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Compare hint */}
      {compareIds.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-xs text-accent">
          <GitCompareIcon size={12} />
          {compareIds.length === 1 ? "Select one more row to compare" : "2 rows selected — click Compare"}
          <button onClick={() => setCompareIds([])} className="ml-auto text-sub hover:text-faint"><X size={11} /></button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th><button onClick={() => handleSort("company")}>Company <SortIcon field="company" /></button></th>
                <th>Role</th>
                <th>Level</th>
                <th>Location</th>
                <th><button onClick={() => handleSort("experience_years")}>Exp <SortIcon field="experience_years" /></button></th>
                <th><button onClick={() => handleSort("base_salary")}>Base <SortIcon field="base_salary" /></button></th>
                <th>Bonus</th>
                <th>Stock</th>
                <th><button onClick={() => handleSort("total_compensation")}>Total Comp <SortIcon field="total_compensation" /></button></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" style={{ width: j === 0 ? 20 : "auto" }} /></td>
                      ))}
                    </tr>
                  ))
                : salaries.length === 0
                ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-faint">
                      <div className="text-2xl mb-2">∅</div>
                      No results found. Try adjusting your filters.
                    </td>
                  </tr>
                )
                : salaries.map((s) => {
                  const selected = compareIds.includes(s.id);
                  return (
                    <tr key={s.id} className={selected ? "!bg-accent-dim/40" : ""}>
                      <td>
                        <button
                          onClick={() => toggleCompare(s.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selected ? "bg-accent border-accent" : "border-border hover:border-accent/40"}`}
                          title="Select to compare"
                        >
                          {selected && <Check size={10} className="text-black" />}
                        </button>
                      </td>
                      <td>
                        <Link href={`/company/${encodeURIComponent(s.company)}`} className="font-medium hover:text-accent transition-colors">
                          {s.company}
                        </Link>
                      </td>
                      <td className="text-faint">{s.role}</td>
                      <td><span className="level">{s.level}</span></td>
                      <td className="text-faint">{s.location}</td>
                      <td className="text-sub">{s.experience_years}y</td>
                      <td className="comp">{formatINR(s.base_salary)}</td>
                      <td className="text-sub">{s.bonus > 0 ? formatINR(s.bonus) : <span className="text-sub opacity-40">—</span>}</td>
                      <td className="text-sub">{s.stock > 0 ? formatINR(s.stock) : <span className="text-sub opacity-40">—</span>}</td>
                      <td>
                        <div>
                          <span className="comp-total">{formatINR(s.total_compensation)}</span>
                          <div className="comp-bar mt-1.5" style={{ width: 80 }}>
                            <div className="comp-bar-fill" style={{ width: `${(s.total_compensation / maxComp) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-sub">Page {page} of {pages}</p>
            <div className="flex items-center gap-1">
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
                return (
                  <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === pages}>›</button>
              <button className="page-btn" onClick={() => setPage(pages)} disabled={page === pages}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Add salary modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="card w-full max-w-lg p-6 animate-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Add salary data</h2>
              <button onClick={() => setShowAdd(false)} className="text-sub hover:text-faint"><X size={16} /></button>
            </div>

            {addResult === "success" && (
              <div className="flex items-center gap-2 text-accent text-sm mb-4 p-3 bg-accent-dim rounded-lg border border-accent/20">
                <Check size={16} /> Salary added successfully!
              </div>
            )}
            {addResult === "dup" && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
                <AlertCircle size={16} /> Duplicate entry detected — this record already exists.
              </div>
            )}
            {addResult === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-400/10 rounded-lg border border-red-400/20">
                <AlertCircle size={16} /> {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sub mb-1 block">Company *</label>
                  <input className="input text-sm" placeholder="e.g. Google" required value={addForm.company} onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-sub mb-1 block">Role *</label>
                  <input className="input text-sm" placeholder="e.g. Software Engineer" required value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-sub mb-1 block">Level *</label>
                  <input className="input text-sm" placeholder="e.g. L4, SDE2" required value={addForm.level} onChange={e => setAddForm(f => ({ ...f, level: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-sub mb-1 block">Location *</label>
                  <input className="input text-sm" placeholder="e.g. Bangalore" required value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-sub mb-1 block">Experience (years) *</label>
                  <input className="input text-sm" type="number" min="0" max="50" placeholder="3" required value={addForm.experience_years} onChange={e => setAddForm(f => ({ ...f, experience_years: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-sub mb-1 block">Base salary (₹) *</label>
                  <input className="input text-sm" type="number" min="0" placeholder="2500000" required value={addForm.base_salary} onChange={e => setAddForm(f => ({ ...f, base_salary: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-sub mb-1 block">Bonus (₹)</label>
                  <input className="input text-sm" type="number" min="0" placeholder="0" value={addForm.bonus} onChange={e => setAddForm(f => ({ ...f, bonus: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-sub mb-1 block">Stock / yr (₹)</label>
                  <input className="input text-sm" type="number" min="0" placeholder="0" value={addForm.stock} onChange={e => setAddForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>
              <p className="text-sub text-xs">Total = Base + Bonus + Stock. Missing bonus/stock default to 0.</p>
              <button type="submit" disabled={addLoading} className="btn w-full justify-center mt-2">
                {addLoading ? "Submitting…" : "Submit salary"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GitCompareIcon({ size }: { size: number }) {
  return <span style={{ fontSize: size }}>⇄</span>;
}

export default function SalariesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-8 text-faint">Loading…</div>}>
      <SalariesContent />
    </Suspense>
  );
}
