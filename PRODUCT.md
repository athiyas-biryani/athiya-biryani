# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS + Supabase (free tier). Mobile-first site with no build step, backed by Supabase for orders, real-time admin dashboard with sound alerts, editable menu and stock.

## Users

Primary: the owner and staff of Athiya's Hyderabad Biryani, managing incoming direct-delivery orders from a dashboard during kitchen rush.
Secondary: local customers (guests, no accounts) who order for direct delivery within pincode 522034, paying on delivery.

## Product Purpose

Replace the restaurant's phone-call order intake with a simple ordering website plus an owner-facing admin dashboard for order management, kitchen status, stock control, and earnings tracking — for customers within the restaurant's direct-delivery zone, continuing pay-on-delivery with no payment gateway.

## Positioning

Gives the restaurant a direct ordering channel that bypasses third-party delivery platform commissions (a ₹150–170 item marked up to ₹180–200+) for its own delivery zone, with no payment-gateway fees and no customer account friction.

## Operating Context

- 15–20 direct phone orders daily from customers within roughly a 5km radius; staff today take calls, cook, and deliver on the restaurant's own vehicle.
- Pain points being solved: missed calls during rush, no order tracking, manual bill-keeping, no earnings visibility.
- Customer reaches the site via a WhatsApp-shared link or QR code at the counter; orders on a phone.
- Owner works at the restaurant; kitchen prepares from a printed KOT; the delivery rider collects cash or the owner's personal UPI QR at the door.
- Delivery zone is enforced by a pincode allow-list (522034 only today), not GPS/distance automation.

## Capabilities and Constraints

- Customer side: browse menu by category, cart with quantity adjustment, guest checkout (Name, Phone, Delivery Address, Pincode only), pincode checked against the allowed list (blocked with a local-zone message when not listed), Pay on Delivery (cash or owner's UPI QR), on-screen order confirmation with token number, out-of-stock items greyed out and unorderable.
- Owner side: password-protected `/admin`; dashboard showing Total Orders Today, Total Accepted Revenue (Pay on Delivery), and Pending/In-Kitchen queue; order cards with status lifecycle (Pending → Accepted/Cooking → Dispatched, or Cancelled/Rejected) and itemized details; actions to Accept/Reject, view amount to collect, Share Bill with Delivery Rider on WhatsApp, Print KOT, Mark Dispatched, Mark Paid; new-order notification sound plus visual flag; one-tap Out-of-Stock toggle; earnings view filterable by Today/Week/Month with order counts; editable menu (add/remove/edit items and prices).
- No native app, no customer accounts, no OTP, no email collection, no payment gateway, no real-time GPS/distance automation.
- Delivery zone pincode is an editable setting, not developer-hardcoded, so more pincodes can be added later.
- Cost target: near-zero recurring cost at current order volume; no paid infrastructure until volume grows significantly.
- Known trade-off (owner's informed choice): pincode boundaries are not perfect 5km circles — the rule may reject some close customers and accept a few far ones; acceptable for v1.

## Brand Commitments

- Name: Athiya's Hyderabad Biryani.
- Real menu and prices from the restaurant's printed menu (Biryani, Curries, Starters) — see the spec.
- Payment at delivery: cash or the owner's personal UPI QR shown at checkout/handoff.

## Evidence on Hand

- `athiyas-biryani-app-spec.md` — full build spec including menu data and pricing.
- `hotel pics/` — 11 WhatsApp photos of the restaurant (real assets).

## Product Principles

- Direct beats platform: every order through the direct channel saves commission and fees.
- Speed to serve: dashboard sound alerts replace the missed-call problem during rush.
- Zero customer friction: no accounts, no payment gateway, order in under a minute.
- Owner autonomy: menu, stock, delivery zone, and order status all owner-controllable without a developer.
- Simplicity over automation: pincode allow-list over GPS/distance logic.

## Accessibility & Inclusion

- Mobile-first: customers order from phones and the owner checks the dashboard during a busy kitchen.
- Large tap targets and clear status/action buttons for rush-hour use; new-order alert is audible as well as visual.
