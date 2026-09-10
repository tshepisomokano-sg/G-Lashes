/*
  Wraps the Supabase client so the rest of the app just does:
    window.db.from('services').select(...)

  Relies on the Supabase JS UMD bundle loaded via <script> in index.html,
  which exposes a global `supabase` object with `.createClient`.
*/
(function () {
  var cfg = window.SITE_CONFIG;
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase JS library did not load. Check the CDN <script> tag in index.html.");
    return;
  }
  window.db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
})();
