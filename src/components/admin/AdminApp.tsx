"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarCheck, UtensilsCrossed, Images, Star, CalendarHeart,
  Package, Settings, LogOut, Menu, X, Lock, ArrowLeft, ChevronLeft, Mail, KeyRound,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminInput, AdminButton, Modal } from "./ui";
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

const SECTION_TITLES: Record<Section, string> = {
  overview: "Dashboard",
  reservations: "Reservations",
  menu: "Menu",
  gallery: "Gallery",
  testimonials: "Testimonials",
  events: "Events",
  catering: "Catering",
  settings: "Settings",
};

const COLLAPSE_KEY = "bo_admin_sidebar_collapsed";

export function AdminApp() {
  const router = useRouter();
  const { adminUser, adminToken, setAdmin, clearAdmin } = useApp();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  });

  // Validate token session with server on mount
  useEffect(() => {
    if (adminToken) {
      import("@/lib/api").then(({ apiGet }) => {
        apiGet("/api/admin/me").catch(() => {
          clearAdmin();
          toast.error("Session expired. Please sign in again.");
        });
      });
    }
  }, [adminToken, clearAdmin]);

  // Persist collapse preference (no setState in effect body — just a side-effect write)
  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const goHome = () => router.push("/");
  const signOut = () => {
    clearAdmin();
    router.push("/");
  };
  const handleNav = (s: Section) => {
    setSection(s);
    setSidebarOpen(false);
  };

  if (!adminToken || !adminUser) {
    return (
      <div className="admin-root">
        <LoginScreen onSuccess={(token, user) => setAdmin(token, user)} onBack={goHome} />
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="flex min-h-screen bg-admin-bg">
        {/* Desktop sidebar */}
        <aside
          className="sticky top-0 hidden h-screen shrink-0 border-r border-admin-border bg-admin-card transition-[width] duration-300 ease-out lg:block"
          style={{ width: collapsed ? 72 : 256 }}
        >
          <SidebarContent
            idPrefix="ds"
            section={section}
            onNav={handleNav}
            user={adminUser}
            onSignOut={signOut}
            onChangePassword={() => setPwModalOpen(true)}
            collapsed={collapsed}
          />
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-admin-border bg-admin-card text-admin-muted transition-all hover:border-admin-gold/50 hover:text-admin-gold"
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -288 }}
                animate={{ x: 0 }}
                exit={{ x: -288 }}
                transition={{ type: "spring", stiffness: 360, damping: 36 }}
                className="fixed inset-y-0 left-0 z-50 w-72 border-r border-admin-border bg-admin-card lg:hidden"
              >
                <SidebarContent
                  idPrefix="ms"
                  section={section}
                  onNav={handleNav}
                  user={adminUser}
                  onSignOut={signOut}
            onChangePassword={() => setPwModalOpen(true)}
                  collapsed={false}
                  onClose={() => setSidebarOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="admin-glass sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-admin-border px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-border text-admin-muted transition-colors hover:text-admin-text lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-admin-text">
                {SECTION_TITLES[section]}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-admin-gold transition-colors hover:text-admin-gold/80 sm:flex"
              >
                View Site
              </a>
              <AdminButton variant="ghost" size="sm" onClick={goHome}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back to site
              </AdminButton>
            </div>
          </header>

          {/* Section content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {section === "overview" && <AdminOverview onNavigate={(s) => setSection(s as Section)} />}
                  {section === "reservations" && <AdminReservations />}
                  {section === "menu" && <AdminMenu />}
                  {section === "gallery" && <AdminGallery />}
                  {section === "testimonials" && <AdminTestimonials />}
                  {section === "events" && <AdminEvents />}
                  {section === "catering" && <AdminCatering />}
                  {section === "settings" && <AdminSettings />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <ChangePasswordModal open={pwModalOpen} onClose={() => setPwModalOpen(false)} onSignOut={signOut} />
    </div>
  );
}

/* =========================================================
   SIDEBAR CONTENT — shared by desktop + mobile drawer
   ========================================================= */
function SidebarContent({
  idPrefix, section, onNav, user, onSignOut, onChangePassword, collapsed, onClose,
}: {
  idPrefix: string;
  section: Section;
  onNav: (s: Section) => void;
  user: { name: string; email: string; role: string };
  onSignOut: () => void;
  onChangePassword: () => void;
  collapsed: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-admin-border px-4 py-4",
          collapsed && "justify-center px-2"
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-admin-gold/40 bg-admin-gold/10 text-admin-gold">
          <UtensilsCrossed className="h-4 w-4" />
        </span>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-playfair)] text-base font-semibold text-admin-text">
                Admin Panel
              </p>
              <p className="truncate font-sans text-[10px] uppercase tracking-wider text-admin-gold/80">
                Black Orchid CMS
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-admin-border text-admin-muted transition-colors hover:text-admin-text"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {NAV.map((item) => {
          const active = section === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "text-admin-gold"
                  : "text-admin-muted hover:bg-white/[0.03] hover:text-admin-text"
              )}
            >
              {active && (
                <>
                  <motion.div
                    layoutId={`${idPrefix}-active-bg`}
                    className="absolute inset-0 rounded-xl border border-admin-gold/15 bg-admin-gold/[0.08]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                  <motion.div
                    layoutId={`${idPrefix}-active-bar`}
                    className="absolute left-1 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full admin-gold-bg"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                </>
              )}
              <item.Icon className="relative h-4 w-4 shrink-0" />
              {!collapsed && <span className="relative truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-admin-border p-3">
        {!collapsed ? (
          <div className="mb-2 rounded-xl border border-admin-border bg-white/[0.02] p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full admin-gold-bg text-xs font-bold text-black">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-medium text-admin-text">{user.name}</p>
                <p className="truncate font-sans text-[11px] text-admin-muted">{user.email}</p>
              </div>
            </div>
            <span className="mt-2 inline-block rounded-md border border-admin-gold/30 bg-admin-gold/10 px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wider text-admin-gold">
              {user.role}
            </span>
          </div>
        ) : (
          <div className="mb-2 flex justify-center" title={user.name}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full admin-gold-bg text-xs font-bold text-black">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <button
          onClick={onChangePassword}
          title={collapsed ? "Change Password" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm text-admin-muted transition-colors hover:bg-white/5 hover:text-admin-text",
            collapsed && "justify-center px-0"
          )}
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Change Password</span>}
        </button>
        <button
          onClick={onSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm text-red-400 transition-colors hover:bg-red-500/10",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   LOGIN SCREEN
   ========================================================= */
function LoginScreen({
  onSuccess,
  onBack,
}: {
  onSuccess: (token: string, user: { name: string; email: string; role: string }) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("admin@blackorchid.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{ token: string; user: { name: string; email: string; role: string } }>(
        "/api/admin/login",
        { email, password }
      );
      onSuccess(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="admin-surface-elevated p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-admin-gold/40 bg-admin-gold/10 text-admin-gold">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-admin-text">
              Admin Access
            </h1>
            <p className="mt-2 font-[family-name:var(--font-cormorant)] text-lg italic text-admin-muted">
              Sign in to manage Black Orchid
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <AdminInput
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="you@blackorchid.com"
            />
            <AdminInput
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              error={error || undefined}
            />
            <AdminButton type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </AdminButton>
          </form>

          <div className="mt-5 rounded-xl border border-admin-gold/15 bg-admin-gold/[0.04] p-3 text-center">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-admin-gold/80">
              Demo Credentials
            </p>
            <p className="mt-1 font-sans text-xs text-admin-muted">admin@blackorchid.com · admin123</p>
          </div>

          <AdminButton variant="ghost" onClick={onBack} className="mt-4 w-full">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </AdminButton>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================
   CHANGE PASSWORD MODAL — bcrypt-hashed, validates current pw
   ========================================================= */
function ChangePasswordModal({ open, onClose, onSignOut }: { open: boolean; onClose: () => void; onSignOut: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); setError(""); };

  const handleClose = () => { reset(); onClose(); };

  const submit = async () => {
    setError("");
    if (!current || !next || !confirm) { setError("All fields are required"); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setError("New passwords do not match"); return; }
    if (current === next) { setError("New password must be different from the current password"); return; }

    setSaving(true);
    try {
      await apiPost("/api/admin/change-password", { currentPassword: current, newPassword: next });
      toast.success("Password changed successfully. Please sign in again.");
      reset();
      onClose();
      // Force re-login: the new password is now active, clear the session
      onSignOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Password"
      subtitle="Update your admin account password"
      size="sm"
      footer={
        <>
          <AdminButton variant="ghost" onClick={handleClose} disabled={saving}>Cancel</AdminButton>
          <AdminButton variant="solid" onClick={submit} disabled={saving || !current || !next || !confirm}>
            {saving ? "Updating…" : "Update Password"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <AdminInput
          label="Current Password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Enter your current password"
          autoComplete="current-password"
          icon={Lock}
        />
        <AdminInput
          label="New Password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          icon={KeyRound}
          hint="Minimum 8 characters"
        />
        <AdminInput
          label="Confirm New Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          icon={KeyRound}
        />
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-sans text-xs text-red-400">
            {error}
          </div>
        )}
        <p className="font-sans text-[11px] text-admin-muted">
          After changing your password, you will be signed out and asked to sign in again.
        </p>
      </div>
    </Modal>
  );
}
