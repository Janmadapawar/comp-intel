"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Building2, GitCompare, Search, Sparkles, TrendingUp, Zap } from "lucide-react";
import { salaryApi, formatINR, type StatsData } from "@/lib/api";

const COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Flipkart", "Swiggy", "Razorpay", "Zepto", "PhonePe", "Atlassian", "Adobe", "Uber"];
const PLACEHOLDER_FACTS = [
  "L4 at Google earns 2x an SDE2 at TCS",
  "Same title ≠ same compensation",
  "Level standardization reveals the truth",
  "SDE2 at Flipkart vs SDE2 at Meta — very different stories",
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [companies, setCompanies] = useState<{ name: string; count: number; avg_compensation: number }[]>([]);
  const [factIdx, setFactIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    salaryApi.getStats().then(setStats).catch(() => {});
    salaryApi.getCompanies().then(setCompanies).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFactIdx((i) => (i + 1) % PLACEHOLDER_FACTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Mouse glow effect
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--y", `${e.clientY - rect.top}px`);
    };
    el.addEventListener("mousemove", move);
    return () => el.removeEventListener("mousemove", move);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/salaries?company=${encodeURIComponent(query.trim())}`);
    else router.push("/salaries");
  };

  return (
    <div className="grid-bg min-h-screen">
      {/* Hero */}
      <div ref={heroRef} className="glow-spot relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Eyebrow */}
          <div className="animate-in flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-accent-dim border border-accent/20 rounded-full px-4 py-1.5 text-xs text-accent font-medium">
              <Zap size={12} />
              Level-standardized salary intelligence
            </div>
          </div>

          {/* Headline */}
          <h1 className="animate-in delay-1 text-5xl font-semibold tracking-tight leading-tight mb-4">
            Know your worth.<br />
            <span className="text-accent">By level, not by title.</span>
          </h1>

          <p className="animate-in delay-2 text-faint text-lg max-w-xl mx-auto mb-3">
            Real compensation data for Indian tech. Structured, comparable, decision-ready.
          </p>

          {/* Rotating fact */}
          <p className="animate-in delay-2 text-sub text-sm mb-10 h-5 transition-all duration-500">
            <Sparkles size={12} className="inline mr-1.5 text-accent/60" />
            {PLACEHOLDER_FACTS[factIdx]}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="animate-in delay-3 flex gap-2 max-w-lg mx-auto mb-10">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
              <input
                className="input pl-9 h-11"
                placeholder="Search by company (Google, Flipkart…)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn px-5">
              Explore <ArrowRight size={14} />
            </button>
          </form>

          {/* Company pills */}
          <div className="animate-in delay-4 flex flex-wrap justify-center gap-2">
            {COMPANIES.slice(0, 10).map((c) => (
              <Link
                key={c}
                href={`/company/${encodeURIComponent(c)}`}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
          {[
            {
              label: "Salary entries",
              value: stats ? `${stats.total_entries}+` : "—",
              icon: BarChart3,
            },
            {
              label: "Avg total comp",
              value: stats ? formatINR(stats.avg_compensation) : "—",
              icon: TrendingUp,
            },
            {
              label: "Top paying",
              value: stats?.top_paying_company ?? "—",
              icon: Building2,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-2">
                <Icon size={18} className="text-accent/60" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-accent">{value}</div>
              <div className="text-sub text-xs mt-1 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why levels matter */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-sub text-xs uppercase tracking-widest mb-3">The core insight</p>
          <h2 className="text-2xl font-semibold tracking-tight">Why Levels &gt; Titles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            {
              title: "Titles lie",
              body: "\"Senior Engineer\" at a startup vs a FAANG company are completely different roles with 3x the compensation gap.",
              color: "#ff6b6b",
            },
            {
              title: "Levels reveal truth",
              body: "L4 at Google and SDE2 at Microsoft are comparable bands. That's the comparison that matters for career decisions.",
              color: "#00e5a0",
            },
            {
              title: "Make better moves",
              body: "Know exactly where you stand in the market before any negotiation. Data-driven, not gut-feeling.",
              color: "#60a5fa",
            },
          ].map(({ title, body, color }) => (
            <div key={title} className="card card-hover p-6">
              <div className="w-2 h-2 rounded-full mb-4" style={{ background: color }} />
              <h3 className="font-semibold text-sm mb-2">{title}</h3>
              <p className="text-faint text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Feature tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: "/salaries",
              icon: BarChart3,
              title: "Salary Table",
              desc: "Filter by company, role, level, and location. Sort by total comp.",
            },
            {
              href: "/company",
              icon: Building2,
              title: "Company Pages",
              desc: "Deep-dive into any company — level distribution, median pay, role breakdown.",
            },
            {
              href: "/compare",
              icon: GitCompare,
              title: "Side-by-Side Compare",
              desc: "Pick any two salary entries and see base, bonus, stock, and total diffs.",
            },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href} className="card card-hover p-6 group block">
              <div className="w-9 h-9 rounded-lg bg-accent-dim border border-accent/15 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Icon size={16} className="text-accent" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-faint text-xs leading-relaxed">{desc}</p>
              <div className="mt-4 text-accent text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Companies preview */}
      {companies.length > 0 && (
        <div className="border-t border-border bg-card/30">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold">All companies</h2>
              <Link href="/company" className="btn-ghost text-xs">View all</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {companies.slice(0, 8).map((c) => (
                <Link key={c.name} href={`/company/${encodeURIComponent(c.name)}`} className="card card-hover p-4">
                  <div className="text-sm font-medium mb-1">{c.name}</div>
                  <div className="text-accent text-sm font-semibold">{formatINR(c.avg_compensation)}</div>
                  <div className="text-sub text-xs mt-0.5">avg · {c.count} entries</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sub text-xs">
        <p>CompIntel · Level-standardized compensation data for Indian tech</p>
        <p className="mt-1 opacity-50">Built for decisions, not listings.</p>
      </footer>
    </div>
  );
}
