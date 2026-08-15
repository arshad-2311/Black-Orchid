"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppButton({
  phone = "+91 95850 18502",
  message = "Hello Black Orchid, I would like to inquire about reservations and events.",
}: {
  phone?: string;
  message?: string;
}) {
  const [hovered, setHovered] = useState(false);

  // Normalize phone number to digits only (e.g. 919585018502)
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center justify-end">
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none mr-3 hidden rounded-full border border-white/10 bg-background/90 px-4 py-2 text-xs font-medium tracking-wide text-foreground shadow-2xl backdrop-blur-md sm:block"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Chat on WhatsApp
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Manager on WhatsApp (+91 95850 18502)"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#2bf075] text-white shadow-[0_8px_30px_rgba(37,211,102,0.45)] ring-1 ring-white/30 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(37,211,102,0.7)]"
      >
        {/* Ambient pulse ring */}
        <span className="absolute -inset-1.5 rounded-full bg-[#25D366]/25 animate-ping duration-1000 -z-10" />

        {/* WhatsApp Official Vector Icon */}
        <svg
          className="h-7 w-7 fill-current drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.004 2c-5.518 0-9.998 4.476-9.998 9.993 0 1.763.459 3.486 1.332 5.001L2 22l5.143-1.312a9.96 9.96 0 0 0 4.861 1.258h.004c5.517 0 9.996-4.476 9.996-9.993 0-2.67-1.04-5.18-2.93-7.069A9.932 9.932 0 0 0 12.004 2zm0 18.286h-.003a8.27 8.27 0 0 1-4.218-1.156l-.302-.18-3.136.8 1.15-3.057-.197-.313a8.273 8.273 0 0 1-1.296-4.387c0-4.57 3.718-8.288 8.291-8.288 2.214 0 4.296.863 5.861 2.428a8.237 8.237 0 0 1 2.426 5.86c0 4.57-3.718 8.29-8.288 8.29zm4.542-6.198c-.249-.125-1.472-.727-1.7-.81-.228-.083-.394-.125-.56.125-.166.249-.644.81-.789.976-.145.166-.29.187-.539.062s-1.05-.387-2-1.234c-.739-.659-1.238-1.473-1.383-1.722-.145-.249-.015-.384.109-.508.112-.112.249-.29.373-.435.125-.145.166-.249.249-.415.083-.166.042-.311-.021-.436s-.56-1.35-.768-1.849c-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.436.062-.664.311s-.871.851-.871 2.075c0 1.224.892 2.407 1.016 2.573.125.166 1.756 2.682 4.254 3.76.594.257 1.058.41 1.42.525.597.19 1.14.163 1.569.099.479-.072 1.472-.602 1.68-1.183.207-.581.207-1.079.145-1.183-.062-.104-.228-.166-.477-.291z" />
        </svg>
      </motion.a>
    </div>
  );
}
