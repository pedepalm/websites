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

const queue = document.querySelector("#queue-count");
if (queue) {
  window.setInterval(() => {
    queue.textContent = String(41 + Math.floor(Math.random() * 9));
  }, 5000);
}
