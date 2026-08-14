// Client-side API helpers with admin token injection & resilient client sync
"use client";

import { useApp } from "./store";
import {
  reconcileEvents,
  recordDeletedEvent,
  recordCreatedEvent,
  recordUpdatedEvent,
  recordDeletedItem,
  reconcileItems,
} from "./sync";
import type { EventItem } from "./types";

async function authHeaders(): Promise<HeadersInit> {
  const token = useApp.getState().adminToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleAuthError(status: number) {
  if (status === 401) {
    useApp.getState().clearAdmin();
  }
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      ...(await authHeaders()),
    },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    handleAuthError(res.status);
    throw new Error(`GET ${path} failed`);
  }
  const data = await res.json();

  // Automatic client reconciliation
  if (path.startsWith("/api/events")) {
    return reconcileEvents(data as EventItem[]) as unknown as T;
  }
  if (path.startsWith("/api/menu")) {
    return reconcileItems("menu", data) as unknown as T;
  }
  if (path.startsWith("/api/gallery")) {
    return reconcileItems("gallery", data) as unknown as T;
  }
  if (path.startsWith("/api/catering")) {
    return reconcileItems("catering", data) as unknown as T;
  }
  if (path.startsWith("/api/testimonials")) {
    return reconcileItems("testimonials", data) as unknown as T;
  }

  return data as T;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleAuthError(res.status);
    throw new Error((data as { error?: string }).error || `POST ${path} failed`);
  }

  // Record creation in sync registry
  if (path.startsWith("/api/events")) {
    const createdEvent = (data as { event?: EventItem; id?: string }).event || (data as EventItem);
    if (createdEvent && createdEvent.id) {
      recordCreatedEvent(createdEvent);
    }
  }

  return data as T;
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleAuthError(res.status);
    throw new Error((data as { error?: string }).error || `PATCH ${path} failed`);
  }

  // Record update in sync registry
  if (path.startsWith("/api/events/")) {
    const id = path.split("/").pop();
    if (id) {
      recordUpdatedEvent(id, body as Partial<EventItem>);
    }
  }

  return data as T;
}

export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleAuthError(res.status);
    throw new Error((data as { error?: string }).error || `PUT ${path} failed`);
  }
  return data as T;
}

export async function apiDelete(path: string): Promise<void> {
  // Extract ID and type for sync tracking
  if (path.startsWith("/api/events/")) {
    const id = path.split("/").pop();
    if (id) recordDeletedEvent(id);
  } else if (path.startsWith("/api/menu/")) {
    const id = path.split("/").pop();
    if (id) recordDeletedItem("menu", id);
  } else if (path.startsWith("/api/gallery/")) {
    const id = path.split("/").pop();
    if (id) recordDeletedItem("gallery", id);
  } else if (path.startsWith("/api/catering/")) {
    const id = path.split("/").pop();
    if (id) recordDeletedItem("catering", id);
  } else if (path.startsWith("/api/testimonials/")) {
    const id = path.split("/").pop();
    if (id) recordDeletedItem("testimonials", id);
  }

  const res = await fetch(path, {
    method: "DELETE",
    headers: await authHeaders(),
    credentials: "include",
  });
  if (!res.ok) {
    handleAuthError(res.status);
    throw new Error(`DELETE ${path} failed`);
  }
}

// Upload a single File to /api/upload — returns the hosted URL.
// Stores files on disk (public/uploads/), NEVER Base64 in the DB.
export async function apiUpload(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: await authHeaders(), // NOTE: do NOT set Content-Type; browser sets boundary
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleAuthError(res.status);
    if (res.status === 401) {
      throw new Error("Admin session expired. Please log in to admin panel again to upload images.");
    }
    throw new Error((data as { error?: string }).error || "Upload failed");
  }
  return (data as { url: string }).url;
}
