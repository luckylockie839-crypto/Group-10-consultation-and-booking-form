// Group 10 - Consultation and Office Hour Booking Tool
// Sample data only. Everything runs in the browser.
/* raw staff*/
var rawStaff = [
  { id: 1, name: "Dr. Grace Atim", title: "Senior Lecturer", dept: "Information Technology",
    topics: ["Web development", "Final year project", "Database design"],
    slots: [[1, "09:00", false], [1, "11:00", true], [3, "14:00", false]] },
  { id: 2, name: "Mr. Peter Okello", title: "Lecturer", dept: "Computer Science",
    topics: ["Programming help", "Algorithms", "Course work"],
    slots: [[2, "10:00", false], [2, "15:00", false], [4, "09:00", true]] },
  { id: 3, name: "Ms. Esther Aciro", title: "Academic Adviser", dept: "Academic Advising",
    topics: ["Course registration", "Study plan", "Retakes"],
    slots: [[1, "14:00", false], [3, "10:00", false], [5, "11:00", false]] },
  { id: 4, name: "Dr. Joseph Drani", title: "Senior Lecturer", dept: "Mathematics",
    topics: ["Discrete mathematics", "Statistics", "Assignments"],
    slots: [[2, "08:30", true], [4, "13:00", false]] },
  { id: 5, name: "Prof. Alice Anguzu", title: "Head of Department", dept: "Electrical Engineering",
    topics: ["Research guidance", "Circuits", "Internship advice"],
    slots: [[3, "11:00", false], [5, "15:00", false]] },
  { id: 6, name: "Mr. Samuel Ayikoru", title: "Lecturer", dept: "Information Technology",
    topics: ["Networking", "Computer literacy", "Practical labs"],
    slots: [[1, "16:00", false], [4, "10:30", false], [6, "09:00", true]] },
  { id: 7, name: "Ms. Rose Candiru", title: "Student Support Officer", dept: "Student Support",
    topics: ["Counselling", "Fees and welfare", "Disability support"],
    slots: [[2, "11:00", false], [3, "16:00", false]] },
  { id: 8, name: "Dr. Moses Dradria", title: "Lecturer", dept: "Computer Science",
    topics: ["Software engineering", "Group projects", "GitHub and teamwork"],
    slots: [[2, "13:30", false], [5, "09:30", false], [6, "14:00", true]] }
];

var staffData = [];
var requests = [];

var el = {
  search: document.getElementById("searchBox"),
  dept: document.getElementById("deptFilter"),
  clear: document.getElementById("clearBtn"),
  list: document.getElementById("staffList"),
  empty: document.getElementById("emptyState"),
  count: document.getElementById("resultCount"),
  form: document.getElementById("bookingForm"),
  staff: document.getElementById("staffSelect"),
  slot: document.getElementById("slotSelect"),
  date: document.getElementById("dateField"),
  time: document.getElementById("timeField"),
  topic: document.getElementById("topicSelect"),
  name: document.getElementById("fullName"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  message: document.getElementById("formMessage"),
  summary: document.getElementById("summaryBox")
};

// --- helpers ---------------------------------------------------------
/*getslotdate()  works out the date of a time slot and skips sat and sun*/
function getSlotDate(offset) {
  var d = new Date();
  d.setDate(d.getDate() + offset);
  while (d.getDay() === 0 || d.getDay() === 6) { d.setDate(d.getDate() + 1); } // skip weekends
  return d;
}
/* formatDate() changes date into easy words*/
function formatDate(date) {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
/*getStaff() find one staff member using their id number*/
function getStaff(id) {
  return staffData.find(function (s) { return s.id === id; });
}

// Slots are interpreted in the visitor's local time, and expire at their start time.
function isPastSlot(slot) {
  var start = new Date(slot.date);
  var parts = slot.time.split(":");
  start.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
  return start.getTime() <= Date.now();
}

function prepareData() {
  staffData = rawStaff.map(function (s) {
    s.slots = s.slots.map(function (r, i) {
      return { id: s.id + "-" + i, date: getSlotDate(r[0]), time: r[1], booked: r[2] };
    });
    return s;
  });
}

// --- stats -----------------------------------------------------------

function updateStats() {
  var open = 0;
  staffData.forEach(function (s) {
    s.slots.forEach(function (sl) { if (!sl.booked && !isPastSlot(sl)) { open++; } });
  });
  document.getElementById("statStaff").textContent = staffData.length;
  document.getElementById("statSlots").textContent = open;
  document.getElementById("statRequests").textContent = requests.length;
}

// --- search and filter -----------------------------------------------

function fillDropdowns() {
  var depts = [];
  staffData.forEach(function (s) { if (depts.indexOf(s.dept) === -1) { depts.push(s.dept); } });
  depts.sort();
  el.dept.innerHTML = '<option value="all">All departments</option>' +
    depts.map(function (d) { return '<option value="' + d + '">' + d + "</option>"; }).join("");
  el.staff.innerHTML = '<option value="">-- Select staff member --</option>' +
    staffData.map(function (s) { return '<option value="' + s.id + '">' + s.name + " (" + s.dept + ")</option>"; }).join("");
}
/* search function*/
function searchStaff() {
  var query = el.search.value.trim().toLowerCase();
  var dept = el.dept.value;
  var results = staffData.filter(function (s) {
    var text = (s.name + " " + s.dept + " " + s.title + " " + s.topics.join(" ")).toLowerCase();
    return text.indexOf(query) !== -1 && (dept === "all" || s.dept === dept);
  });
  renderStaff(results);
}

function renderStaff(list) {
  el.list.innerHTML = "";
  el.empty.hidden = list.length > 0;
  el.count.textContent = list.length + " of " + staffData.length + " staff members shown";

  list.forEach(function (s) {
    var slotHtml = s.slots.map(function (sl) {
      var label = formatDate(sl.date).split(",")[0] + " " + sl.date.getDate() + "/" + (sl.date.getMonth() + 1) + " at " + sl.time;
      var unavailable = sl.booked || isPastSlot(sl);
      return '<li class="slot ' + (unavailable ? "taken" : "free") + '">' + label + (sl.booked ? " (Booked)" : isPastSlot(sl) ? " (Past)" : " (Available)") + "</li>";
    }).join("");

    var card = document.createElement("article");
    card.className = "staff-card";
    card.innerHTML =
      "<h3>" + s.name + "</h3>" +
      '<p class="dept">' + s.title + " - " + s.dept + "</p>" +
      '<p class="topics"><strong>Topics:</strong> ' + s.topics.join(", ") + "</p>" +
      '<ul class="slots" aria-label="Consultation slots for ' + s.name + '">' + slotHtml + "</ul>" +
      '<button type="button" class="btn" data-id="' + s.id + '">Book this staff member</button>';
    el.list.appendChild(card);
  });
}
// --- booking form ----------------------------------------------------

function fillSlots() {
  var staff = getStaff(Number(el.staff.value));
  el.date.value = "";
  el.time.value = "";
  if (!staff) {
    el.slot.innerHTML = '<option value="">-- Choose a staff member first --</option>';
    el.topic.innerHTML = '<option value="">-- Choose a staff member first --</option>';
    return;
  }
  el.slot.innerHTML = '<option value="">-- Select a time slot --</option>' +
    staff.slots.map(function (sl) {
      var unavailable = sl.booked || isPastSlot(sl);
      var text = formatDate(sl.date) + " at " + sl.time + (sl.booked ? " - Booked" : isPastSlot(sl) ? " - Past" : "");
      return '<option value="' + sl.id + '"' + (unavailable ? " disabled" : "") + ">" + text + "</option>";
    }).join("");
  el.topic.innerHTML = '<option value="">-- Select a topic --</option>' +
    staff.topics.concat(["Other"]).map(function (t) { return "<option>" + t + "</option>"; }).join("");
}

function showSelectedSlot() {
  var staff = getStaff(Number(el.staff.value));
  if (!staff || !el.slot.value) { el.date.value = ""; el.time.value = ""; return; }
  var slot = staff.slots.find(function (sl) { return sl.id === el.slot.value; });
  el.date.value = formatDate(slot.date);
  el.time.value = slot.time;
}

function setError(input, text) {
  document.getElementById("err-" + input.id).textContent = text;
  input.setAttribute("aria-invalid", text ? "true" : "false");
  return !text;
}

function validateForm() {
  var ok = true;
  var staff = getStaff(Number(el.staff.value));
  var slot = staff && staff.slots.find(function (sl) { return sl.id === el.slot.value; });
  var name = el.name.value.trim();
  var email = el.email.value.trim();
  var validName = /^\p{L}[\p{L}\p{M}'’.\- ]*$/u.test(name) && (name.match(/\p{L}/gu) || []).length >= 3;
  var validEmail = /^[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(email) && el.email.validity.valid;
  ok = setError(el.staff, staff ? "" : "Please choose a staff member.") && ok;
  ok = setError(el.slot, slot && !slot.booked && !isPastSlot(slot) ? "" : "Please choose an available future slot.") && ok;
  ok = setError(el.topic, staff && staff.topics.concat(["Other"]).indexOf(el.topic.value) !== -1 ? "" : "Please choose a topic.") && ok;
  ok = setError(el.name, validName ? "" : "Enter your name using at least 3 letters; spaces, apostrophes, periods and hyphens are allowed.") && ok;
  ok = setError(el.email, validEmail ? "" : "Enter a valid email address.") && ok;
  ok = setError(el.phone, /^\+?[0-9]{9,15}$/.test(el.phone.value.trim()) ? "" : "Enter 9 to 15 digits, with an optional leading +.") && ok;
  return ok;
}

function showMessage(text, type) {
  el.message.textContent = text;
  el.message.className = "state state-" + type;
  el.message.hidden = !text;
}

function showSummary(b) {
  el.summary.innerHTML =
    '<p class="state state-success">Demo summary only; no booking was sent. Demo reference: ' + b.ref + "</p>" +
    "<dl>" +
    "<dt>Staff</dt><dd>" + escapeHtml(b.staff.name) + "</dd>" +
    "<dt>Department</dt><dd>" + escapeHtml(b.staff.dept) + "</dd>" +
    "<dt>Date</dt><dd>" + formatDate(b.slot.date) + "</dd>" +
    "<dt>Time</dt><dd>" + b.slot.time + "</dd>" +
    "<dt>Topic</dt><dd>" + escapeHtml(b.topic) + "</dd>" +
    "<dt>Name</dt><dd>" + escapeHtml(b.name) + "</dd>" +
    "<dt>Email</dt><dd>" + escapeHtml(b.email) + "</dd>" +
    "<dt>Phone</dt><dd>" + escapeHtml(b.phone) + "</dd>" +
    "</dl>";
}

function bookSlot(event) {
  event.preventDefault();
  if (!validateForm()) {
    showMessage("Please correct the highlighted fields and try again.", "error");
    searchStaff();
    updateStats();
    return;
  }
  var staff = getStaff(Number(el.staff.value));
  var slot = staff.slots.find(function (sl) { return sl.id === el.slot.value; });
  if (!slot || slot.booked || isPastSlot(slot)) {
    showMessage("That slot is no longer available. Please choose another one.", "error");
    fillSlots();
    return;
  }
  slot.booked = true;
  var booking = {
    ref: "UC-" + String(requests.length + 1).padStart(3, "0"),
    staff: staff, slot: slot, topic: el.topic.value,
    name: el.name.value.trim(), email: el.email.value.trim(), phone: el.phone.value.trim()
  };
  requests.push(booking);
  showSummary(booking);
  el.form.reset();
  fillSlots();
  searchStaff();
  updateStats();
  showMessage("Demo complete. No real consultation was booked or sent.", "success");
}

function chooseStaffFromCard(event) {
  var btn = event.target.closest("button[data-id]");
  if (!btn) { return; }
  el.staff.value = btn.getAttribute("data-id");
  fillSlots();
  document.getElementById("booking").scrollIntoView();
  el.slot.focus();
}

function resetFilters() {
  el.search.value = "";
  el.dept.value = "all";
  searchStaff();
}

// --- start -----------------------------------------------------------

prepareData();
fillDropdowns();
fillSlots();
renderStaff(staffData);
updateStats();

el.search.addEventListener("input", searchStaff);
el.dept.addEventListener("change", searchStaff);
el.clear.addEventListener("click", resetFilters);
el.list.addEventListener("click", chooseStaffFromCard);
el.staff.addEventListener("change", fillSlots);
el.slot.addEventListener("change", showSelectedSlot);
el.form.addEventListener("submit", bookSlot);
el.form.addEventListener("reset", function () {
  showMessage("", "success");
  [el.staff, el.slot, el.topic, el.name, el.email, el.phone].forEach(function (i) { setError(i, ""); });
  setTimeout(function () { fillSlots(); }, 0);
});
