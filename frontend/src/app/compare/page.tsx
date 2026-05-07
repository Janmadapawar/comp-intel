"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, X, GitCompare, Trophy } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { salaryApi, formatINR, diffClass, diffSign, type Salary, type CompareData } from "@/lib/api";

function CompareContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search state
  const [searchQuery1, setSearchQuery1] = useState("");
  const [searchQuery2, setSearchQuery2] = useState("");
  const [results1, setResults1] = useState<Salary[]>([]);
  const [results2, setResults2] = useState<Salary[]>([]);
  const [selected1, setSelected1] = useState<Salary | null>(null);
  const [selected2, setSelected2] = useState<Salary | null>(null);
  const [searching1, setSearching1] = useState(false);
  const [searching2, setSearching2] = useState(false);

  // Load from URL params
  useEffect(() => {
    const id1 = params.get("id1");
    const id2 = params.get("id2");
    if (id1 && id2) {
      setLoading(true);
      salaryApi.compare(id1, id2)
        .then(d => {
          setCompareData(d);
          setSelected1(d.salary1);
          setSelected2(d.salary2);
        })
        .catch(e => setError(e?.response?.data?.error || "Failed to compare"))
        .finally(() => setLoading(false));
    }
  }, [params]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery1.trim()) { setResults1([]); return; }
    const t = setTimeout(async () => {
      setSearching1(true);
      try {
        const res = await salaryApi.getSalaries({ company: searchQuery1, limit: 6 });
        setResults1(res.data);
      } finally { setSearching1(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery1]);

  useEffect(() => {
    if (!searchQuery2.trim()) { setResults2([]); return; }
    const t = setTimeout(async () => {
      setSearching2(true);
      try {
        const res = await salaryApi.getSalaries({ company: searchQuery2, limit: 6 });
        setResults2(res.data);
      } finally { setSearching2(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery2]);

  const handleCompare = async () => {
    if (!selected1 || !selected2) return;
    if (selected1.id === selected2.id) { setError("Please select two different salary entries."); return; }
    setLoading(true);
    setError("");
    try {
      const d = await salaryApi.compare(selected1.id, selected2.id);
      setCompareData(d);
      router.push(`/compare?id1=${selected1.id}&id2=${selected2.id}`, { scroll: false });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || "Failed to compare");
    } finally {
      setLoading(false);
    }
  };

  const SalaryCard = ({
    salary, onSelect, onClear, isSelected
  }: {
    salary: Salary | null; onSelect: (s: Salary) => void; onClear: () => void; isSelected: boolean;
    searchQuery: string; setSearchQuery: (q: string) => void; results: Salary[]; searching: boolean;
  } & {
    searchQuery: string; setSearchQuery: (q: string) => void; results: Salary[]; searching: boolean;
  }) => {
    const props = arguments[0] as typeof arguments[0] & {
      searchQuery: string; setSearchQuery: (q: string) => void; results: Salary[]; searching: boolean;
    };
    return (
      <div className={`compare-slot p-5 min-h-[200px] ${isSelected ? "filled" : ""}`}>
        {salary ? (
          <div className="animate-in">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                {salary.company.charAt(0)}
              </div>
              <button onClick={onClear} className="text-sub hover:text-faint p-1"><X size={13} /></button>
            </div>
            <div className="font-semibold text-sm mb-0.5">{salary.company}</div>
            <span className="level text-[10px]">{salary.level}</span>
            <div className="mt-2 text-faint text-xs">{salary.role}</div>
            <div className="mt-0.5 text-sub text-xs">{salary.location} · {salary.experience_years}y exp</div>
            <div className="mt-3 text-accent font-semibold text-base">{formatINR(salary.total_compensation)}</div>
            <div className="text-sub text-xs mt-0.5">total compensation</div>
          </div>
        ) : (
          <div>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
              <input
                className="input pl-8 text-sm"
                placeholder="Search company…"
                value={props.searchQuery}
                onChange={e => props.setSearchQuery(e.target.value)}
              />
            </div>
            {props.searching && <p className="text-sub text-xs px-1">Searching…</p>}
            {props.results.length > 0 && (
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                {props.results.map(r => (
                  <button key={r.id} onClick={() => { onSelect(r); props.setSearchQuery(""); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm">
                    <span className="font-medium">{r.company}</span>
                    <span className="level ml-2 text-[10px]">{r.level}</span>
                    <span className="text-sub text-xs ml-2">{r.role}</span>
                    <span className="float-right text-accent text-xs">{formatINR(r.total_compensation)}</span>
                  </button>
                ))}
              </div>
            )}
            {!props.searching && props.results.length === 0 && props.searchQuery && (
              <p className="text-sub text-xs px-1 mt-1">No results found.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Radar chart data
  const radarData = compareData ? [
    {
      metric: "Base",
      A: Math.round((compareData.salary1.base_salary / Math.max(compareData.salary1.base_salary, compareData.salary2.base_salary)) * 100),
      B: Math.round((compareData.salary2.base_salary / Math.max(compareData.salary1.base_salary, compareData.salary2.base_salary)) * 100),
    },
    {
      metric: "Bonus",
      A: Math.round((compareData.salary1.bonus / Math.max(compareData.salary1.bonus, compareData.salary2.bonus, 1)) * 100),
      B: Math.round((compareData.salary2.bonus / Math.max(compareData.salary1.bonus, compareData.salary2.bonus, 1)) * 100),
    },
    {
      metric: "Stock",
      A: Math.round((compareData.salary1.stock / Math.max(compareData.salary1.stock, compareData.salary2.stock, 1)) * 100),
      B: Math.round((compareData.salary2.stock / Math.max(compareData.salary1.stock, compareData.salary2.stock, 1)) * 100),
    },
    {
      metric: "Total",
      A: Math.round((compareData.salary1.total_compensation / Math.max(compareData.salary1.total_compensation, compareData.salary2.total_compensation)) * 100),
      B: Math.round((compareData.salary2.total_compensation / Math.max(compareData.salary1.total_compensation, compareData.salary2.total_compensation)) * 100),
    },
    {
      metric: "Experience",
      A: Math.round((compareData.salary1.experience_years / Math.max(compareData.salary1.experience_years, compareData.salary2.experience_years, 1)) * 100),
      B: Math.round((compareData.salary2.experience_years / Math.max(compareData.salary1.experience_years, compareData.salary2.experience_years, 1)) * 100),
    },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/salaries" className="btn-ghost text-xs mb-6 inline-flex"><ArrowLeft size={12} /> Back to salaries</Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center">
          <GitCompare size={16} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compare salaries</h1>
          <p className="text-faint text-sm">Side-by-side compensation breakdown</p>
        </div>
      </div>

      {/* Selection */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start mb-6">
        <div>
          <p className="text-xs text-sub uppercase tracking-widest mb-2">Salary A</p>
          {selected1 ? (
            <div className={`compare-slot filled p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                  {selected1.company.charAt(0)}
                </div>
                <button onClick={() => { setSelected1(null); setCompareData(null); }} className="text-sub hover:text-faint p-1"><X size={13} /></button>
              </div>
              <div className="font-semibold text-sm mb-0.5">{selected1.company}</div>
              <span className="level text-[10px]">{selected1.level}</span>
              <div className="mt-2 text-faint text-xs">{selected1.role}</div>
              <div className="mt-0.5 text-sub text-xs">{selected1.location} · {selected1.experience_years}y</div>
              <div className="mt-3 text-accent font-semibold text-base">{formatINR(selected1.total_compensation)}</div>
            </div>
          ) : (
            <div className="compare-slot p-4">
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
                <input className="input pl-8 text-sm" placeholder="Search company…" value={searchQuery1} onChange={e => setSearchQuery1(e.target.value)} />
              </div>
              {searching1 && <p className="text-sub text-xs px-1">Searching…</p>}
              {results1.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {results1.map(r => (
                    <button key={r.id} onClick={() => { setSelected1(r); setSearchQuery1(""); setResults1([]); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm">
                      <span className="font-medium">{r.company}</span>
                      <span className="level ml-2 text-[10px]">{r.level}</span>
                      <span className="text-sub text-xs ml-1">{r.role}</span>
                      <span className="float-right text-accent text-xs">{formatINR(r.total_compensation)}</span>
                    </button>
                  ))}
                </div>
              )}
              {!searching1 && results1.length === 0 && searchQuery1 && <p className="text-sub text-xs px-1">No results.</p>}
            </div>
          )}
        </div>

        <div className="pt-7 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sub text-xs">vs</div>
          {selected1 && selected2 && !compareData && (
            <button onClick={handleCompare} disabled={loading} className="btn text-xs py-1.5 px-3 mt-1">
              {loading ? "…" : <><ArrowRight size={11} /> Go</>}
            </button>
          )}
        </div>

        <div>
          <p className="text-xs text-sub uppercase tracking-widest mb-2">Salary B</p>
          {selected2 ? (
            <div className={`compare-slot filled p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                  {selected2.company.charAt(0)}
                </div>
                <button onClick={() => { setSelected2(null); setCompareData(null); }} className="text-sub hover:text-faint p-1"><X size={13} /></button>
              </div>
              <div className="font-semibold text-sm mb-0.5">{selected2.company}</div>
              <span className="level text-[10px]">{selected2.level}</span>
              <div className="mt-2 text-faint text-xs">{selected2.role}</div>
              <div className="mt-0.5 text-sub text-xs">{selected2.location} · {selected2.experience_years}y</div>
              <div className="mt-3 text-blue-400 font-semibold text-base">{formatINR(selected2.total_compensation)}</div>
            </div>
          ) : (
            <div className="compare-slot p-4">
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
                <input className="input pl-8 text-sm" placeholder="Search company…" value={searchQuery2} onChange={e => setSearchQuery2(e.target.value)} />
              </div>
              {searching2 && <p className="text-sub text-xs px-1">Searching…</p>}
              {results2.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {results2.map(r => (
                    <button key={r.id} onClick={() => { setSelected2(r); setSearchQuery2(""); setResults2([]); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm">
                      <span className="font-medium">{r.company}</span>
                      <span className="level ml-2 text-[10px]">{r.level}</span>
                      <span className="text-sub text-xs ml-1">{r.role}</span>
                      <span className="float-right text-accent text-xs">{formatINR(r.total_compensation)}</span>
                    </button>
                  ))}
                </div>
              )}
              {!searching2 && results2.length === 0 && searchQuery2 && <p className="text-sub text-xs px-1">No results.</p>}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">{error}</div>
      )}

      {/* Results */}
      {compareData && (
        <div className="animate-in space-y-4">
          {/* Winner banner */}
          {compareData.comparison.winner !== "tie" && (
            <div className="card p-4 flex items-center gap-3 border-accent/20">
              <Trophy size={18} className="text-accent" />
              <div>
                <span className="text-accent font-semibold">
                  {compareData.comparison.winner === "salary1" ? compareData.salary1.company : compareData.salary2.company}
                </span>
                <span className="text-faint text-sm"> pays {Math.abs(compareData.comparison.total_diff_pct)}% more in total compensation</span>
              </div>
            </div>
          )}

          {/* Breakdown table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs text-sub uppercase tracking-widest">Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-sub text-xs uppercase tracking-widest">Component</th>
                  <th className="text-right px-5 py-3 text-accent text-xs">{compareData.salary1.company} · {compareData.salary1.level}</th>
                  <th className="text-right px-5 py-3 text-blue-400 text-xs">{compareData.salary2.company} · {compareData.salary2.level}</th>
                  <th className="text-right px-5 py-3 text-sub text-xs uppercase tracking-widest">Difference</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Base Salary", v1: compareData.salary1.base_salary, v2: compareData.salary2.base_salary, diff: compareData.comparison.base_diff },
                  { label: "Bonus", v1: compareData.salary1.bonus, v2: compareData.salary2.bonus, diff: compareData.comparison.bonus_diff },
                  { label: "Stock / yr", v1: compareData.salary1.stock, v2: compareData.salary2.stock, diff: compareData.comparison.stock_diff },
                ].map(({ label, v1, v2, diff }) => (
                  <tr key={label}>
                    <td className="px-5 py-3 text-faint">{label}</td>
                    <td className="px-5 py-3 text-right comp">{v1 > 0 ? formatINR(v1) : <span className="text-sub opacity-40">—</span>}</td>
                    <td className="px-5 py-3 text-right comp">{v2 > 0 ? formatINR(v2) : <span className="text-sub opacity-40">—</span>}</td>
                    <td className={`px-5 py-3 text-right font-medium ${diffClass(diff)}`}>{diffSign(diff)}</td>
                  </tr>
                ))}
                <tr className="border-t border-border bg-white/[0.02]">
                  <td className="px-5 py-3 font-semibold text-sm">Total Comp</td>
                  <td className="px-5 py-3 text-right text-accent font-semibold">{formatINR(compareData.salary1.total_compensation)}</td>
                  <td className="px-5 py-3 text-right text-blue-400 font-semibold">{formatINR(compareData.salary2.total_compensation)}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${diffClass(compareData.comparison.total_diff)}`}>
                    {diffSign(compareData.comparison.total_diff)}
                    {compareData.comparison.total_diff_pct !== 0 && (
                      <span className="text-xs ml-1 opacity-70">({Math.abs(compareData.comparison.total_diff_pct)}%)</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Meta info + radar */}
          <div className="grid grid-cols-2 gap-4">
            {/* Meta */}
            <div className="card p-5 space-y-3">
              <h3 className="text-xs text-sub uppercase tracking-widest mb-3">Details</h3>
              {[
                { label: "Level comparison", value: compareData.comparison.level_note },
                { label: "Salary A location", value: compareData.salary1.location },
                { label: "Salary B location", value: compareData.salary2.location },
                { label: "Salary A experience", value: `${compareData.salary1.experience_years} years` },
                { label: "Salary B experience", value: `${compareData.salary2.experience_years} years` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-sub">{label}</span>
                  <span className="text-faint">{value}</span>
                </div>
              ))}
            </div>

            {/* Radar chart */}
            <div className="card p-5">
              <h3 className="text-xs text-sub uppercase tracking-widest mb-3">Visual comparison</h3>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1c1e21" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#555c63", fontSize: 11 }} />
                  <Radar name={compareData.salary1.company} dataKey="A" stroke="#00e5a0" fill="#00e5a0" fillOpacity={0.15} />
                  <Radar name={compareData.salary2.company} dataKey="B" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} />
                  <Tooltip content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="card px-3 py-2 text-xs space-y-1">
                        <p className="text-faint">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.stroke as string }}>{p.name}: {p.value}%</p>
                        ))}
                      </div>
                    ) : null
                  } />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-accent"><div className="w-2 h-2 rounded-full bg-accent" />{compareData.salary1.company}</div>
                <div className="flex items-center gap-1.5 text-xs text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400" />{compareData.salary2.company}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!compareData && !selected1 && !selected2 && (
        <div className="text-center py-16 text-faint text-sm">
          <GitCompare size={32} className="mx-auto mb-4 opacity-20" />
          <p>Search for any two salary entries to compare them side by side.</p>
          <p className="text-sub text-xs mt-1">Or select rows from the salary table.</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-6 py-8 text-faint">Loading…</div>}>
      <CompareContent />
    </Suspense>
  );
}
