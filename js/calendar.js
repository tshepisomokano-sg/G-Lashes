/*
  Small, dependency-free month calendar.
  Exposes window.Calendar with a single render(container, options) call.
*/
window.Calendar = (function () {
  var WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
  var MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function startOfDay(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function toDateKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  // state kept per-instance via closure in render()
  function render(container, options) {
    var selected = options.selected || null;
    var minDate = startOfDay(options.minDate || new Date());
    var onSelect = options.onSelect || function () {};
    var viewDate = startOfDay(selected || minDate);
    viewDate.setDate(1);

    function draw() {
      var year = viewDate.getFullYear();
      var month = viewDate.getMonth();
      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      var prevMonthDisabled =
        year === minDate.getFullYear() && month <= minDate.getMonth() && year <= minDate.getFullYear();

      var html = "";
      html += '<div class="calendar-head">';
      html +=
        '<button type="button" data-nav="prev" aria-label="Previous month"' +
        (prevMonthDisabled ? " disabled" : "") +
        ">&#8249;</button>";
      html += '<span class="calendar-month-label">' + MONTH_NAMES[month] + " " + year + "</span>";
      html += '<button type="button" data-nav="next" aria-label="Next month">&#8250;</button>';
      html += "</div>";

      html += '<div class="calendar-weekdays">';
      WEEKDAYS.forEach(function (w) {
        html += "<span>" + w + "</span>";
      });
      html += "</div>";

      html += '<div class="calendar-days">';
      for (var i = 0; i < firstDay; i++) {
        html += '<span class="calendar-day is-empty"></span>';
      }
      for (var day = 1; day <= daysInMonth; day++) {
        var cellDate = new Date(year, month, day);
        var key = toDateKey(cellDate);
        var isPast = cellDate < minDate;
        var isSelected = selected && toDateKey(selected) === key;
        html +=
          '<button type="button" class="calendar-day' +
          (isSelected ? " is-selected" : "") +
          '" data-date="' +
          key +
          '"' +
          (isPast ? " disabled" : "") +
          ">" +
          day +
          "</button>";
      }
      html += "</div>";

      container.innerHTML = html;

      container.querySelectorAll("[data-nav]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var dir = btn.getAttribute("data-nav") === "next" ? 1 : -1;
          viewDate.setMonth(viewDate.getMonth() + dir);
          draw();
        });
      });

      container.querySelectorAll(".calendar-day[data-date]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var dateKey = btn.getAttribute("data-date");
          var parts = dateKey.split("-").map(Number);
          var picked = new Date(parts[0], parts[1] - 1, parts[2]);
          selected = picked;
          draw();
          onSelect(picked);
        });
      });
    }

    draw();
  }

  return { render: render, toDateKey: toDateKey, startOfDay: startOfDay };
})();
