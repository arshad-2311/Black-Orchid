"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck, Clock, Users, DollarSign, AlertTriangle,
  UtensilsCrossed, Images, Settings, ChevronRight, Download,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { apiGet } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Stats, MenuCategory } from "@/lib/types";
import {
  StatCard, AdminCard, StatusBadge, AdminSectionTitle,
  AdminButton, Badge, Skeleton, EmptyState,
} from "./ui";

/* =========================================================
   HELPERS
   ========================================================= */
function relativeTime(iso: string): string {
  if (!iso) return "just now";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return `${Math.floor(day / 7)}w ago`;
}

const QUICK_ACTIONS: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
}[] = [
  { label: "New Menu Item", icon: UtensilsCrossed, section: "menu" },
  { label: "Add Gallery Image", icon: Images, section: "gallery" },
  { label: "View Reservations", icon: CalendarCheck, section: "reservations" },
  { label: "Site Settings", icon: Settings, section: "settings" },
];

/* =========================================================
   ADMIN OVERVIEW
   ========================================================= */
export function AdminOverview({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [menu, setMenu] = useState<MenuCategory[] | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<Stats>("/api/stats")
      .then((s) => {
        if (alive) setStats(s);
      })
      .catch(() => {});
    apiGet<MenuCategory[]>("/api/menu")
      .then((m) => {
        if (alive) setMenu(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /* ---- Loading state ---- */
  if (!stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const weeklySpark = stats.weekly.map((w) => w.count);
  const chartData = stats.weekly.map((w) => ({
    name: new Date(w.date).toLocaleDateString("en", { weekday: "short" }),
    reservations: w.count,
  }));
  const recent = stats.recentReservations.slice(0, 6);
  const pendingIcon = stats.pendingReservations > 0 ? AlertTriangle : Users;
  const featuredDishes = menu
    ? menu.flatMap((c) => c.items).filter((i) => i.featured).slice(0, 6)
    : [];

  return (
    <div className="space-y-6">
      <AdminSectionTitle
        title="Dashboard"
        subtitle="A snapshot of tonight's service and beyond."
        action={
          <AdminButton variant="outline" size="sm" onClick={() => toast.success("Report queued")}>
            <Download className="h-3.5 w-3.5" /> Export Report
          </AdminButton>
        }
      />

      {/* ============ KPI Row ============ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Reservations"
          value={stats.totalReservations}
          icon={CalendarCheck}
          delta="+12% wow"
          deltaPositive
          spark={weeklySpark}
        />
        <StatCard
          label="Today's Reservations"
          value={stats.todayReservations}
          icon={Clock}
          spark={weeklySpark.slice(-7)}
        />
        <StatCard
          label="Pending Approval"
          value={stats.pendingReservations}
          icon={pendingIcon}
          delta={stats.pendingReservations > 0 ? "needs review" : undefined}
          deltaPositive={stats.pendingReservations === 0}
        />
        <StatCard
          label="Revenue (mo)"
          value="$48,250"
          icon={DollarSign}
          delta="+8%"
          deltaPositive
        />
      </div>

      {/* ============ Chart + Quick Actions ============ */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">
                Reservations · Last 7 Days
              </h3>
              <p className="mt-0.5 font-sans text-xs text-admin-muted">Daily booking count</p>
            </div>
            <Badge tone="gold">This week</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e6c659" />
                    <stop offset="100%" stopColor="#b8902a" />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#8a8a96"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8a8a96"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "rgba(212,175,55,0.06)" }}
                  contentStyle={{
                    background: "#141418",
                    border: "1px solid rgba(212,175,55,0.3)",
                    borderRadius: "10px",
                    color: "#f4f4f6",
                    fontSize: "12px",
                    boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)",
                  }}
                  labelStyle={{ color: "#d4af37", fontWeight: 600 }}
                  itemStyle={{ color: "#f4f4f6" }}
                />
                <Bar dataKey="reservations" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="url(#barGold)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <h3 className="mb-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">
            Quick Actions
          </h3>
          <div className="space-y-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate?.(a.section)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all hover:border-admin-border hover:bg-white/[0.03]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-admin-border bg-admin-gold/10 text-admin-gold transition-colors group-hover:bg-admin-gold/20">
                  <a.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 font-sans text-sm text-admin-text">{a.label}</span>
                <ChevronRight className="h-4 w-4 text-admin-muted transition-transform group-hover:translate-x-0.5 group-hover:text-admin-gold" />
              </button>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* ============ Recent Reservations + Activity ============ */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard className="overflow-hidden p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-admin-border px-6 py-4">
            <div>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">
                Recent Reservations
              </h3>
              <p className="mt-0.5 font-sans text-xs text-admin-muted">Latest booking requests</p>
            </div>
            <button
              onClick={() => onNavigate?.("reservations")}
              className="font-sans text-xs text-admin-gold transition-colors hover:text-admin-gold/80"
            >
              View all
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              title="No reservations yet"
              message="New booking requests will appear here."
            />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-admin-card">
                  <tr className="border-b border-admin-border">
                    <th className="px-6 py-3 text-left admin-label">Guest</th>
                    <th className="px-6 py-3 text-left admin-label">Date / Time</th>
                    <th className="px-6 py-3 text-left admin-label">Pax</th>
                    <th className="px-6 py-3 text-left admin-label">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b border-admin-border/50 transition-colors hover:bg-admin-gold/5",
                        i % 2 === 1 && "bg-white/[0.02]"
                      )}
                    >
                      <td className="px-6 py-3">
                        <p className="font-sans text-sm font-medium text-admin-text">{r.name}</p>
                        <p className="font-sans text-xs text-admin-muted">{r.phone}</p>
                      </td>
                      <td className="px-6 py-3 font-sans text-sm text-admin-text">
                        <p>{r.date}</p>
                        <p className="text-xs text-admin-muted">{r.time}</p>
                      </td>
                      <td className="px-6 py-3 font-sans text-sm text-admin-text">{r.guests}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard className="p-6">
          <h3 className="mb-5 font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">
            Recent Activity
          </h3>
          {recent.length === 0 ? (
            <p className="py-8 text-center font-sans text-sm text-admin-muted">No recent activity.</p>
          ) : (
            <div className="relative pl-7">
              <div className="absolute bottom-1.5 left-[10px] top-1.5 w-px bg-admin-border" />
              <ul className="space-y-5">
                {recent.map((r) => (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full bg-admin-gold ring-4 ring-admin-gold/15" />
                    <p className="font-sans text-sm text-admin-text">
                      New reservation from <span className="font-medium">{r.name}</span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="font-sans text-xs text-admin-muted">
                        {relativeTime(r.createdAt)}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AdminCard>
      </div>

      {/* ============ Popular Dishes ============ */}
      <AdminCard className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-admin-text">
              Popular Dishes
            </h3>
            <p className="mt-0.5 font-sans text-xs text-admin-muted">Featured items on the menu</p>
          </div>
          <button
            onClick={() => onNavigate?.("menu")}
            className="font-sans text-xs text-admin-gold transition-colors hover:text-admin-gold/80"
          >
            View all
          </button>
        </div>
        {!menu ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : featuredDishes.length === 0 ? (
          <EmptyState
            title="No featured dishes"
            message="Mark menu items as featured to highlight them here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDishes.map((d) => (
              <div
                key={d.id}
                className="group flex gap-3 rounded-xl border border-admin-border bg-white/[0.02] p-3 transition-all hover:border-admin-gold/30 hover:bg-admin-gold/[0.03]"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-admin-border bg-admin-bg">
                  {d.image ? (
                    <img src={d.image} alt={d.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-admin-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-sans text-sm font-medium text-admin-text">{d.name}</p>
                    <Badge tone="gold">Featured</Badge>
                  </div>
                  <p className="mt-1 font-[family-name:var(--font-playfair)] text-base font-semibold text-admin-gold">
                    ${d.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
