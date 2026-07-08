"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, UtensilsCrossed, Images, Sparkles, Eye, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { apiGet } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { StatCard, AdminCard, StatusBadge } from "./ui";

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    apiGet<Stats>("/api/stats").then(setStats).catch(() => {});
  }, []);

  if (!stats) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-xl shimmer" />)}</div>;
  }

  const chartData = stats.weekly.map((w) => ({
    name: new Date(w.date).toLocaleDateString("en", { weekday: "short" }),
    reservations: w.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 font-sans text-sm text-muted-foreground">A snapshot of tonight's service and beyond.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Reservations" value={stats.totalReservations} icon={Calendar} accent />
        <StatCard label="Today's Reservations" value={stats.todayReservations} icon={Clock} />
        <StatCard label="Pending Approval" value={stats.pendingReservations} icon={Users} />
        <StatCard label="Menu Items" value={stats.totalMenuItems} icon={UtensilsCrossed} />
        <StatCard label="Gallery Images" value={stats.totalGallery} icon={Images} />
        <StatCard label="Events" value={stats.totalEvents} icon={Sparkles} />
        <StatCard label="Testimonials" value={stats.totalTestimonials} icon={TrendingUp} />
        <StatCard label="Website Visitors" value={stats.visitors.toLocaleString()} icon={Eye} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">Reservations · Last 7 Days</h3>
            <span className="font-sans text-xs text-muted-foreground">Daily count</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="oklch(0.6 0.02 80)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0.02 80)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "oklch(0.82 0.14 84 / 0.08)" }}
                  contentStyle={{ background: "oklch(0.2 0.01 264)", border: "1px solid oklch(0.82 0.14 84 / 0.3)", borderRadius: "0.5rem", color: "oklch(0.96 0.012 80)" }}
                />
                <Bar dataKey="reservations" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="oklch(0.82 0.14 84)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="mb-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 border-b border-gold/10 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm text-foreground">{r.name}</p>
                  <p className="font-sans text-xs text-muted-foreground">{r.date} · {r.time} · {r.guests}pax</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
            {!stats.recentReservations.length && (
              <p className="py-6 text-center font-sans text-sm text-muted-foreground">No recent reservations.</p>
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
