/*
  Wires up the #book section: calendar -> time slots -> service picker -> form -> Supabase insert.
  Call window.initBooking() once the booking.html partial is in the DOM.
*/
window.initBooking = function initBooking() {
  var cfg = window.SITE_CONFIG;
  var db = window.db;

  var SLOT_TIMES = [];
  for (var h = cfg.openingHour; h < cfg.closingHour; h++) {
    SLOT_TIMES.push(String(h).padStart(2, "0") + ":00");
  }

  function formatSlot(time) {
    var hour = Number(time.split(":")[0]);
    var suffix = hour >= 12 ? "pm" : "am";
    var display = hour % 12 === 0 ? 12 : hour % 12;
    return display + ":00 " + suffix;
  }

  function normaliseTime(value) {
    return String(value).slice(0, 5);
  }

  // ---- DOM refs ----
  var calendarEl = document.getElementById("calendar");
  var slotGridEl = document.getElementById("slot-grid");
  var servicePickerEl = document.getElementById("service-picker");
  var formEl = document.getElementById("booking-form");
  var formWrapEl = document.getElementById("booking-form-wrap");
  var confirmationEl = document.getElementById("booking-confirmation");
  var confirmationDetailsEl = document.getElementById("confirmation-details");
  var summaryEl = document.getElementById("booking-summary");
  var submitBtn = document.getElementById("booking-submit");
  var bookAnotherBtn = document.getElementById("book-another");
  var nameInput = document.getElementById("client-name");
  var phoneInput = document.getElementById("client-phone");
  var emailInput = document.getElementById("client-email");
  var notesInput = document.getElementById("client-notes");

  if (!calendarEl || !db) return;

  // ---- state ----
  var state = {
    date: window.Calendar.startOfDay(new Date()),
    slot: null,
    services: [],
    serviceId: null,
    taken: [],
  };

  function dateKey() {
    return window.Calendar.toDateKey(state.date);
  }

  function showToast(message, isError) {
    var toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "is-visible" + (isError ? " is-error" : "");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.className = "";
    }, 3500);
  }

  // ---- data loading ----
  function loadServices() {
    return db
      .from("services")
      .select("id, name, description, price, duration_minutes")
      .eq("active", true)
      .order("sort_order")
      .then(function (res) {
        if (res.error) throw res.error;
        state.services = res.data || [];
        renderServices();
      })
      .catch(function (err) {
        console.error(err);
        servicePickerEl.innerHTML = '<p class="eyebrow">Could not load services. Please refresh.</p>';
      });
  }

  function loadTakenSlots() {
    return db
      .from("bookings")
      .select("slot_time")
      .eq("booking_date", dateKey())
      .then(function (res) {
        if (res.error) throw res.error;
        state.taken = (res.data || []).map(function (row) {
          return normaliseTime(row.slot_time);
        });
        renderSlots();
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  // ---- rendering ----
  function renderCalendar() {
    window.Calendar.render(calendarEl, {
      selected: state.date,
      minDate: new Date(),
      onSelect: function (picked) {
        state.date = picked;
        state.slot = null;
        renderSlots();
        loadTakenSlots();
        updateSummary();
      },
    });
  }

  function renderSlots() {
    var now = new Date();
    var isToday = dateKey() === window.Calendar.toDateKey(now);

    slotGridEl.innerHTML = "";
    SLOT_TIMES.forEach(function (time) {
      var isTaken = state.taken.indexOf(time) !== -1;
      var isPast = isToday && Number(time.slice(0, 2)) <= now.getHours();
      var disabled = isTaken || isPast;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn" + (state.slot === time ? " is-selected" : "");
      btn.textContent = formatSlot(time);
      btn.disabled = disabled;
      btn.addEventListener("click", function () {
        state.slot = time;
        renderSlots();
        updateSummary();
      });
      slotGridEl.appendChild(btn);
    });
  }

  function renderServices() {
    servicePickerEl.innerHTML = "";
    if (!state.services.length) {
      servicePickerEl.innerHTML = '<p class="eyebrow">No services available right now.</p>';
      return;
    }
    state.services.forEach(function (service) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "service-option" + (state.serviceId === service.id ? " is-selected" : "");
      btn.innerHTML =
        "<span>" + service.name + "</span><span>R" + Number(service.price) + "</span>";
      btn.addEventListener("click", function () {
        state.serviceId = service.id;
        renderServices();
        updateSummary();
      });
      servicePickerEl.appendChild(btn);
    });
  }

  function updateSummary() {
    var canSubmit =
      !!state.date &&
      !!state.slot &&
      !!state.serviceId &&
      nameInput.value.trim().length > 1 &&
      phoneInput.value.trim().length >= 9;
    submitBtn.disabled = !canSubmit;

    if (state.date && state.slot) {
      var label = state.date.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      summaryEl.textContent = label + " at " + formatSlot(state.slot);
    } else {
      summaryEl.textContent = "Select a date and time on the left.";
    }
  }

  // ---- submit ----
  function handleSubmit(e) {
    e.preventDefault();
    if (submitBtn.disabled) return;

    var service = state.services.find(function (s) {
      return s.id === state.serviceId;
    });
    if (!service) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Booking…";

    db.from("bookings")
      .insert({
        client_name: nameInput.value.trim(),
        client_phone: phoneInput.value.trim(),
        client_email: emailInput.value.trim() || null,
        service_id: service.id,
        service_name: service.name,
        booking_date: dateKey(),
        slot_time: state.slot + ":00",
        notes: notesInput.value.trim() || null,
      })
      .then(function (res) {
        if (res.error) throw res.error;
        onBookingSuccess();
      })
      .catch(function (err) {
        console.error(err);
        var message = (err && err.message) || "";
        if (message.indexOf("duplicate") !== -1 || message.indexOf("unique") !== -1) {
          loadTakenSlots();
          state.slot = null;
          showToast("Sorry, that time was just taken. Please pick another slot.", true);
        } else {
          showToast("Something went wrong. Please try again or WhatsApp us.", true);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm booking";
      });
  }

  function onBookingSuccess() {
    var label = state.date.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    confirmationDetailsEl.textContent = label + " at " + formatSlot(state.slot);

    formWrapEl.classList.add("hidden");
    confirmationEl.classList.remove("hidden");
    showToast("Your appointment is booked");

    formEl.reset();
    state.slot = null;
    state.serviceId = null;
    loadTakenSlots();
  }

  bookAnotherBtn.addEventListener("click", function () {
    confirmationEl.classList.add("hidden");
    formWrapEl.classList.remove("hidden");
    renderServices();
    renderSlots();
    updateSummary();
    submitBtn.disabled = true;
    submitBtn.textContent = "Confirm booking";
  });

  [nameInput, phoneInput].forEach(function (input) {
    input.addEventListener("input", updateSummary);
  });

  formEl.addEventListener("submit", handleSubmit);

  // ---- init ----
  renderCalendar();
  renderSlots();
  loadServices();
  loadTakenSlots();
  updateSummary();
};
