// Client-side API helpers with admin token injection
"use client";

import { useApp } from "./store";

async function authHeaders(): Promise<HeadersInit> {
  const token = useApp.getState().adminToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json", ...(await authHeaders()) } });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `POST ${path} failed`);
  return data as T;
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `PATCH ${path} failed`);
  return data as T;
}

export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `PUT ${path} failed`);
  return data as T;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(path, { method: "DELETE", headers: await authHeaders() });
  if (!res.ok) throw new Error(`DELETE ${path} failed`);
}

// Upload a single File to /api/upload — returns the hosted URL.
// Stores files on disk (public/uploads/), NEVER Base64 in the DB.
export async function apiUpload(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: await authHeaders(), // NOTE: do NOT set Content-Type; browser sets boundary
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
  return (data as { url: string }).url;
}
