"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarCheck, UtensilsCrossed, Images, Star, CalendarHeart,
  Package, Settings, LogOut, UtensilsCrossed as Logo, Menu, X, Lock, ArrowLeft,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminInput, AdminButton } from "./ui";
import { AdminOverview } from "./AdminOverview";
import { AdminReservations } from "./AdminReservations";
import { AdminMenu } from "./AdminMenu";
import { AdminGallery } from "./AdminGallery";
import { AdminTestimonials } from "./AdminTestimonials";
import { AdminEvents } from "./AdminEvents";
import { AdminCatering } from "./AdminCatering";
import { AdminSettings } from "./AdminSettings";

type Section = "overview" | "reservations" | "menu" | "gallery" | "testimonials" | "events" | "catering" | "settings";

const NAV: { key: Section; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "reservations", label: "Reservations", Icon: CalendarCheck },
  { key: "menu", label: "Menu", Icon: UtensilsCrossed },
  { key: "gallery", label: "Gallery", Icon: Images },
  { key: "testimonials", label: "Testimonials", Icon: Star },
  { key: "events", label: "Events", Icon: CalendarHeart },
  { key: "catering", label: "Catering", Icon: Package },
  { key: "settings", label: "Settings", Icon: Settings },
];

export function AdminApp() {
  const router = useRouter();
  const { adminUser, adminToken, setAdmin, clearAdmin } = useApp();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const goHome = () => router.push("/");

  if (!adminToken || !adminUser) {
    return <LoginScreen onSuccess={(token, user) => setAdmin(token, user)} onBack={goHome} />;
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="mx-auto flex max-w-[1600px] gap-0">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gold/10 bg-sidebar transition-transform duration-300 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col p-4">
            <div className="mb-6 flex items-center gap-3 px-2 py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold"><Logo className="h-4 w-4" /></span>
              <div>
                <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold">Admin Panel</p>
                <p className="font-sans text-[10px] uppercase tracking-wider text-gold/70">Black Orchid CMS</p>
              </div>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setSection(item.key); setSidebarOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm transition-colors",
                    section === item.key ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
                  )}
                >
                  <item.Icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="space-y-2 border-t border-gold/10 pt-3">
              <div className="rounded-lg bg-gold/5 px-3 py-2">
                <p className="font-sans text-xs font-medium text-foreground">{adminUser.name}</p>
                <p className="truncate font-sans text-[10px] text-muted-foreground">{adminUser.email}</p>
                <span className="mt-1 inline-block rounded bg-gold/20 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-wider text-gold">{adminUser.role}</span>
              </div>
              <button onClick={() => { clearAdmin(); goHome(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm text-red-400 hover:bg-red-500/10">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-30 bg-background/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 text-gold"><Menu className="h-5 w-5" /></button>
            <button onClick={goHome} className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-muted-foreground hover:text-gold"><ArrowLeft className="h-4 w-4" /> Back to site</button>
          </div>
          <div className="hidden justify-end lg:flex">
            <button onClick={goHome} className="mb-4 flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-muted-foreground hover:text-gold"><ArrowLeft className="h-4 w-4" /> Back to site</button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {section === "overview" && <AdminOverview />}
              {section === "reservations" && <AdminReservations />}
              {section === "menu" && <AdminMenu />}
              {section === "gallery" && <AdminGallery />}
              {section === "testimonials" && <AdminTestimonials />}
              {section === "events" && <AdminEvents />}
              {section === "catering" && <AdminCatering />}
              {section === "settings" && <AdminSettings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function LoginScreen({ onSuccess, onBack }: { onSuccess: (token: string, user: { name: string; email: string; role: string }) => void; onBack: () => void }) {
  const [email, setEmail] = useState("admin@blackorchid.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{ token: string; user: { name: string; email: string; role: string } }>("/api/admin/login", { email, password });
      onSuccess(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-gold rounded-3xl p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 text-gold">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground">Admin Access</h1>
            <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-muted-foreground">Sign in to manage Black Orchid</p>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <AdminInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            <AdminInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-sans text-sm text-red-400">{error}</p>}
            <AdminButton type="submit" className="w-full justify-center py-3" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </AdminButton>
          </form>
          <div className="mt-5 rounded-lg border border-gold/10 bg-background/40 p-3 text-center">
            <p className="font-sans text-[10px] uppercase tracking-wider text-gold/70">Demo Credentials</p>
            <p className="mt-1 font-sans text-xs text-muted-foreground">admin@blackorchid.com · admin123</p>
          </div>
          <button onClick={onBack} className="mt-4 flex w-full items-center justify-center gap-2 font-sans text-xs uppercase tracking-wider text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Back to website
          </button>
        </div>
      </motion.div>
    </div>
  );
}
