"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, GitCompare, Home, TrendingUp } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/salaries", label: "Salaries", icon: BarChart3 },
  { href: "/company", label: "Companies", icon: Building2 },
  { href: "/compare", label: "Compare", icon: GitCompare },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center">
            <TrendingUp size={14} className="text-accent" />
          </div>
          <span className="font-semibold text-sm tracking-tight">
            Comp<span className="text-accent">Intel</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="badge text-[10px]">India</span>
          <Link href="/salaries" className="btn text-xs py-1.5 px-3">
            + Add Salary
          </Link>
        </div>
      </div>
    </nav>
  );
}
