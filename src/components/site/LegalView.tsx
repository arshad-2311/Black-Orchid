"use client";

import { Eyebrow, OrnamentDivider } from "./primitives";

export function LegalView({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";
  return (
    <div className="pt-28">
      <section className="py-16 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <Eyebrow className="mb-5">Legal</Eyebrow>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold sm:text-6xl">
            {isPrivacy ? "Privacy Policy" : "Terms & Conditions"}
          </h1>
          <OrnamentDivider className="mt-6" />
          <p className="mt-4 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        </div>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-gold">{title}</h2>
      <div className="mt-3 space-y-3 font-[family-name:var(--font-cormorant)] text-lg leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <Block title="1. Introduction">
        <p>Black Orchid ("we", "us") is committed to protecting the privacy of our guests and website visitors. This policy explains how we collect, use, and safeguard your personal information.</p>
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
        <p>We kindly request at least 24 hours' notice for cancellations. Late cancellations or no-shows for large parties may incur a fee as communicated at the time of booking.</p>
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
