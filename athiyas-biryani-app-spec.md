# Build Spec: Athiya's Hyderabad Biryani — Direct Order & Delivery System

## 1. Business Context

Athiya's Hyderabad Biryani is a local restaurant also selling through third-party delivery platforms, where a ₹150–170 item is marked up to ₹180–200+ due to platform commission and delivery/handling fees. The restaurant also gets 15–20 direct phone orders daily from customers within a 5km radius — these customers are currently served by staff manually taking the call, cooking, and having someone deliver on the restaurant's own vehicle. This is inefficient (missed calls during rush, no order tracking, manual bill-keeping, no earnings visibility).

**Goal:** Replace the phone-call intake with a simple ordering website (not a native app), paired with an owner-facing admin dashboard for order management, kitchen status, stock control, and earnings tracking — for customers within the restaurant's direct-delivery zone, continuing pay-on-delivery (no payment gateway).

## 2. What This Is NOT

- **Not a native Android/iOS app.** Build a mobile-responsive website / PWA. No app store, no install requirement.
- **Not a payment gateway integration.** No Razorpay/Stripe/PayU. Payment is collected on delivery — cash or the owner's personal UPI QR code shown at checkout/handoff.
- **Not a customer account system.** No signup, no login, no OTP, no email requirement for customers. Guest checkout only — name, phone, address, that's it.
- **Not a real-time GPS/distance-automation system.** No live geolocation or distance-API calls. Instead, the delivery zone is enforced with a **pincode allow-list** (see Section 3.1 and 8) — simple, free, and accurate enough for this use case.

## 3. User Roles

### 3.1 Customer (Guest — no account)
1. Opens the site (via WhatsApp-shared link or QR code at the counter).
2. Browses the menu by category (Biryani / Curries / Starters — see Section 5 for full item list and pricing).
3. Adds items to cart, adjusts quantity.
4. At checkout, enters: **Name, Phone Number, Delivery Address, Pincode** — nothing else. No password, no OTP, no email.
   - The pincode is checked against the restaurant's **allowed pincode list** (Section 8). If it's not on the list, checkout is blocked with a message like "Sorry, we currently deliver directly only within our local zone," and the customer is not shown as a valid order to the owner.
   - If the pincode passes, checkout proceeds normally.
5. Selects payment method: **Pay on Delivery** (cash or scan owner's UPI QR shown on screen/at delivery).
6. Places order and receives an on-screen confirmation with an **order token number** (e.g., "Order #315 — we'll call you if there's an issue").
7. Items marked "Out of Stock" by the owner (see 3.2) are shown as unavailable/greyed out and cannot be added to cart.

### 3.2 Owner (Admin — separate login, password-protected)
Owner logs in separately from the customer-facing site (e.g., `/admin` route with a simple password or PIN — no need for heavy auth infrastructure at this scale).

**Dashboard home shows (per the reference mockup):**
- **Total Orders Today** (count)
- **Total Accepted Revenue (Pay on Delivery)** — sum of all accepted orders' net amounts for today
- **Pending / In-Kitchen Queue** — count of orders awaiting accept/reject or currently cooking

**Each incoming order renders as a card showing:**
- Restaurant name/token header, Token number, time generated
- Status: `Pending` → `Accepted • Cooking in Kitchen` → `Dispatched`, or `Cancelled/Rejected by Kitchen`
- Customer name, phone, delivery address
- Itemized order (qty, item name, price)
- Net amount
- Action buttons:
  - **Accept (Send to Chef)** / **Reject** — owner decides based on distance/kitchen load
  - **Pay on Delivery — Collect ₹X** (informational, reminds staff how much cash/UPI to collect)
  - **Share Bill with Delivery Rider on WhatsApp** — sends order summary to whoever is running that delivery
  - **Print KOT** (Kitchen Order Ticket — for the kitchen to prepare from)
  - **Mark Dispatched** — moves order out of active queue once it's left for delivery
  - **Mark Paid** — owner/staff taps this after cash/UPI is collected at the door; this is what feeds the earnings dashboard

**New order alert:** When a new order comes in, the dashboard must play a **notification sound** and visually flag the order as needing action (accept/reject), so staff don't miss it during a busy kitchen — this replaces the "missed phone call" problem directly.

**Stock control:** Owner can toggle any menu item to **"Out of Stock"** with one tap. This instantly reflects on the customer-facing menu — item shows as unavailable and cannot be ordered — until the owner toggles it back.

**Earnings view:** A separate (or same-page) view showing total revenue from orders marked "Paid," filterable by **Today / This Week / This Month**, with order count alongside revenue so the owner can see both volume and income without manual tallying.

## 4. Core Workflow Summary

1. Customer orders via website → order appears on owner's dashboard with sound alert.
2. Owner checks the address mentally (is it within ~5km?) and either **Accepts** (sends to kitchen) or **Rejects** (e.g., too far — outside the direct-delivery zone).
3. Kitchen prepares (KOT can be printed for the kitchen).
4. Once ready, owner/staff hits **Share Bill with Delivery Rider on WhatsApp**, hands the parcel to whichever staff member has a free vehicle.
5. Rider delivers, collects cash/UPI payment directly (no gateway).
6. Owner marks order **Paid** and **Dispatched/Delivered** in the dashboard.
7. Revenue automatically rolls up into the daily/weekly/monthly earnings view — no manual sheet needed.

## 5. Menu Data (from restaurant's printed menu)

### Biryani
| Item | Price |
|---|---|
| Chicken Dum Biryani | ₹170 |
| Chicken Fry Biryani | ₹200 |
| Chicken Lollipop Gravy Biryani | ₹240 |
| Chicken Lollipop Fry Biryani | ₹220 |
| Chicken Joint Biryani | ₹170 |
| Chicken Wings Fry Biryani | ₹200 |
| Chicken Gravy Wings Biryani | ₹240 |
| Chicken Boneless Biryani | ₹240 |
| Biryani Rice (Plain) | ₹100 |
| Special Chicken Dum Biryani | ₹370 |
| Chicken Dum Family Pack | ₹550 |
| Chicken Dum Bucket Biryani | ₹850 |
| Biryani Half | ₹120 |

### Curries
| Item | Price |
|---|---|
| Liver Curry | ₹100 |
| Chicken Curry | ₹100 |
| Lollypop Curry | ₹150 |
| Wings Curry | ₹150 |
| Boneless Curry | ₹150 |

### Starters
| Item | Price |
|---|---|
| Chicken Leg Piece | ₹60 |
| Chicken Wings | ₹100 |
| Chicken Gare | ₹50 |
| Chicken Sticks | ₹30 |
| Chicken Pakodi | ₹120 |
| Chicken Lollipops | ₹120 |

*(Menu should be editable by the owner from the admin panel — add/remove/edit items and prices without a developer, since prices and availability will change over time.)*

## 6. Suggested Technical Approach (low-cost, low-maintenance)

- **Frontend:** Next.js (or plain responsive HTML/CSS/JS) — mobile-first, works as a PWA (installable via "Add to Home Screen," but functions as a normal website with no install requirement).
- **Backend/DB:** Supabase or Firebase (free tier is sufficient at this order volume) — stores menu items (with in-stock/out-of-stock flag), orders, and payment status.
- **Real-time updates:** Supabase/Firebase real-time subscriptions (or simple polling every few seconds) so new orders appear on the admin dashboard immediately and trigger the notification sound.
- **Notification sound:** A short audio file played via the browser when a new order document is inserted, plus a visual badge/highlight on the unaccepted order.
- **Hosting:** Vercel or Netlify free tier for the frontend.
- **Auth:** Customer side — none. Owner/admin side — a single simple password-protected route is enough at this scale; no need for a full user-management system.
- **Cost target:** Near-zero recurring cost at current order volume (15–20 orders/day); this should not require paid infrastructure until volume grows significantly.

## 7. Delivery Zone Rule: Pincode Check (522034 only)

Instead of GPS/distance calculation or manual per-order judgment, the delivery zone is enforced with a single allowed pincode:

- **Only `522034`** is accepted. Any customer whose entered pincode does not match this is blocked from placing an order — checkout shows a message like "Sorry, we currently deliver directly only within our local zone."
- This value should still be stored as an **editable setting** (not hardcoded in a way that requires a developer to change), even though it's a single value today — the owner may want to add more pincodes later once he sees real order addresses and decides to expand the zone.
- **Known trade-off (owner's informed choice):** pincode boundaries aren't perfect 5km circles — this rule may reject some customers who are genuinely close but fall in a neighboring pincode, and may accept a few who are technically far but share the 522034 code. Accepted as a simplicity trade-off for v1; revisit once real order data comes in.

## 8. Open Items for the Owner to Decide

- Exact 5km boundary reference point and how strictly to enforce it (owner's judgment call per order, at least initially).
- Who is the default delivery rider during peak hours — does this need to be assignable per order, or is it always "whoever's free"?
- Whether batching nearby orders into a single delivery run (instead of one-by-one) is worth building into v2 once order volume increases.
