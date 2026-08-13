import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed-inline";
import { GET as getEvents, POST as createEvent } from "@/app/api/events/route";
import { DELETE as deleteEvent } from "@/app/api/events/[id]/route";
import { signToken } from "@/lib/auth";

async function main() {
  console.log("1. Ensuring seeded...");
  await ensureSeeded();

  // Create admin token for request
  const token = signToken({ sub: "admin", email: "admin@blackorchid.com", role: "ADMIN" });
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Create Diwali event
  console.log("2. Creating Diwali Event...");
  const createReq = new Request("http://localhost:3000/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      title: "Diwali Special Feast",
      description: "Grand Diwali Celebration",
      date: "2026-11-01",
      published: true,
    }),
  });
  const createdData = await (await createEvent(createReq)).json();
  const createdId = createdData.event ? createdData.event.id : createdData.id;
  console.log("Created Event ID:", createdId);

  // 3. Query GET /api/events
  let res = await (await getEvents(new Request("http://localhost:3000/api/events"))).json();
  let found = res.some((e: any) => e.id === createdId);
  console.log("Diwali Event visible in GET /api/events:", found ? "YES ✅" : "NO ❌");

  // 4. Delete Diwali event
  console.log("4. Deleting Diwali Event via DELETE /api/events/[id]...");
  const deleteReq = new Request(`http://localhost:3000/api/events/${createdId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  await deleteEvent(deleteReq, { params: Promise.resolve({ id: createdId }) });
  console.log("Event deleted!");

  // 5. Re-run ensureSeeded() and query GET /api/events
  console.log("5. Re-running ensureSeeded() & checking GET /api/events again...");
  await ensureSeeded();
  res = await (await getEvents(new Request("http://localhost:3000/api/events"))).json();
  found = res.some((e: any) => e.id === createdId || e.title === "Diwali Special Feast");

  console.log("=== FINAL VERIFICATION ===");
  console.log("Is Diwali Event still deleted after ensureSeeded():", !found ? "YES DELETED PERMANENTLY ✅" : "NO (RE-SEEDED) ❌");

  if (!found) {
    console.log("🎉 TEST PASSED! Deletions persist permanently without re-seeding!");
  } else {
    console.error("❌ TEST FAILED!");
  }
}

main().catch(console.error);
