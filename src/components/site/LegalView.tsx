"use client";

import { motion } from "framer-motion";
import { Eyebrow, OrnamentDivider } from "./primitives";
import { RevealGroup, RevealItem, RevealText } from "./motion";

export function LegalView({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms & Conditions";
  const lastUpdated = new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* ============== CINEMATIC HEADER (no image) ============== */}
      <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden bg-background">
        <div className="ambient-orb" style={{ width: 440, height: 440, background: "rgba(212,175,55,0.10)", top: "12%", left: "8%" }} />
        <div className="ambient-orb" style={{ width: 520, height: 520, background: "rgba(212,175,55,0.06)", bottom: "0%", right: "4%", animationDelay: "-5s" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="mb-6 justify-center">Legal</Eyebrow>
          </motion.div>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[1.04] tracking-luxe text-foreground sm:text-7xl lg:text-8xl">
            <RevealText text={title} as="span" delay={0.2} className="inline-block text-gold-gradient" />
          </h1>
          <OrnamentDivider className="mt-8" />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8 }}
            className="mt-6 font-sans text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
          >
            Last updated: {lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* ============== CONTENT ============== */}
      <section className="relative bg-background pb-28 pt-12 sm:pb-36">
        <div className="ambient-orb pointer-events-none absolute top-24 right-[-10%]" style={{ width: 360, height: 360, background: "rgba(212,175,55,0.04)" }} />
        <RevealGroup className="mx-auto max-w-3xl space-y-10 px-6 sm:px-10">
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        </RevealGroup>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <RevealItem>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="border-l border-gold/20 pl-6 sm:pl-8"
      >
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-gold sm:text-3xl">{title}</h2>
        <div className="mt-4 space-y-4 font-[family-name:var(--font-cormorant)] text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {children}
        </div>
      </motion.div>
    </RevealItem>
  );
}

function PrivacyContent() {
  return (
    <>
      <Block title="1. Introduction">
        <p>Black Orchid (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to protecting the privacy of our guests and website visitors. This policy explains how we collect, use, and safeguard your personal information.</p>
      </Block>
      <Block title="2. Information We Collect">
        <p>When you make a reservation or contact us, we collect your name, phone number, email address, party size, and any special requests you provide. We may also collect anonymous analytics data about your visit.</p>
      </Block>
      <Block title="3. How We Use Your Information">
        <p>We use your information to process reservations, respond to enquiries, improve our services, and — only with your consent — send you invitations and updates about special events.</p>
      </Block>
      <Block title="4. Data Security">
        <p>We employ industry-standard security measures including encrypted password storage, secure authentication, and access controls to protect your data. Your payment details are never stored on our servers.</p>
      </Block>
      <Block title="5. Your Rights">
        <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at the email listed on our Contact page. We comply with applicable data protection regulations.</p>
      </Block>
      <Block title="6. Cookies">
        <p>Our website uses essential cookies to function properly and optional analytics cookies to understand usage. You may control cookies through your browser settings.</p>
      </Block>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <Block title="1. Reservations">
        <p>Reservation requests are subject to availability and confirmation by our team. Tables are held for 15 minutes past the reserved time. Groups of 8 or more may require a deposit.</p>
      </Block>
      <Block title="2. Cancellations">
        <p>We kindly request at least 24 hours&apos; notice for cancellations. Late cancellations or no-shows for large parties may incur a fee as communicated at the time of booking.</p>
      </Block>
      <Block title="3. Conduct">
        <p>Guests are expected to maintain a respectful demeanour. We reserve the right to refuse service to any individual whose conduct is disruptive to the experience of other patrons.</p>
      </Block>
      <Block title="4. Allergies & Dietary Needs">
        <p>While we take every precaution, our kitchen handles all major allergens. Please inform us of any allergies at the time of reservation so we may advise accordingly.</p>
      </Block>
      <Block title="5. Payments">
        <p>We accept major credit cards and select digital payment methods. A service charge may apply for large parties, and this will be clearly indicated on your bill.</p>
      </Block>
      <Block title="6. Liability">
        <p>Black Orchid is not liable for any personal belongings lost or damaged on the premises. We are not responsible for adverse reactions to food; guests dine at their own discretion.</p>
      </Block>
    </>
  );
}
