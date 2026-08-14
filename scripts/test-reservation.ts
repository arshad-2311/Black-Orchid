import { db } from "../src/lib/db";
import { POST as createReservation, GET as getReservations } from "../src/app/api/reservations/route";
import { signToken } from "../src/lib/auth";

async function testReservation() {
  console.log("--- Testing Reservation in Supabase ---");

  // 1. Create Reservation
  const payload = {
    name: "John Test Guest",
    phone: "+91 98765 43210",
    email: "guest@example.com",
    date: "2026-12-25",
    time: "07:30 PM",
    guests: 4,
    kids: 1,
    special: "Window booth requested",
  };

  const req = new Request("http://localhost:3000/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const res = await (await createReservation(req)).json();
  console.log("Created Reservation in Supabase:", res.id, res.name, res.status);

  // 2. Query directly from Supabase via Prisma
  const dbRecord = await db.reservation.findUnique({ where: { id: res.id } });
  console.log("Direct Supabase DB Query result:", dbRecord?.id, dbRecord?.name, dbRecord?.guests);

  if (dbRecord && dbRecord.id === res.id) {
    console.log("✅ Reservation created and verified in Supabase PostgreSQL!");
  } else {
    console.error("❌ Reservation verification failed!");
  }

  // 3. Clean up test record
  await db.reservation.delete({ where: { id: res.id } });
  console.log("Test reservation cleaned up.");
}

testReservation().catch(console.error);
