const MOVIES = [
  ["Godzilla Minus Zero", "https://www.cinemark.com/media/ga4bfobv/mdgodzillaminuszeroposter.jpg", true],
  ["The Cat in the Hat", "https://www.cinemark.com/media/gdfdsn2b/mdthecatinthehatoffposter.png", true],
  ["The Hunger Games: Sunrise on the Reaping", "https://www.cinemark.com/media/gjelrnzh/mdhungergamesatsunriseposter.jpg", true],
  ["You Can See Everything", "https://www.cinemark.com/media/ptblssaq/mdyoucanseeverposter.jpg", false],
  ["Wildwood", "https://www.cinemark.com/media/nlrn1hms/mdwildwoodfanposter.jpg", false],
  ["Wicker", "https://www.cinemark.com/media/03vh4adh/mdwickerposter.jpg", false],
  ["Sight & Sound Presents: Joshua Live!", "https://www.cinemark.com/media/fc0jwf4k/mdjoshualiveposter.jpg", false],
  ["Focker-In-Law", "https://www.cinemark.com/media/c24fclau/mdfockerinlawposter.jpg", false],
  ["Ebenezer", "https://www.cinemark.com/media/4xohtg01/mdebenezernewposter.jpg", true],
  ["Disney's Hexed", "https://www.cinemark.com/media/meggfqiv/mddisneyshexedpayoffposter.jpg", true],
  ["Avengers: Doomsday", "https://www.cinemark.com/media/ijkp2cxl/mdavengersdoomsdayteaser.jpg", true],
  ["Avengers: Doomsday RealD 3D Fan Event", "https://www.cinemark.com/media/ghknzqw5/mdavengersdoomsday3dposter.jpg", true],
  ["Dune: Part Three", "https://www.cinemark.com/media/wa2l3bqe/mddune3offposter.jpg", true],
  ["Everest: The Other Side", "https://www.cinemark.com/media/qxnh4u05/mdeverestposter.jpg", true],
  ["BTS World Tour 'ARIRANG' in São Paulo: Live Viewing", "https://www.cinemark.com/media/hbsa3q2i/mdbtsworldtouraigangsriesposter.jpg", false],
  ["I Play Rocky", "https://www.cinemark.com/media/feyjiglt/mdiplayrockyposter.jpg", false],
  ["Wild Horse Nine", "https://www.cinemark.com/media/0jmhatcm/mdwildhorsenineposter.jpg", true],
  ["Drummer Boy", "https://www.cinemark.com/media/gimgl3hn/mddbposter.jpg", true],
  ["Ramayana (Hindi with English Subtitles)", "https://www.cinemark.com/media/ypyjxicj/mdramayanaposter.png", true],
  ["JIMMY", "https://www.cinemark.com/media/wsmfpga2/mdjimmyposter.jpg", true],
  ["Violent Night 2", "https://www.cinemark.com/media/76008523/postercomingsoonimage_website-app_200x300.png", false],
  ["Ghost Soldier", "https://www.cinemark.com/media/02lcw0e5/mdghostsoliderposter.jpg", true],
  ["Hershey", "https://www.cinemark.com/media/kgdmsozx/mdhersheyposter.jpg", true],
  ["Zero A.D.: The Birth of Christ", "https://www.cinemark.com/media/wejjjktu/mdzeroadposter.jpg", true],
  ["The Only Living Pickpocket in New York", "https://www.cinemark.com/media/dladcbw5/mdtheonlylivingposter.jpg", false],
  ["Fjord", "https://www.cinemark.com/media/pcaly2kb/mdfjordposter.jpg", false]
];

const scroller = document.querySelector("#scroller");
scroller.innerHTML = MOVIES.map(([title, poster, advance]) => `
  <article class="card${advance ? " has-advance" : ""}">
    ${advance ? '<div class="advance">Advance Tickets</div>' : ""}
    <div class="poster">
      <img class="art" src="${poster}" alt="">
      <img class="play" src="https://www.cinemark.com/images/videoOverlay.png" alt="">
      <span class="heart" aria-hidden="true">♡</span>
    </div>
    <p class="title">${title}</p>
  </article>
`).join("");

function scrollByCard(direction) {
  const card = scroller.querySelector(".card");
  const amount = (card ? card.getBoundingClientRect().width + 16 : 236) * 2;
  scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
}
document.querySelector("#prev").addEventListener("click", () => scrollByCard(-1));
document.querySelector("#next").addEventListener("click", () => scrollByCard(1));

document.addEventListener("click", (event) => {
  if (event.target.closest(".wxcc-dock, .arrows")) return;
  const link = event.target.closest("a");
  if (link) event.preventDefault();
});

const OAUTH_ENDPOINT = "/.netlify/functions/wxcc-oauth";
const WXCC_OAUTH_TOASTS = {
  connected: "Webex Contact Center connected.",
  disconnected: "Webex Contact Center disconnected.",
  denied: "Webex authorization was denied.",
  error: "Webex authorization failed."
};
let wxccOauthPopup = null;
let wxccOauthPoll = null;
let wxccOauthPending = false;

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.hidden = false;
  toast.textContent = message;
  window.setTimeout(() => { toast.hidden = true; }, 4200);
}

function setWxccAuthState(connected) {
  const needed = document.querySelector("#wxcc-auth-needed");
  const ready = document.querySelector("#wxcc-auth-ready");
  const label = document.querySelector("#wxcc-status-label");
  needed.hidden = Boolean(connected);
  ready.hidden = !connected;
  label.textContent = connected ? "Webex on" : "Webex off";
  label.classList.toggle("on", Boolean(connected));
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

function popupFeatures() {
  const width = 520;
  const height = 700;
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
  return `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`;
}

document.querySelector("#wxcc-auth-needed").addEventListener("click", (event) => {
  event.preventDefault();
  if (wxccOauthPopup && !wxccOauthPopup.closed) {
    wxccOauthPopup.focus();
    return;
  }
  const popup = window.open(`${OAUTH_ENDPOINT}?popup=1`, "wxcc-oauth", popupFeatures());
  if (!popup) {
    window.location.assign(OAUTH_ENDPOINT);
    return;
  }
  wxccOauthPopup = popup;
  wxccOauthPending = true;
  window.clearInterval(wxccOauthPoll);
  wxccOauthPoll = window.setInterval(() => {
    if (wxccOauthPopup && !wxccOauthPopup.closed) return;
    window.clearInterval(wxccOauthPoll);
    wxccOauthPopup = null;
    if (!wxccOauthPending) return;
    wxccOauthPending = false;
    refreshWxccAuthState();
  }, 500);
});

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data;
  if (!data || data.type !== "wxcc-oauth") return;
  const status = String(data.status || "");
  if (!WXCC_OAUTH_TOASTS[status]) return;
  wxccOauthPending = false;
  window.clearInterval(wxccOauthPoll);
  if (status === "connected") setWxccAuthState(true);
  if (status === "disconnected" || status === "denied" || status === "error") setWxccAuthState(false);
  showToast(WXCC_OAUTH_TOASTS[status]);
  refreshWxccAuthState();
});

const wxccStatus = new URLSearchParams(window.location.search).get("wxcc");
if (wxccStatus && WXCC_OAUTH_TOASTS[wxccStatus]) {
  showToast(WXCC_OAUTH_TOASTS[wxccStatus]);
  if (wxccStatus === "connected") setWxccAuthState(true);
  if (wxccStatus === "disconnected") setWxccAuthState(false);
  const clean = new URL(window.location.href);
  clean.searchParams.delete("wxcc");
  window.history.replaceState({}, "", clean.pathname + clean.search + clean.hash);
}

refreshWxccAuthState();
window.addEventListener("pageshow", refreshWxccAuthState);
