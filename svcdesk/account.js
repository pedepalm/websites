/* Shared account chrome: Airtable login, Webex OAuth chip, and Journey (JDS) event posts. */
const LOGIN_ENDPOINT = "/.netlify/functions/login";
const OAUTH_ENDPOINT = "/.netlify/functions/wxcc-oauth";
const JOURNEY_ENDPOINT = "/.netlify/functions/journey";
const EMPLOYEE_ID = /^\d{5}$/;

function accountToast() {
  let node = document.querySelector("#toast");
  if (!node) {
    node = document.createElement("div");
    node.id = "toast";
    node.className = "toast";
    node.hidden = true;
    node.setAttribute("role", "status");
    document.body.appendChild(node);
  }
  return node;
}

function showAccountToast(message, ms) {
  const toast = accountToast();
  toast.hidden = false;
  toast.textContent = message;
  window.setTimeout(() => {
    toast.hidden = true;
  }, ms || 3200);
}

function initialsFromName(fname, lname) {
  const first = String(fname || "").trim().charAt(0);
  const last = String(lname || "").trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
}

function readSessionUser() {
  const employeeId = sessionStorage.getItem("employeeId") || "";
  const fname = sessionStorage.getItem("fname") || "";
  const lname = sessionStorage.getItem("lname") || "";
  const phone = sessionStorage.getItem("phone") || "";
  if (!employeeId) return null;
  return { employeeId, fname, lname, phone };
}

function storeSessionUser(user) {
  sessionStorage.setItem("employeeId", user.employeeId || "");
  sessionStorage.setItem("fname", user.fname || "");
  sessionStorage.setItem("lname", user.lname || "");
  sessionStorage.setItem("phone", user.phone || "");
}

function clearSessionUser() {
  sessionStorage.removeItem("employeeId");
  sessionStorage.removeItem("fname");
  sessionStorage.removeItem("lname");
  sessionStorage.removeItem("phone");
}

function renderAccount(user) {
  const accountGuest = document.querySelector("#account-guest");
  const accountUser = document.querySelector("#account-user");
  const accountInitials = document.querySelector("#account-initials");
  const accountName = document.querySelector("#account-name");
  if (user) {
    if (accountInitials) accountInitials.textContent = initialsFromName(user.fname, user.lname);
    if (accountName) accountName.textContent = `${user.fname} ${user.lname}`.trim() || user.employeeId;
    if (accountGuest) accountGuest.hidden = true;
    if (accountUser) accountUser.hidden = false;
    return;
  }
  if (accountInitials) accountInitials.textContent = "";
  if (accountName) accountName.textContent = "";
  if (accountUser) accountUser.hidden = true;
  if (accountGuest) accountGuest.hidden = false;
}

function isLoggedInUser(user) {
  return Boolean(user && EMPLOYEE_ID.test(String(user.employeeId || "").trim()));
}

async function postJourneyEvent(action, user, extras) {
  if (!isLoggedInUser(user)) return;
  const needsOauth = action === "product" || action === "immediate" || action === "scheduled"
    || action === "cancelled" || action === "modified";
  if (needsOauth) {
    const connected = await refreshWxccAuthState();
    if (!connected) return;
  }
  try {
    const response = await fetch(JOURNEY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        action,
        employeeId: user.employeeId,
        fname: user.fname || "",
        lname: user.lname || "",
        ...(extras || {})
      })
    });
    if (response.status === 401) {
      setWxccAuthState(false);
    }
  } catch {
    // Page actions still complete if the journey post fails.
  }
}

function productNameFromPage() {
  return document.querySelector("#device-detail")?.dataset.productName || "";
}

function publishProductInterest(user) {
  const product = productNameFromPage();
  if (!product) return;
  postJourneyEvent("product", user || readSessionUser(), { product });
}

function callbackJourneyUi(action, user) {
  const first = String(user?.fname || "").trim();
  const last = String(user?.lname || "").trim();
  if (action === "immediate") {
    return {
      title: "Immediate Callback",
      iconType: "calendar-day-bold",
      subTitle: `${first} ${last} initiated an immediate callback`,
      filterTags: ["Callback", "Immediate"]
    };
  }
  if (action === "cancelled") {
    return {
      title: "Cancelled Scheduled Callback",
      iconType: "calendar-day-bold",
      subTitle: `${first} ${last} cancelled a scheduled callback`,
      filterTags: ["Callback", "Scheduled", "Cancelled"]
    };
  }
  if (action === "modified") {
    return {
      title: "Modified Scheduled Callback",
      iconType: "calendar-day-bold",
      subTitle: `${first} ${last} modified a scheduled callback`,
      filterTags: ["Callback", "Scheduled", "Modified"]
    };
  }
  if (action === "scheduled") {
    return {
      title: "Scheduled Callback",
      iconType: "calendar-day-bold",
      subTitle: `${first} ${last} scheduled a callback`,
      filterTags: ["Callback", "Scheduled"]
    };
  }
  return {};
}

window.publishSvcDeskJourney = function publishSvcDeskJourney(action, extras) {
  const user = readSessionUser();
  return postJourneyEvent(action, user, {
    ...(extras || {}),
    ...callbackJourneyUi(action, user)
  });
};

function setWxccAuthState(connected) {
  const needed = document.querySelector("#wxcc-auth-needed");
  const ready = document.querySelector("#wxcc-auth-ready");
  const label = document.querySelector("#wxcc-status-label");
  if (needed) needed.hidden = Boolean(connected);
  if (ready) ready.hidden = !connected;
  if (label) {
    label.textContent = connected ? "Webex on" : "Webex off";
    label.classList.toggle("on", Boolean(connected));
  }
}

async function refreshWxccAuthState() {
  try {
    const response = await fetch(`${OAUTH_ENDPOINT}?status=1`, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    setWxccAuthState(Boolean(payload.connected));
    return Boolean(payload.connected);
  } catch {
    setWxccAuthState(false);
    return false;
  }
}

const WXCC_OAUTH_TOASTS = {
  connected: "Webex Contact Center connected.",
  disconnected: "Webex Contact Center disconnected.",
  denied: "Webex authorization was denied.",
  error: "Webex authorization failed."
};

let wxccOauthPopup = null;
let wxccOauthPoll = null;
let wxccOauthPending = false;

function wxccOauthPopupFeatures() {
  const width = 520;
  const height = 700;
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
  return `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`;
}

function isTrustedWxccOrigin(origin) {
  return origin === window.location.origin;
}

function applyWxccOauthStatus(status) {
  if (status === "connected") setWxccAuthState(true);
  if (status === "disconnected" || status === "denied" || status === "error") {
    setWxccAuthState(false);
  }
  if (WXCC_OAUTH_TOASTS[status]) showAccountToast(WXCC_OAUTH_TOASTS[status], 4200);
  refreshWxccAuthState();
  window.focus();
}

function clearWxccOauthPoll() {
  if (wxccOauthPoll) {
    window.clearInterval(wxccOauthPoll);
    wxccOauthPoll = null;
  }
}

function bindWxccOauthPopup() {
  document.querySelector("#wxcc-auth-needed")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (wxccOauthPopup && !wxccOauthPopup.closed) {
      wxccOauthPopup.focus();
      return;
    }
    const popup = window.open(
      `${OAUTH_ENDPOINT}?popup=1`,
      "wxcc-oauth",
      wxccOauthPopupFeatures()
    );
    if (!popup) {
      window.location.assign(OAUTH_ENDPOINT);
      return;
    }
    wxccOauthPopup = popup;
    wxccOauthPending = true;
    clearWxccOauthPoll();
    wxccOauthPoll = window.setInterval(() => {
      if (wxccOauthPopup && !wxccOauthPopup.closed) return;
      clearWxccOauthPoll();
      wxccOauthPopup = null;
      if (!wxccOauthPending) return;
      wxccOauthPending = false;
      refreshWxccAuthState();
    }, 500);
  });

  window.addEventListener("message", (event) => {
    if (!isTrustedWxccOrigin(event.origin)) return;
    const data = event.data;
    if (!data || data.type !== "wxcc-oauth") return;
    const status = String(data.status || "");
    if (!WXCC_OAUTH_TOASTS[status]) return;
    wxccOauthPending = false;
    clearWxccOauthPoll();
    if (wxccOauthPopup && !wxccOauthPopup.closed) {
      try {
        wxccOauthPopup.close();
      } catch {
        // popup may already be closing itself
      }
    }
    wxccOauthPopup = null;
    applyWxccOauthStatus(status);
  });
}

function bindAccountChrome() {
  const loginModal = document.querySelector("#login-modal");
  const loginForm = document.querySelector("#login-form");
  const loginUser = document.querySelector("#login-user");
  const loginPassword = document.querySelector("#login-password");
  const loginError = document.querySelector("#login-error");
  const loginSubmit = document.querySelector("#login-submit");

  function showLoginError(message) {
    if (!loginError) return;
    loginError.hidden = !message;
    loginError.textContent = message || "";
  }

  function openLoginModal() {
    if (!loginModal) return;
    loginForm?.reset();
    showLoginError("");
    loginModal.hidden = false;
    loginUser?.focus();
  }

  function closeLoginModal() {
    if (loginModal) loginModal.hidden = true;
    loginForm?.reset();
    showLoginError("");
  }

  document.querySelector("#login-open")?.addEventListener("click", openLoginModal);
  document.querySelector("#login-cancel")?.addEventListener("click", closeLoginModal);
  loginModal?.addEventListener("click", (event) => {
    if (event.target === loginModal) closeLoginModal();
  });

  loginUser?.addEventListener("input", () => {
    loginUser.value = String(loginUser.value || "").replace(/\D/g, "").slice(0, 5);
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const employeeId = String(loginUser?.value || "").trim();
    if (loginPassword) loginPassword.value = "";
    if (!EMPLOYEE_ID.test(employeeId)) {
      showLoginError("Enter a 5-digit User ID.");
      return;
    }
    showLoginError("");
    if (loginSubmit) {
      loginSubmit.disabled = true;
      loginSubmit.textContent = "Logging in…";
    }
    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ employeeId })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Login Failed");
      }
      const user = {
        employeeId: payload.employeeId || employeeId,
        fname: payload.fname || "",
        lname: payload.lname || "",
        phone: payload.phone || ""
      };
      storeSessionUser(user);
      renderAccount(user);
      closeLoginModal();
      showAccountToast("Login successful");
      if (isLoggedInUser(readSessionUser())) {
        postJourneyEvent("login", user);
        publishProductInterest(user);
      }
    } catch {
      showLoginError("");
      showAccountToast("Login Failed");
    } finally {
      if (loginSubmit) {
        loginSubmit.disabled = false;
        loginSubmit.textContent = "Log in";
      }
    }
  });

  document.querySelector("#logout")?.addEventListener("click", () => {
    const user = readSessionUser();
    if (isLoggedInUser(user)) postJourneyEvent("logout", user);
    clearSessionUser();
    renderAccount(null);
  });

  const wxccStatus = new URLSearchParams(window.location.search).get("wxcc");
  if (wxccStatus) {
    if (WXCC_OAUTH_TOASTS[wxccStatus]) showAccountToast(WXCC_OAUTH_TOASTS[wxccStatus], 4200);
    if (wxccStatus === "connected") setWxccAuthState(true);
    if (wxccStatus === "disconnected") setWxccAuthState(false);
    const clean = new URL(window.location.href);
    clean.searchParams.delete("wxcc");
    window.history.replaceState({}, "", clean.pathname + clean.search + clean.hash);
  }

  bindWxccOauthPopup();
  renderAccount(readSessionUser());
  refreshWxccAuthState();
  window.addEventListener("pageshow", () => {
    refreshWxccAuthState();
  });
  window.setInterval(refreshWxccAuthState, 180000);
}

bindAccountChrome();
