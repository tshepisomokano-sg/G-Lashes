/*
  Site configuration.

  SUPABASE_KEY below is the "publishable" (anon) key, not a secret key.
  It is designed to be shipped in client-side code — access to the
  `services` and `bookings` tables is controlled server-side by Row
  Level Security policies in Supabase, not by hiding this key.
  Never put a "service_role"/secret key in a file like this.
*/
window.SITE_CONFIG = {
  supabaseUrl: "https://c--e13dfdec-788e-4669-8a5f-780473e58ed8-prod.lovable.cloud",
  supabaseKey: "sb_publishable_wOrZokBAaWdpXqie5sJNAw_0FHpSIvM",

  contact: {
    phone: "0729935970",
    phoneHref: "tel:+27729935970",
    whatsapp: "https://wa.me/27729935970",
    email: "glashesnbrows@gmail.com",
  },

  // Studio is open 07:00 up to (not including) 17:00 — hourly slots.
  openingHour: 7,
  closingHour: 17,
};
