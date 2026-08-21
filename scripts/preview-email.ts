import fs from "fs";
import path from "path";
import { renderCustomerReservationEmail, renderManagerAlertEmail } from "../src/lib/email-templates";
import type { Reservation } from "../src/lib/types";

const mockReservation: Reservation = {
  id: "cm4bk9v7100003b6x12345678",
  name: "Arshad Rahman",
  phone: "+91 95850 18502",
  phoneNormalized: "+919585018502",
  email: "arshad@example.com",
  date: "2026-08-28",
  time: "8:30 PM",
  guests: 2,
  kids: 0,
  special: "Anniversary dinner celebration. Window booth preference if available.",
  status: "CONFIRMED",
  createdAt: new Date().toISOString(),
};

const customerEmail = renderCustomerReservationEmail(mockReservation, "https://black-orchid-lime.vercel.app");
const managerEmail = renderManagerAlertEmail(mockReservation, "https://black-orchid-lime.vercel.app");

const outDir = path.join(process.cwd(), "scratch");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, "customer-email-preview.html"), customerEmail.html);
fs.writeFileSync(path.join(outDir, "manager-email-preview.html"), managerEmail.html);

console.log("✓ Successfully generated email previews:");
console.log("  - scratch/customer-email-preview.html");
console.log("  - scratch/manager-email-preview.html");
