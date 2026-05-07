"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { salaryApi, formatINR, type CompanyData, type Salary } from "@/lib/api";

const ACCENT = "#00e5a0";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="text-faint mb-1">{label}</p>
      <p className="text-accent font-semibold">{formatINR(payload[0].value)}</p>
    </div>
  );
};

export default function CompanyPage() {
  const { company } = useParams<{ company: string }>();
  const name = decodeURIComponent(company);
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    salaryApi.getCompany(name)
      .then(setData)
      .catch((e) => setError(e?.response?.data?.error || "Company not found"))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="skeleton h-8 w-48 mb-4 rounded" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center pt-24">
        <p className="text-2xl mb-3">🏢</p>
        <p className="text-faint">{error}</p>
        <Link href="/company" className="btn-ghost mt-4 inline-flex"><ArrowLeft size={13} /> Back</Link>
      </div>
    );
  }

  if (!data) return null;

  // Level chart data
  const levelData = Object.entries(data.level_distribution)
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => a.level.localeCompare(b.level));

  // Role chart data — avg comp per role
  const roleMap: Record<string, number[]> = {};
  for (const s of data.salaries) {
    if (!roleMap[s.role]) roleMap[s.role] = [];
    roleMap[s.role].push(s.total_compensation);
  }
  const roleData = Object.entries(roleMap).map(([role, vals]) => ({
    role: role.length > 18 ? role.slice(0, 16) + "…" : role,
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
  })).sort((a, b) => b.avg - a.avg);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const maxComp = Math.max(...data.salaries.map(s => s.total_compensation), 1);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back */}
      <Link href="/company" className="btn-ghost text-xs mb-6 inline-flex"><ArrowLeft size={12} /> All companies</Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center text-lg font-bold text-accent">
            {data.company.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{data.company}</h1>
            <p className="text-faint text-sm">{data.stats.total_entries} salary entries</p>
          </div>
        </div>
        {compareIds.length === 2 && (
          <Link href={`/compare?id1=${compareIds[0]}&id2=${compareIds[1]}`} className="btn">
            <GitCompare size={14} /> Compare selected
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Median Comp", value: formatINR(data.stats.median_compensation), green: true },
          { label: "Average Comp", value: formatINR(data.stats.avg_compensation) },
          { label: "Highest Comp", value: formatINR(data.stats.max_compensation) },
          { label: "Lowest Comp", value: formatINR(data.stats.min_compensation) },
        ].map(({ label, value, green }) => (
          <div key={label} className="card stat-card">
            <div className="stat-label">{label}</div>
            <div className={`stat-num ${green ? "green" : ""}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Level distribution */}
        <div className="card p-5">
          <h3 className="text-xs text-sub uppercase tracking-widest mb-4">Level distribution</h3>
          {levelData.length === 0 ? (
            <p className="text-sub text-sm text-center py-8">No level data</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={levelData} barSize={28}>
                <XAxis dataKey="level" tick={{ fill: "#555c63", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#555c63", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="card px-3 py-2 text-xs">
                      <p className="text-faint">{label}</p>
                      <p className="text-accent font-semibold">{payload[0].value} entries</p>
                    </div>
                  ) : null
                } />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {levelData.map((_, i) => <Cell key={i} fill={ACCENT} fillOpacity={0.6 + 0.4 * (i / levelData.length)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Avg comp by role */}
        <div className="card p-5">
          <h3 className="text-xs text-sub uppercase tracking-widest mb-4">Avg comp by role</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={roleData} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fill: "#555c63", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatINR(v)} />
              <YAxis type="category" dataKey="role" tick={{ fill: "#888e96", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]} fill={ACCENT} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Salary table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium">All salary entries</h3>
          {compareIds.length > 0 && (
            <p className="text-xs text-accent">{compareIds.length} selected for compare</p>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Role</th>
                <th>Level</th>
                <th>Experience</th>
                <th>Base</th>
                <th>Bonus</th>
                <th>Stock</th>
                <th>Total Comp</th>
              </tr>
            </thead>
            <tbody>
              {data.salaries.map((s: Salary) => {
                const selected = compareIds.includes(s.id);
                return (
                  <tr key={s.id} className={selected ? "!bg-accent-dim/40" : ""}>
                    <td>
                      <button
                        onClick={() => toggleCompare(s.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected ? "bg-accent border-accent" : "border-border hover:border-accent/40"}`}
                      >
                        {selected && <span className="text-black text-[9px]">✓</span>}
                      </button>
                    </td>
                    <td className="text-faint">{s.role}</td>
                    <td><span className="level">{s.level}</span></td>
                    <td className="text-sub">{s.experience_years}y</td>
                    <td className="comp">{formatINR(s.base_salary)}</td>
                    <td className="text-sub">{s.bonus > 0 ? formatINR(s.bonus) : <span className="opacity-30">—</span>}</td>
                    <td className="text-sub">{s.stock > 0 ? formatINR(s.stock) : <span className="opacity-30">—</span>}</td>
                    <td>
                      <div>
                        <span className="comp-total">{formatINR(s.total_compensation)}</span>
                        <div className="comp-bar mt-1" style={{ width: 60 }}>
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
      </div>
    </div>
  );
}
