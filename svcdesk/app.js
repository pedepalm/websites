const cards = [...document.querySelectorAll("[data-card]")];
const tabs = [...document.querySelectorAll("[data-tab]")];
const modal = document.querySelector("#intake-modal");
const toast = document.querySelector("#toast");
const form = document.querySelector("#intake-form");
const banner = document.querySelector("#sev-banner");

let activeLane = "all";

function applyFilters() {
  cards.forEach((card) => {
    const laneOk = activeLane === "all" || card.dataset.lane === activeLane;
    card.classList.toggle("hidden", !laneOk);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeLane = tab.dataset.tab;
    tabs.forEach((btn) => btn.classList.toggle("active", btn === tab));
    applyFilters();
  });
});

function openModal(preset = {}) {
  form.reset();
  form.lane.value = preset.lane || "it";
  form.category.value = preset.category || "";
  form.urgency.value = preset.urgency || "p3";
  modal.hidden = false;
  form.summary.focus();
}

document.querySelectorAll("[data-request]").forEach((btn) => {
  btn.addEventListener("click", () => {
    openModal({
      lane: btn.dataset.lane,
      category: btn.dataset.request,
      urgency: btn.dataset.urgency
    });
  });
});

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    modal.hidden = true;
  });
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.hidden = true;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const prefix = form.lane.value === "hr" ? "HRT" : form.urgency.value === "p1" ? "INC" : "RITM";
  const id = `${prefix}-${Math.floor(10000 + Math.random() * 89999)}`;
  modal.hidden = true;
  toast.hidden = false;
  toast.textContent = `${id} opened and routed to ${form.lane.value === "hr" ? "People Operations" : "L1 Service Desk"}. SLA clock started.`;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 4200);
});

document.querySelector("#dismiss-banner")?.addEventListener("click", () => {
  banner.classList.add("hidden");
});

function placeChatLauncher() {
  const slot = document.querySelector("#chat-widget-slot");
  const launcher = document.querySelector("#imi-chatbutton");
  if (!slot || !launcher || launcher.parentElement === slot) {
    return Boolean(slot && launcher);
  }
  slot.appendChild(launcher);
  return true;
}

function watchChatLauncher() {
  placeChatLauncher();
  const host = document.querySelector("#divicw");
  if (host) {
    const observer = new MutationObserver(() => {
      placeChatLauncher();
    });
    observer.observe(host, { childList: true, subtree: true });
  }
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (placeChatLauncher() || attempts >= 40) {
      window.clearInterval(timer);
    }
  }, 250);
}

watchChatLauncher();

const choiceModal = document.querySelector("#callback-choice-modal");
const immediateModal = document.querySelector("#callback-immediate-modal");
const immediateForm = document.querySelector("#callback-immediate-form");
const mobileInput = document.querySelector("#mobile-e164");
const firstNameInput = document.querySelector("#cb-first-name");
const lastNameInput = document.querySelector("#cb-last-name");
const submitImmediate = document.querySelector("#cb-submit");
const tokenInput = document.querySelector("#wxcc-token");
const immediateError = document.querySelector("#callback-immediate-error");
const E164 = /^\+[1-9]\d{1,14}$/;
const TASKS_ENDPOINT = "/.netlify/functions/tasks";
const CALLBACK_DESTINATION = "+19723428062";
const CALLBACK_ENTRY_POINT = "2e96d353-a9a7-487b-885e-dd81c51cb783";

function showImmediateError(message) {
  immediateError.hidden = !message;
  immediateError.textContent = message || "";
}

function buildImmediateTaskBody(firstName, lastName) {
  return {
    destination: CALLBACK_DESTINATION,
    entryPointId: CALLBACK_ENTRY_POINT,
    attributes: {
      globalFname: firstName,
      globalLname: lastName,
      globalMessage: "Immediate Callback from support website"
    },
    outboundType: "CALLBACK",
    mediaType: "telephony",
    callback: {
      callbackOrigin: "web",
      callbackType: "immediate"
    }
  };
}

const cancelModal = document.querySelector("#callback-cancel-modal");

function closeCallbackModals() {
  choiceModal.hidden = true;
  immediateModal.hidden = true;
  if (scheduledModal) scheduledModal.hidden = true;
  if (cancelModal) cancelModal.hidden = true;
}

function syncImmediateSubmit() {
  const mobileOk = E164.test((mobileInput.value || "").trim());
  const firstOk = (firstNameInput.value || "").trim().length > 0;
  const lastOk = (lastNameInput.value || "").trim().length > 0;
  mobileInput.classList.toggle("invalid", mobileInput.value.trim() !== "" && !mobileOk);
  submitImmediate.disabled = !(mobileOk && firstOk && lastOk);
}

document.querySelector("#callback-open")?.addEventListener("click", () => {
  closeCallbackModals();
  choiceModal.hidden = false;
});

document.querySelector("#callback-choose-immediate")?.addEventListener("click", () => {
  choiceModal.hidden = true;
  immediateForm.reset();
  submitImmediate.disabled = true;
  mobileInput.classList.remove("invalid");
  showImmediateError("");
  immediateModal.hidden = false;
  mobileInput.focus();
});

document.querySelector("#callback-back")?.addEventListener("click", () => {
  immediateModal.hidden = true;
  choiceModal.hidden = false;
});

document.querySelectorAll("[data-close-callback]").forEach((btn) => {
  btn.addEventListener("click", closeCallbackModals);
});

choiceModal?.addEventListener("click", (event) => {
  if (event.target === choiceModal) closeCallbackModals();
});
immediateModal?.addEventListener("click", (event) => {
  if (event.target === immediateModal) closeCallbackModals();
});

[mobileInput, firstNameInput, lastNameInput].forEach((input) => {
  input?.addEventListener("input", syncImmediateSubmit);
});

immediateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  syncImmediateSubmit();
  if (submitImmediate.disabled) {
    return;
  }
  const token = (tokenInput?.value || "").trim();
  if (!token) {
    showImmediateError("Enter an admin bearer token in the testing box above Quick Actions.");
    return;
  }
  showImmediateError("");
  submitImmediate.disabled = true;
  submitImmediate.textContent = "Submitting…";
  try {
    const response = await fetch(TASKS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(buildImmediateTaskBody(
        firstNameInput.value.trim(),
        lastNameInput.value.trim()
      ))
    });
    if (!response.ok) {
      const detail = await response.text();
      const safeDetail = detail.replace(/bearer\s+[a-z0-9._-]+/ig, "[redacted]").slice(0, 240);
      throw new Error(`Tasks API ${response.status}${safeDetail ? `: ${safeDetail}` : ""}`);
    }
    closeCallbackModals();
    toast.hidden = false;
    toast.textContent = "Immediate callback requested. An agent will call you shortly.";
    window.setTimeout(() => {
      toast.hidden = true;
    }, 4200);
  } catch (error) {
    showImmediateError(error.message || "Could not create the callback task.");
  } finally {
    submitImmediate.textContent = "Submit";
    syncImmediateSubmit();
  }
});

const scheduledModal = document.querySelector("#callback-scheduled-modal");
const scheduledForm = document.querySelector("#callback-scheduled-form");
const schedNumber = document.querySelector("#sched-number");
const schedDate = document.querySelector("#sched-date");
const schedFirst = document.querySelector("#sched-first-name");
const schedLast = document.querySelector("#sched-last-name");
const schedTimezone = document.querySelector("#sched-timezone");
const schedSubmit = document.querySelector("#sched-submit");
const scheduledError = document.querySelector("#callback-scheduled-error");
const SCHEDULED_ENDPOINT = "/.netlify/functions/tasks";
const SCHEDULED_QUEUE_ID = "fc8108e3-3fac-4e32-80dd-4a23bf8cb6c8";
const US_TIMEZONES = [
  "America/New_York",
  "America/Detroit",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Indiana/Indianapolis",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Chicago",
  "America/Indiana/Knox",
  "America/Indiana/Tell_City",
  "America/Menominee",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/North_Dakota/Beulah",
  "America/Denver",
  "America/Boise",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Juneau",
  "America/Sitka",
  "America/Yakutat",
  "America/Nome",
  "America/Adak",
  "America/Metlakatla",
  "Pacific/Honolulu",
  "America/Puerto_Rico",
  "America/St_Thomas"
];

function showScheduledError(message) {
  scheduledError.hidden = !message;
  scheduledError.textContent = message || "";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function addDaysIso(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function populateHourSelect(select) {
  if (!select || select.options.length > 0) return;
  for (let hour = 1; hour <= 12; hour += 1) {
    const option = document.createElement("option");
    option.value = String(hour);
    option.textContent = String(hour);
    select.appendChild(option);
  }
}

function populateTimezones() {
  if (!schedTimezone || schedTimezone.options.length > 0) return;
  US_TIMEZONES.forEach((zone) => {
    const option = document.createElement("option");
    option.value = zone;
    option.textContent = zone;
    schedTimezone.appendChild(option);
  });
  schedTimezone.value = "America/Chicago";
}

function toTwentyFourHour(hour12, minute, meridiem) {
  let hour = Number(hour12);
  if (meridiem === "AM") {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }
  return `${pad2(hour)}:${minute}:00`;
}

function minutesFromMidnight(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  return hours * 60 + minutes;
}

function readStartTime() {
  return toTwentyFourHour(
    document.querySelector("#sched-start-hour").value,
    document.querySelector("#sched-start-minute").value,
    document.querySelector("#sched-start-ampm").value
  );
}

function readEndTime() {
  return toTwentyFourHour(
    document.querySelector("#sched-end-hour").value,
    document.querySelector("#sched-end-minute").value,
    document.querySelector("#sched-end-ampm").value
  );
}

function scheduledWindowError() {
  const dateValue = schedDate.value;
  if (!dateValue) return "Select a callback date.";
  const min = schedDate.min;
  const max = schedDate.max;
  if (dateValue < min || dateValue > max) {
    return "Callback date must be today through 30 days from now.";
  }
  const start = readStartTime();
  const end = readEndTime();
  const duration = minutesFromMidnight(end) - minutesFromMidnight(start);
  if (duration <= 0) {
    return "Ending time must be after the start time on the same day.";
  }
  if (duration >= 8 * 60) {
    return "Start time and end time must be less than 8 hours apart.";
  }
  return "";
}

function buildScheduledCallbackBody() {
  return {
    customerName: `${schedFirst.value.trim()} ${schedLast.value.trim()}`.trim(),
    callbackNumber: schedNumber.value.trim(),
    timezone: schedTimezone.value,
    scheduleDate: schedDate.value,
    startTime: readStartTime(),
    endTime: readEndTime(),
    queueId: SCHEDULED_QUEUE_ID
  };
}

function syncScheduledSubmit() {
  const numberOk = E164.test((schedNumber.value || "").trim());
  const firstOk = (schedFirst.value || "").trim().length > 0;
  const lastOk = (schedLast.value || "").trim().length > 0;
  const tzOk = Boolean(schedTimezone.value);
  const windowError = scheduledWindowError();
  schedNumber.classList.toggle("invalid", schedNumber.value.trim() !== "" && !numberOk);
  schedDate.classList.toggle("invalid", Boolean(schedDate.value) && Boolean(windowError));
  const ready = numberOk && firstOk && lastOk && tzOk && !windowError;
  schedSubmit.disabled = !ready;
  if (ready) showScheduledError("");
}

function openScheduledForm() {
  choiceModal.hidden = true;
  scheduledForm.reset();
  populateHourSelect(document.querySelector("#sched-start-hour"));
  populateHourSelect(document.querySelector("#sched-end-hour"));
  populateTimezones();
  const today = todayIsoDate();
  schedDate.min = today;
  schedDate.max = addDaysIso(today, 30);
  schedDate.value = today;
  document.querySelector("#sched-start-hour").value = "1";
  document.querySelector("#sched-start-minute").value = "00";
  document.querySelector("#sched-start-ampm").value = "PM";
  document.querySelector("#sched-end-hour").value = "2";
  document.querySelector("#sched-end-minute").value = "00";
  document.querySelector("#sched-end-ampm").value = "PM";
  schedTimezone.value = "America/Chicago";
  showScheduledError("");
  syncScheduledSubmit();
  scheduledModal.hidden = false;
  schedNumber.focus();
}

document.querySelector("#callback-choose-scheduled")?.addEventListener("click", openScheduledForm);

document.querySelector("#callback-scheduled-back")?.addEventListener("click", () => {
  scheduledModal.hidden = true;
  choiceModal.hidden = false;
});

scheduledModal?.addEventListener("click", (event) => {
  if (event.target === scheduledModal) closeCallbackModals();
});

[schedNumber, schedDate, schedFirst, schedLast, schedTimezone,
  document.querySelector("#sched-start-hour"),
  document.querySelector("#sched-start-minute"),
  document.querySelector("#sched-start-ampm"),
  document.querySelector("#sched-end-hour"),
  document.querySelector("#sched-end-minute"),
  document.querySelector("#sched-end-ampm")
].forEach((input) => {
  input?.addEventListener("input", syncScheduledSubmit);
  input?.addEventListener("change", syncScheduledSubmit);
});

scheduledForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  syncScheduledSubmit();
  const windowError = scheduledWindowError();
  if (windowError) {
    showScheduledError(windowError);
    return;
  }
  if (schedSubmit.disabled) {
    return;
  }
  const token = (tokenInput?.value || "").trim();
  if (!token) {
    showScheduledError("Enter an admin bearer token in the testing box above Quick Actions.");
    return;
  }
  showScheduledError("");
  schedSubmit.disabled = true;
  schedSubmit.textContent = "Submitting…";
  try {
    const response = await fetch(SCHEDULED_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Callback-Type": "scheduled"
      },
      body: JSON.stringify(buildScheduledCallbackBody())
    });
    if (!response.ok) {
      const detail = await response.text();
      const safeDetail = detail.replace(/bearer\s+[a-z0-9._-]+/ig, "[redacted]").slice(0, 240);
      throw new Error(`Scheduled Callback API ${response.status}${safeDetail ? `: ${safeDetail}` : ""}`);
    }
    closeCallbackModals();
    toast.hidden = false;
    toast.textContent = "Scheduled callback requested.";
    window.setTimeout(() => {
      toast.hidden = true;
    }, 4200);
  } catch (error) {
    showScheduledError(error.message || "Could not schedule the callback.");
  } finally {
    schedSubmit.textContent = "Submit";
    syncScheduledSubmit();
  }
});

const cancelSearchForm = document.querySelector("#callback-cancel-search-form");
const cancelNumber = document.querySelector("#cancel-number");
const cancelSearchBtn = document.querySelector("#cancel-search");
const cancelError = document.querySelector("#callback-cancel-error");
const cancelResults = document.querySelector("#cancel-results");

function showCancelError(message) {
  cancelError.hidden = !message;
  cancelError.textContent = message || "";
}

function authHeaders() {
  const token = (tokenInput?.value || "").trim();
  return {
    token,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Callback-Type": "scheduled"
    }
  };
}

function addDetail(list, label, value) {
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value || "—";
  list.appendChild(dt);
  list.appendChild(dd);
}

function normalizeCallbacks(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (payload?.id) return [payload];
  return [];
}

function renderCancelResults(items) {
  cancelResults.replaceChildren();
  cancelResults.hidden = items.length === 0;
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "callback-result";
    const heading = document.createElement("h3");
    heading.textContent = "Scheduled callback found";
    const list = document.createElement("dl");
    addDetail(list, "ID", item.id);
    addDetail(list, "Name", item.customerName || item.name);
    addDetail(list, "Callback number", item.callbackNumber);
    addDetail(list, "Date", item.scheduleDate || item.scheduledDate);
    addDetail(list, "Window", `${item.startTime || "—"} – ${item.endTime || "—"}`);
    addDetail(list, "Time zone", item.timezone);
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "btn";
    confirm.textContent = "Confirm deletion";
    const keep = document.createElement("button");
    keep.type = "button";
    keep.className = "btn ghost";
    keep.textContent = "Keep this callback";
    confirm.addEventListener("click", () => deleteScheduledCallback(item.id, confirm));
    keep.addEventListener("click", () => {
      cancelResults.hidden = true;
      cancelResults.replaceChildren();
    });
    actions.appendChild(confirm);
    actions.appendChild(keep);
    card.appendChild(heading);
    card.appendChild(list);
    card.appendChild(actions);
    cancelResults.appendChild(card);
  });
}

async function deleteScheduledCallback(id, button) {
  const { token, headers } = authHeaders();
  if (!token) {
    showCancelError("Enter an admin bearer token in the testing box above Quick Actions.");
    return;
  }
  button.disabled = true;
  button.textContent = "Deleting…";
  try {
    const response = await fetch(`${TASKS_ENDPOINT}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers
    });
    if (!response.ok && response.status !== 204) {
      const detail = await response.text();
      const safeDetail = detail.replace(/bearer\s+[a-z0-9._-]+/ig, "[redacted]").slice(0, 240);
      throw new Error(`Delete Callback API ${response.status}${safeDetail ? `: ${safeDetail}` : ""}`);
    }
    closeCallbackModals();
    toast.hidden = false;
    toast.textContent = "Scheduled callback cancelled.";
    window.setTimeout(() => {
      toast.hidden = true;
    }, 4200);
  } catch (error) {
    showCancelError(error.message || "Could not delete the scheduled callback.");
    button.disabled = false;
    button.textContent = "Confirm deletion";
  }
}

document.querySelector("#callback-choose-cancel")?.addEventListener("click", () => {
  choiceModal.hidden = true;
  cancelSearchForm.reset();
  cancelSearchBtn.disabled = true;
  showCancelError("");
  cancelResults.hidden = true;
  cancelResults.replaceChildren();
  cancelModal.hidden = false;
  cancelNumber.focus();
});

document.querySelector("#callback-choose-modify")?.addEventListener("click", () => {
  toast.hidden = false;
  toast.textContent = "Modify an existing callback comes next.";
  window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
});

document.querySelector("#callback-cancel-back")?.addEventListener("click", () => {
  cancelModal.hidden = true;
  choiceModal.hidden = false;
});

cancelModal?.addEventListener("click", (event) => {
  if (event.target === cancelModal) closeCallbackModals();
});

cancelNumber?.addEventListener("input", () => {
  const ok = E164.test((cancelNumber.value || "").trim());
  cancelNumber.classList.toggle("invalid", cancelNumber.value.trim() !== "" && !ok);
  cancelSearchBtn.disabled = !ok;
});

cancelSearchForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const number = (cancelNumber.value || "").trim();
  if (!E164.test(number)) {
    showCancelError("Enter a callback number in E.164 format, starting with +.");
    return;
  }
  const { token, headers } = authHeaders();
  if (!token) {
    showCancelError("Enter an admin bearer token in the testing box above Quick Actions.");
    return;
  }
  showCancelError("");
  cancelResults.hidden = true;
  cancelResults.replaceChildren();
  cancelSearchBtn.disabled = true;
  cancelSearchBtn.textContent = "Searching…";
  try {
    const response = await fetch(
      `${TASKS_ENDPOINT}?callbackNumber=${encodeURIComponent(number)}`,
      { method: "GET", headers }
    );
    if (!response.ok) {
      const detail = await response.text();
      const safeDetail = detail.replace(/bearer\s+[a-z0-9._-]+/ig, "[redacted]").slice(0, 240);
      throw new Error(`Get Callback API ${response.status}${safeDetail ? `: ${safeDetail}` : ""}`);
    }
    const payload = await response.json();
    const items = normalizeCallbacks(payload);
    if (items.length === 0) {
      showCancelError("No scheduled callback was found for that number.");
      return;
    }
    renderCancelResults(items);
  } catch (error) {
    showCancelError(error.message || "Could not look up the scheduled callback.");
  } finally {
    cancelSearchBtn.textContent = "Search";
    cancelSearchBtn.disabled = !E164.test((cancelNumber.value || "").trim());
  }
});

const queue = document.querySelector("#queue-count");
if (queue) {
  window.setInterval(() => {
    queue.textContent = String(41 + Math.floor(Math.random() * 9));
  }, 5000);
}
