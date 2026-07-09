"use client";

import { create } from "zustand";

export type ViewKey =
  | "home"
  | "about"
  | "menu"
  | "banquet"
  | "gallery"
  | "catering"
  | "contact"
  | "hours"
  | "reservation"
  | "privacy"
  | "terms"
  | "admin";

type State = {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  // admin auth (client-side gating only; real protection is on API)
  adminUser: { name: string; email: string; role: string } | null;
  adminToken: string | null;
  setAdmin: (token: string, user: { name: string; email: string; role: string }) => void;
  clearAdmin: () => void;
};

export const useApp = create<State>((set) => ({
  view: "home",
  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
      // sync hash for shareability without extra routes
      history.replaceState(null, "", v === "home" ? "#" : `#${v}`);
    }
  },
  adminUser: null,
  adminToken: null,
  setAdmin: (token, user) => {
    set({ adminToken: token, adminUser: user });
    if (typeof window !== "undefined") {
      localStorage.setItem("bo_admin_token", token);
      localStorage.setItem("bo_admin_user", JSON.stringify(user));
    }
  },
  clearAdmin: () => {
    set({ adminToken: null, adminUser: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem("bo_admin_token");
      localStorage.removeItem("bo_admin_user");
    }
  },
}));

// Hydrate admin from localStorage on first load (call once in a client component)
export function hydrateAdmin() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("bo_admin_token");
  const userRaw = localStorage.getItem("bo_admin_user");
  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw);
      useApp.setState({ adminToken: token, adminUser: user });
    } catch {
      /* noop */
    }
  }
  // hydrate view from hash
  const valid: ViewKey[] = [
    "home","about","menu","banquet","gallery","catering","contact","hours","reservation","privacy","terms","admin",
  ];
  const applyHash = () => {
    const h = window.location.hash.replace("#", "");
    if (valid.includes(h as ViewKey)) {
      useApp.setState({ view: h as ViewKey });
    }
  };
  applyHash();
  // Listen for hashchange so direct URL navigation with #hash works
  window.addEventListener("hashchange", applyHash);
}
