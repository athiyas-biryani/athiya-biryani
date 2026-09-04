/* Athiya's Hyderabad Biriyani — site configuration.
   Fill in the SUPABASE section to go live; leave empty to run in
   localStorage demo mode (works fully, but the dashboard is per-device).
   Everything the owner edits from the admin panel lives in the DB; these are
   the boot defaults. */

window.ATHIYA = {
  restaurant: {
    name: "Athiya's Hyderabad Biryani",
    shortName: "Athiya's Biryani",
    tagline: "Hyderabad's Own Dum Biryani",
    phone: "86866 07020",                 // display phone
    phone2: "99496 24874",                // secondary display phone
    address: "Amaravati Main Road, Lam, Andhra Pradesh 522034",
    hours: "12:00 Noon – 11:30 PM",
    logo: "assets/logo/logo.jpg",
    /* About-section gallery — photo files live in assets/photos/exterior/
       (the shop front) and assets/photos/interior/ (the counters). */
    photos: [
      { src: "assets/photos/exterior/WhatsApp Image 2026-08-16 at 11.39.02 AM.jpeg", caption: "The shop front" },
      { src: "assets/photos/exterior/WhatsApp Image 2026-08-16 at 11.39.02 AM (2).jpeg", caption: "The shop front" },
      { src: "assets/photos/exterior/WhatsApp Image 2026-08-16 at 11.39.03 AM.jpeg", caption: "The shop front" },
      { src: "assets/photos/interior/WhatsApp Image 2026-08-16 at 1.02.08 PM.jpeg", caption: "Inside the shop" },
      { src: "assets/photos/interior/WhatsApp Image 2026-08-16 at 1.02.08 PM (1).jpeg", caption: "Inside the shop" },
      { src: "assets/photos/interior/WhatsApp Image 2026-08-16 at 1.02.08 PM (3).jpeg", caption: "Inside the shop" },
      { src: "assets/photos/interior/WhatsApp Image 2026-08-16 at 1.02.08 PM (4).jpeg", caption: "Inside the shop" }
    ]
  },

  delivery: {
    pincodes: ["522034"],      // allow-list; extend freely
    blockedMessage: "Sorry, we currently deliver directly only within our local zone."
  },

  admin: {
    password: "athiya2026",    // change me — single simple PIN for /admin
    sessionDays: 7
  },

  /* ── Supabase (optional but recommended for live orders) ───────────────
     Create a free project at supabase.com, run the SQL in db/schema.sql
     (next to this repo), then paste the URL + anon public key below. */
  supabase: {
    url: "https://crkzyeqahbasdyoilfyz.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3p5ZXFhaGJhc2R5b2lsZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjI4NDAsImV4cCI6MjEwMzIzODg0MH0.9iXVBooOHEUvCL9zVBK-rF_LUdI65CCKPsNeCubB8-k"
  }
};
