/*
  Loads every /sections/*.html partial into its placeholder <div>, in order,
  then starts the booking widget once the booking section actually exists
  in the DOM.

  Note: this uses fetch() to load local files, so the site must be served
  over http/https (e.g. `python3 -m http.server`, GitHub Pages, Netlify,
  Cloudflare Pages) rather than opened directly as a file:// URL, or the
  browser will block the requests.
*/
(function () {
  var sections = [
    { id: "header-root", file: "sections/header.html" },
    { id: "hero-root", file: "sections/hero.html" },
    { id: "services-root", file: "sections/services.html" },
    { id: "studio-root", file: "sections/studio.html" },
    { id: "booking-root", file: "sections/booking.html" },
    { id: "contact-root", file: "sections/contact.html" },
    { id: "footer-root", file: "sections/footer.html" },
  ];

  function loadSection(section) {
    var el = document.getElementById(section.id);
    if (!el) return Promise.resolve();
    return fetch(section.file)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + section.file);
        return res.text();
      })
      .then(function (html) {
        el.outerHTML = html;
      })
      .catch(function (err) {
        console.error(err);
        el.innerHTML =
          '<p style="padding:2rem;text-align:center;color:#b45309;">Could not load this section (' +
          section.file +
          "). If you're opening this file directly, run a local server instead — see README.md.</p>";
      });
  }

  // Load sections one after another so they render top-to-bottom in order.
  sections
    .reduce(function (chain, section) {
      return chain.then(function () {
        return loadSection(section);
      });
    }, Promise.resolve())
    .then(function () {
      if (typeof window.initBooking === "function") {
        window.initBooking();
      }
    });
})();
