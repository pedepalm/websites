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
const TASKS_ENDPOINT = "/v1/tasks";
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

function closeCallbackModals() {
  choiceModal.hidden = true;
  immediateModal.hidden = true;
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

const queue = document.querySelector("#queue-count");
if (queue) {
  window.setInterval(() => {
    queue.textContent = String(41 + Math.floor(Math.random() * 9));
  }, 5000);
}
