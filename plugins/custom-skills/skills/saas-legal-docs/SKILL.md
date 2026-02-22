---
name: saas-legal-docs
description: Use when writing, reviewing, or structuring Terms of Service, Privacy Policies, or Data Processing Agreements for SaaS applications. Applies especially when the app has subscription billing, payment processing (Stripe/etc), B2B customers, or GDPR/CCPA/PIPEDA compliance requirements. Also triggered by Canada, Quebec Law 25, CASL, or cross-border North American SaaS legal questions.
---

# SaaS Legal Docs

## Overview

Three documents are almost always required for a B2B SaaS with payments: **Terms of Service (ToS)**, **Privacy Policy (PP)**, and a **Data Processing Agreement (DPA)**. Each has a distinct legal function. Publish all three before collecting PII or charging money.

---

## Document 1: Terms of Service

### Required Clauses

| Clause | What to cover |
|--------|---------------|
| **Service description** | Exactly what is provided, access method (web/API/mobile), uptime SLA |
| **Subscription & billing** | Billing cycle (monthly/annual), price, currency, when charged |
| **Auto-renewal** | Must be explicit — state the renewal date notice window (e.g., 30 days) |
| **Payment failure** | Grace period before suspension, retry policy |
| **Refund policy** | State clearly: no refunds / pro-rated / case-by-case |
| **Price changes** | How much notice you'll give (30 days minimum is standard) |
| **Cancellation** | How to cancel, what happens to data after cancellation |
| **Acceptable use** | What users cannot do (abuse, scraping, resale, illegal use) |
| **IP rights** | You own the platform; customer owns their data |
| **Limitation of liability** | Cap liability at fees paid in last 12 months (standard B2B) |
| **Indemnification** | Customer indemnifies you for their misuse |
| **Termination** | Conditions for termination by either party, notice period |
| **Governing law** | Jurisdiction (your state/country) |
| **Dispute resolution** | Arbitration or courts; class action waiver |

### B2B-Specific Notes

- **Enterprise customers will redline your ToS** — write it knowing it will be negotiated
- **Limitation of liability** is the most negotiated clause in B2B; set it realistically
- **SOC 2 Type II** is increasingly required by enterprise buyers before signing — mention your compliance posture if you have it
- Keep ToS **under 400 lines** — overly long documents slow sales cycles (per @ValourApp who cut 550→301 lines)
- Align your service description **word-for-word with your Stripe business description** — Stripe monitors accounts and flags mismatches

---

## Document 2: Privacy Policy

### Required Sections

| Section | What to cover |
|---------|---------------|
| **Data collected** | List every category: account info, usage data, payment data, cookies |
| **Legal basis (GDPR)** | Contract performance, legitimate interest, or consent — state which applies to each data type |
| **How data is used** | Billing, product improvement, support, marketing (opt-in only) |
| **Third-party processors** | List every processor with name + purpose (see Stripe section below) |
| **Data retention** | How long you keep data after account deletion |
| **Data subject rights** | Access, deletion, portability, rectification — required response: 30 days |
| **International transfers** | If EU data crosses to US: EU-US DPF, SCCs, or both |
| **Cookie policy** | Types of cookies, opt-out mechanism |
| **Children** | State app is not directed at children under 13 (or 16 in EU) |
| **Changes** | How you'll notify users of policy changes |
| **Contact** | DPO email or privacy contact |

### B2B-Specific Notes

- **B2B contacts are personal data under GDPR** — names, emails, job titles of your customers' employees require a legal basis to process, same as consumer data
- **CCPA applies to you if** you're a for-profit CA business OR process data of CA residents at scale — as of 2026, two dozen US states have similar laws
- **Data minimization is your best protection** — with Stripe, only store `email`, `subscription_id`, `start_date`. Never store raw card data. Stripe payment tokens ≠ PII protection for everything else you collect.

### Stripe Subprocessor Disclosure (Required)

Include a subprocessor table:

```
| Processor | Purpose | Data shared | Location |
|-----------|---------|-------------|----------|
| Stripe, Inc. | Payment processing | Name, email, billing address, transaction history | USA |
| [other processors] | ... | ... | ... |
```

Stripe processes more than card data — it also receives billing address, email, and full transaction history. Disclose this explicitly.

---

## Document 3: Data Processing Agreement (DPA)

Required when your B2B customers are subject to GDPR and you process personal data on their behalf. Enterprise customers **will ask for this** during procurement.

### GDPR Article 28 — 9 Mandatory Elements

1. Process data only on customer's documented instructions
2. Ensure staff processing data are bound by confidentiality
3. Implement appropriate technical and organizational security measures
4. Respect conditions for engaging subprocessors (get customer approval or provide a subprocessor list)
5. Assist customer in responding to data subject requests
6. Assist customer with security obligations (Art. 32–36)
7. Delete or return data at end of service
8. Provide all information necessary to demonstrate compliance
9. Allow audits (at customer's cost, with reasonable notice)

Missing any single element = the DPA is non-compliant and will be rejected in enterprise procurement.

---

## Payment Processing Compliance

### PCI-DSS

You are responsible for PCI-DSS compliance if you store, process, or transmit cardholder data. Avoid this entirely by using Stripe.js / Stripe Elements — card data never touches your server. Your ToS should state: "Payment processing is handled by Stripe, Inc. We do not store credit card information."

### Stripe Account Tips

- Your business description on Stripe must **exactly match** what you sell — vague descriptions trigger manual review
- Stripe monitors ongoing account activity against your stated business type
- Mention your Stripe relationship in ToS: "Payments processed by Stripe, Inc. By making a payment, you agree to Stripe's Terms of Service."

---

## Canadian Compliance (PIPEDA, Quebec Law 25, CASL)

### PIPEDA — Federal Baseline

Canada's federal private sector privacy law applies to any commercial activity that collects, uses, or discloses personal data across provincial or international borders. It's built on **10 Fair Information Principles** (consent, purpose limitation, retention limits, accuracy, safeguards, openness, access, challenging compliance). For B2B SaaS, your Privacy Policy must reflect these principles. PIPEDA is less prescriptive than GDPR but the fundamentals overlap significantly.

Key differences from GDPR:
- No mandatory DPA required by law (but enterprise customers may still request one)
- Breach notification required to the OPC (Office of the Privacy Commissioner) if there's "real risk of significant harm"
- No concept of "legal basis" like GDPR — **meaningful consent** is the primary mechanism

### Quebec Law 25 — The Canadian GDPR

If you have any Quebec-based customers or employees, Law 25 (fully in force since Sept 2023) applies. It is the most rigorous Canadian privacy law and closely mirrors GDPR:

| Requirement | What it means |
|-------------|---------------|
| **Privacy Officer** | Must designate someone responsible for privacy (name published on website) |
| **Privacy Impact Assessment (PIA)** | Required before any new system that processes personal data |
| **Consent** | Must be clear, specific, and separate — no bundled consent |
| **Right to data portability** | Users can request their data in a structured format |
| **Right to de-indexing** | Right to removal from search results / indexes |
| **Data minimization** | Only collect what's strictly necessary |
| **Incident response** | Notify the Commission d'accès à l'information (CAI) within 72 hours of a breach |
| **Cross-border transfers** | Privacy Impact Assessment required before sending Quebec resident data outside Quebec |
| **Automated decisions** | Disclose if your app makes automated decisions affecting individuals |

**Practical for B2B SaaS:** Your Privacy Policy needs a Quebec-specific section or addendum if you have Quebec customers or users.

### CASL — Commercial Electronic Messages

Canada's Anti-Spam Legislation applies to any **commercial electronic message** (CEM) sent to or from Canada. This affects your onboarding emails, billing notices, marketing, and even in-app messages if they promote your service.

| Message type | Consent required |
|-------------|-----------------|
| **Transactional** (receipts, password resets, service alerts) | No consent needed — exempt |
| **Marketing** (promotions, upsells, newsletters) | **Express consent** required — checked box at signup, not pre-ticked |
| **Relationship messages** (account updates, feature announcements) | **Implied consent** if they're a paying customer within 2 years |

Required in every marketing CEM:
1. Sender identity (your company name and address)
2. Unsubscribe mechanism (must process within 10 business days)
3. Physical mailing address

**CASL fines are severe** — up to $10M CAD per violation for corporations.

### Governing Law for Canadian Companies

- Set governing law to your **province** (e.g., "Province of Ontario" or "Province of British Columbia")
- **Class action waivers** are not reliably enforceable in Canada — don't rely on them
- Arbitration clauses work but must be carefully drafted under the applicable provincial Arbitration Act
- For B2B customers in Quebec, certain consumer-protective clauses in the Civil Code of Quebec may override your ToS (even in B2B contexts where one party is a smaller business)

---

## Compliance Calendar (2026)

| Regulation | Effective | Who it affects |
|------------|-----------|----------------|
| **PIPEDA** | Ongoing | Any Canadian commercial activity crossing provincial/international borders |
| **Quebec Law 25** | Sept 2023 (fully) | Any org with Quebec residents' data |
| **CASL** | Ongoing | Any CEM sent to/from Canada |
| Indiana, Kentucky, Rhode Island privacy laws | Jan 2026 | US SaaS with residents of those states |
| Connecticut, Oregon, Utah, Virginia amendments | Jan 2026 | US SaaS broadly |
| CA data broker automated deletion (CCPA) | Aug 2026 | CA-registered data brokers |
| GDPR (ongoing) | Always | Any EU personal data |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Launching before ToS/PP exist | Publish before first paid user or PII collection |
| Not listing Stripe as subprocessor | Add explicit subprocessor table to Privacy Policy |
| Storing raw card data | Use Stripe.js — never let card data touch your server |
| Using consumer-grade templates for B2B | B2B needs: limitation of liability, indemnification, DPA |
| Auto-renewal buried in fine print | Courts increasingly invalidate buried renewal terms — make it prominent |
| Illegal clauses in ToS | Clicking "agree" doesn't make illegal clauses enforceable — don't include what you can't legally enforce |
| No DPA for enterprise customers | Enterprise will block deals without GDPR Article 28-compliant DPA |
| Single policy for all jurisdictions | 2026: multi-state US + GDPR require differentiated approach or broad addendums |

---

## Quick Reference: Minimum Viable Legal Stack

**Pre-launch checklist:**
- [ ] Terms of Service published and linked in footer
- [ ] Privacy Policy published and linked in footer
- [ ] Cookie consent banner (if EU users)
- [ ] Stripe listed as subprocessor in Privacy Policy
- [ ] ToS references Stripe's terms for payment
- [ ] Auto-renewal explicitly stated in ToS
- [ ] Refund policy explicitly stated in ToS
- [ ] Data deletion process documented (for GDPR/CCPA/PIPEDA right to erasure)
- [ ] DPA template ready for enterprise customers
- [ ] **Canada:** Governing law set to your province (not a US state)
- [ ] **Canada:** Privacy Officer designated and name published (Quebec Law 25)
- [ ] **Canada:** Marketing emails use express consent (CASL) — no pre-ticked boxes
- [ ] **Canada:** Unsubscribe mechanism in all marketing emails (10-day processing window)
- [ ] **Canada:** Quebec addendum if serving Quebec customers

**Tools to draft (use as starting points, always review with counsel):**
- Termly, iubenda, Termsfeed — template generators
- Stripe's own DPA template (available in Stripe Dashboard) — use for your Stripe subprocessor clause
- AI prompt approach: "You are an internet law and privacy attorney. I need legally compliant Terms of Service and Privacy Policy for a B2B SaaS app with [describe your app], subscription billing via Stripe, serving customers in [jurisdictions]."

> **Note:** This skill provides structural guidance, not legal advice. For enforceable documents, have a qualified attorney review the final output, especially DPAs and limitation of liability clauses.
