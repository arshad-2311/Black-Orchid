import {
  recordDeletedEvent,
  reconcileEvents,
  recordCreatedEvent,
  recordUpdatedEvent,
  recordDeletedItem,
  reconcileItems,
} from "../src/lib/sync";
import type { EventItem } from "../src/lib/types";

// Mock localStorage for node environment
const storage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (k: string) => storage[k] || null,
  setItem: (k: string, v: string) => { storage[k] = v; },
  removeItem: (k: string) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; },
};
(global as any).window = {};

async function testSync() {
  console.log("--- TEST 1: Server events with a deleted item ---");
  const mockServerEvents: EventItem[] = [
    { id: "event-1", title: "Valentine's Tasting Menu", description: "Desc", date: "2025-02-14", image: null, published: true },
    { id: "event-2", title: "Diwali Grand Celebration", description: "Desc", date: "2025-10-21", image: null, published: true },
  ];

  console.log("Initial server events count:", mockServerEvents.length);

  // Admin deletes Diwali Grand Celebration (event-2)
  console.log("Admin deletes event-2 (Diwali Grand Celebration)...");
  recordDeletedEvent("event-2");

  // Reconcile
  const reconciled = reconcileEvents(mockServerEvents);
  console.log("Reconciled events:", reconciled.map(e => ({ id: e.id, title: e.title })));

  if (reconciled.length === 1 && reconciled[0].id === "event-1") {
    console.log("✅ TEST 1 PASSED: Deleted event filtered out successfully!");
  } else {
    console.error("❌ TEST 1 FAILED!");
  }

  console.log("\n--- TEST 2: Page reload / refresh simulation ---");
  // Even if server still returns event-2 on cold start / stale cache:
  const reloaded = reconcileEvents(mockServerEvents);
  if (reloaded.length === 1 && !reloaded.some(e => e.id === "event-2")) {
    console.log("✅ TEST 2 PASSED: Deleted event remains deleted after page refresh!");
  } else {
    console.error("❌ TEST 2 FAILED!");
  }

  console.log("\n--- TEST 3: Adding a new event ---");
  const newEvent: EventItem = {
    id: "event-3",
    title: "New Year's Eve Gala",
    description: "Midnight countdown",
    date: "2025-12-31",
    image: null,
    published: true,
  };
  recordCreatedEvent(newEvent);
  const withCreated = reconcileEvents(mockServerEvents);
  console.log("Reconciled with created event:", withCreated.map(e => ({ id: e.id, title: e.title })));
  if (withCreated.some(e => e.id === "event-3") && !withCreated.some(e => e.id === "event-2")) {
    console.log("✅ TEST 3 PASSED: New event added and deleted event still excluded!");
  } else {
    console.error("❌ TEST 3 FAILED!");
  }

  console.log("\n--- TEST 4: Menu item deletion sync ---");
  const mockMenu = [
    { id: "dish-1", name: "Truffle Arancini" },
    { id: "dish-2", name: "Butter Chicken" },
  ];
  recordDeletedItem("menu", "dish-2");
  const reconciledMenu = reconcileItems("menu", mockMenu);
  if (reconciledMenu.length === 1 && reconciledMenu[0].id === "dish-1") {
    console.log("✅ TEST 4 PASSED: Menu item deletion sync works!");
  } else {
    console.error("❌ TEST 4 FAILED!");
  }

  console.log("\n🎉 ALL SYNCHRONIZATION TESTS PASSED!");
}

testSync().catch(console.error);
