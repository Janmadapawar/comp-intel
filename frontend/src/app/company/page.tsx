"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import { salaryApi, formatINR } from "@/lib/api";

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<{ name: string; count: number; avg_compensation: number }[]>([]);
  const [filtered, setFiltered] = useState<typeof companies>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salaryApi.getCompanies().then(data => {
      setCompanies(data);
      setFiltered(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(companies.filter(c => c.name.toLowerCase().includes(q)));
  }, [query, companies]);

  const max = Math.max(...filtered.map(c => c.avg_compensation), 1);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Companies</h1>
          <p className="text-faint text-sm">{companies.length} companies · ranked by avg compensation</p>
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
        <input className="input pl-9 text-sm" placeholder="Search company…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-faint">No companies found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <Link key={c.name} href={`/company/${encodeURIComponent(c.name)}`} className="card card-hover p-5 animate-in" style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent/15 flex items-center justify-center text-xs font-bold text-accent">
                  {c.name.charAt(0)}
                </div>
                <span className="text-sub text-xs">{c.count} entries</span>
              </div>
              <div className="font-semibold text-sm mb-1">{c.name}</div>
              <div className="text-accent font-semibold text-sm mb-2">{formatINR(c.avg_compensation)}</div>
              <div className="comp-bar">
                <div className="comp-bar-fill" style={{ width: `${(c.avg_compensation / max) * 100}%` }} />
              </div>
              <div className="text-sub text-xs mt-1.5 flex items-center gap-1">
                <TrendingUp size={10} /> avg total comp
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
