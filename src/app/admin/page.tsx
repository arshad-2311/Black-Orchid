"use client";

import { useEffect } from "react";
import { AdminApp } from "@/components/admin/AdminApp";
import { hydrateAdmin } from "@/lib/store";
import { ScrollProgress } from "@/components/site/Chrome";

export default function AdminPage() {
  // Restore admin session from localStorage on this dedicated route
  useEffect(() => {
    hydrateAdmin();
  }, []);

  return (
    <>
      <ScrollProgress />
      <AdminApp />
    </>
  );
}
