"use client";

import type { EventItem, MenuItem, GalleryImage, CateringPackage, Testimonial } from "./types";

const DELETED_EVENTS_KEY = "bo_sync_deleted_events";
const CUSTOM_EVENTS_KEY = "bo_sync_custom_events";
const UPDATED_EVENTS_KEY = "bo_sync_updated_events";

const DELETED_MENU_KEY = "bo_sync_deleted_menu";
const DELETED_GALLERY_KEY = "bo_sync_deleted_gallery";
const DELETED_CATERING_KEY = "bo_sync_deleted_catering";
const DELETED_TESTIMONIALS_KEY = "bo_sync_deleted_testimonials";

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/* ==================== EVENTS SYNC ==================== */

export function recordDeletedEvent(id: string): void {
  const deleted = getStorage<string[]>(DELETED_EVENTS_KEY, []);
  if (!deleted.includes(id)) {
    deleted.push(id);
    setStorage(DELETED_EVENTS_KEY, deleted);
  }
  const custom = getStorage<EventItem[]>(CUSTOM_EVENTS_KEY, []);
  setStorage(CUSTOM_EVENTS_KEY, custom.filter((e) => e.id !== id));
}

export function recordCreatedEvent(event: EventItem): void {
  const custom = getStorage<EventItem[]>(CUSTOM_EVENTS_KEY, []);
  const idx = custom.findIndex((e) => e.id === event.id);
  if (idx >= 0) custom[idx] = event;
  else custom.push(event);
  setStorage(CUSTOM_EVENTS_KEY, custom);

  const deleted = getStorage<string[]>(DELETED_EVENTS_KEY, []);
  setStorage(DELETED_EVENTS_KEY, deleted.filter((id) => id !== event.id));
}

export function recordUpdatedEvent(id: string, updates: Partial<EventItem>): void {
  const updatedMap = getStorage<Record<string, Partial<EventItem>>>(UPDATED_EVENTS_KEY, {});
  updatedMap[id] = { ...(updatedMap[id] || {}), ...updates };
  setStorage(UPDATED_EVENTS_KEY, updatedMap);
}

export function reconcileEvents(serverEvents: EventItem[]): EventItem[] {
  const deletedIds = new Set(getStorage<string[]>(DELETED_EVENTS_KEY, []));
  const customEvents = getStorage<EventItem[]>(CUSTOM_EVENTS_KEY, []);
  const updatedMap = getStorage<Record<string, Partial<EventItem>>>(UPDATED_EVENTS_KEY, {});

  const validServerEvents = Array.isArray(serverEvents)
    ? serverEvents.filter((e) => !deletedIds.has(e.id))
    : [];

  const mergedServerEvents = validServerEvents.map((e) => {
    if (updatedMap[e.id]) {
      return { ...e, ...updatedMap[e.id] };
    }
    return e;
  });

  const existingIds = new Set(mergedServerEvents.map((e) => e.id));
  const newCustomEvents = customEvents
    .filter((e) => !deletedIds.has(e.id) && !existingIds.has(e.id))
    .map((e) => (updatedMap[e.id] ? { ...e, ...updatedMap[e.id] } : e));

  return [...mergedServerEvents, ...newCustomEvents];
}

/* ==================== GENERAL ENTITY DELETION HELPERS ==================== */

export function recordDeletedItem(type: "menu" | "gallery" | "catering" | "testimonials", id: string): void {
  const keyMap = {
    menu: DELETED_MENU_KEY,
    gallery: DELETED_GALLERY_KEY,
    catering: DELETED_CATERING_KEY,
    testimonials: DELETED_TESTIMONIALS_KEY,
  };
  const key = keyMap[type];
  if (!key) return;
  const deleted = getStorage<string[]>(key, []);
  if (!deleted.includes(id)) {
    deleted.push(id);
    setStorage(key, deleted);
  }
}

export function reconcileItems<T extends { id: string }>(type: "menu" | "gallery" | "catering" | "testimonials", items: T[]): T[] {
  const keyMap = {
    menu: DELETED_MENU_KEY,
    gallery: DELETED_GALLERY_KEY,
    catering: DELETED_CATERING_KEY,
    testimonials: DELETED_TESTIMONIALS_KEY,
  };
  const key = keyMap[type];
  if (!key || !Array.isArray(items)) return items;
  const deletedIds = new Set(getStorage<string[]>(key, []));
  return items.filter((item) => !deletedIds.has(item.id));
}
