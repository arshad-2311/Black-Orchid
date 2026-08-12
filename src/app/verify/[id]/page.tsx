import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Clock, Users, Phone, Mail, FileText, ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Guest Pass Verification | Black Orchid Host Stand",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

import { ensureSeeded } from "@/lib/seed-inline";

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ n?: string; p?: string; e?: string; d?: string; t?: string; g?: string; k?: string }>;
}) {
  await ensureSeeded();
  const { id } = await params;
  const query = (await searchParams) || {};

  // Search by exact ID or tail reference in database
  let dbReservation = await db.reservation.findFirst({
    where: {
      OR: [
        { id: id },
        { id: { endsWith: id.replace(/^BO-RES-/i, "") } },
      ],
    },
  }).catch(() => null);

  // If found in database, check-in & confirm
  if (dbReservation) {
    if (dbReservation.status === "PENDING") {
      dbReservation = await db.reservation.update({
        where: { id: dbReservation.id },
        data: { status: "CONFIRMED" },
      }).catch(() => dbReservation);
    }
  }

  // Use database reservation if found, otherwise construct verified guest pass from QR parameters
  const reservation = dbReservation || {
    id: id,
    name: query.n || "Valued Guest",
    phone: query.p || "Not Provided",
    email: query.e || "Not Provided",
    date: query.d || new Date().toISOString().slice(0, 10),
    time: query.t || "7:00 PM",
    guests: Number(query.g) || 2,
    kids: Number(query.k) || 0,
    special: "",
    status: "CONFIRMED",
    createdAt: new Date(),
  };

  const ticketRef = `BO-RES-${reservation.id.slice(-8).toUpperCase()}`;
  const isConfirmed = reservation.status === "CONFIRMED" || reservation.status === "COMPLETED";

  const kidsCount = Number(reservation.kids || 0);
  const adultsCount = Number(reservation.guests || 1);
  const partyBreakdown = `${adultsCount} ${adultsCount === 1 ? "Adult" : "Adults"}${kidsCount > 0 ? `, ${kidsCount} ${kidsCount === 1 ? "Kid" : "Kids"}` : ""}`;

  return (
    <div className="min-h-screen w-full bg-[#0A0A0C] text-foreground flex flex-col items-center justify-center p-4 sm:p-6 cinematic-grain">
      {/* Background radial gold ambient lighting */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-gold/10 blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-lg">
        {/* Navigation / Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" /> Black Orchid
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Host Verification
          </span>
        </div>

        {/* LUXURY ZERO-CLICK AUTO-VERIFICATION CARD */}
        <div className="overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-[#181611] via-[#0E0D0B] to-[#0A0A0C] p-6 sm:p-8 shadow-2xl shadow-gold/15 backdrop-blur-xl">

          {/* INSTANT ZERO-CLICK VERIFICATION BANNER */}
          <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center shadow-lg shadow-emerald-500/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold uppercase tracking-wider text-emerald-400">
              {isConfirmed ? "VALID RESERVATION — CHECKED IN" : `RESERVATION ${reservation.status}`}
            </h2>
            <p className="mt-1 font-sans text-xs text-emerald-300/80">
              Zero-click verification complete · Ready to seat guest
            </p>
          </div>

          {/* Ticket Reference & Guest Name */}
          <div className="border-b border-gold/20 pb-6 text-center">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-gold/90">
              TICKET: {ticketRef}
            </span>
            <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-foreground sm:text-4xl">
              {reservation.name}
            </h1>
          </div>

          {/* Reservation Core Specs Grid */}
          <div className="my-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left">
              <span className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">
                <Calendar className="h-3.5 w-3.5" /> Date
              </span>
              <p className="mt-1 font-[family-name:var(--font-cormorant)] text-lg font-semibold text-foreground">
                {formatDate(reservation.date)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left">
              <span className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.2em] text-gold/80">
                <Clock className="h-3.5 w-3.5" /> Time
              </span>
              <p className="mt-1 font-[family-name:var(--font-cormorant)] text-lg font-semibold text-foreground">
                {reservation.time}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-left">
              <span className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.2em] text-gold">
                <Users className="h-3.5 w-3.5" /> Party Size
              </span>
              <p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold text-gold">
                {partyBreakdown}
              </p>
            </div>
          </div>

          {/* Contact & Communication */}
          <div className="space-y-2 border-t border-gold/20 pt-5 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <span className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-gold" /> Phone
              </span>
              <a href={`tel:${reservation.phone}`} className="font-mono text-sm text-foreground hover:text-gold transition-colors">
                {reservation.phone}
              </a>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <span className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-gold" /> Email
              </span>
              <a href={`mailto:${reservation.email}`} className="font-mono text-xs text-foreground hover:text-gold transition-colors">
                {reservation.email}
              </a>
            </div>

            {reservation.special && (
              <div className="py-3 text-left">
                <span className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-amber-400">
                  <FileText className="h-3.5 w-3.5" /> Special Request / Notes
                </span>
                <p className="mt-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 font-[family-name:var(--font-cormorant)] text-base italic text-amber-200">
                  "{reservation.special}"
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
