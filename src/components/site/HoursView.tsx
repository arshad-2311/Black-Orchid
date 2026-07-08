"use client";

import { Clock, Calendar } from "lucide-react";
import { Eyebrow, OrnamentDivider, GoldButton } from "./primitives";
import { useApp } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export function HoursView({ settings }: { settings: SiteSettings | null }) {
  const { setView } = useApp();
  const days = [
    { day: "Monday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Tuesday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Wednesday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Thursday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Friday", hours: settings?.hoursWeekday || "11:00 AM – 11:00 PM" },
    { day: "Saturday", hours: settings?.hoursWeekend || "10:00 AM – 12:30 AM" },
    { day: "Sunday", hours: settings?.hoursWeekend || "10:00 AM – 12:30 AM" },
  ];
  const today = new Date().toLocaleDateString("en", { weekday: "long" });

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src="https://sfile.chatglm.cn/images-ppt/a886f6fa2923.webp" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Plan Your Visit</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold sm:text-7xl">
            Visiting <span className="text-gold-gradient">Hours</span>
          </h1>
          <OrnamentDivider className="mt-6" />
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
            We welcome you throughout the week. Reservations recommended for evenings and weekends.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-gold/10 bg-card/40">
            {days.map((d, i) => {
              const isToday = d.day === today;
              return (
                <div key={d.day} className={`flex items-center justify-between border-b border-gold/10 px-6 py-5 last:border-0 ${isToday ? "bg-gold/5" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gold" />
                    <span className="font-[family-name:var(--font-playfair)] text-xl text-foreground">{d.day}</span>
                    {isToday && <span className="rounded-full bg-gold-gradient px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-black">Today</span>}
                  </div>
                  <span className="flex items-center gap-2 font-[family-name:var(--font-cormorant)] text-xl text-muted-foreground">
                    <Clock className="h-4 w-4 text-gold/60" />
                    {d.hours}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-gold/20 bg-card/30 p-6 text-center">
            <p className="font-[family-name:var(--font-cormorant)] text-xl italic text-muted-foreground">
              The kitchen takes its last orders 90 minutes before closing. Walk-ins welcome subject to availability.
            </p>
            <div className="mt-5">
              <GoldButton onClick={() => setView("reservation")}>Reserve a Table</GoldButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
