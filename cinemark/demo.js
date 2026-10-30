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

const GENRES = [
  ["Action Movies", "From explosive blockbusters to high-octane thrillers, experience nonstop action.", "https://www.cinemark.com/media/5m0lqukf/actiongenrejohnwicklsmstill.png"],
  ["Animation Movies", "See the latest hits from Disney, Pixar, DreamWorks and more.", "https://www.cinemark.com/media/cc5joczq/smfrozen2animationgenre.jpg"],
  ["Anime Movies", "From Studio Ghibli classics to the latest anime premieres.", "https://www.cinemark.com/media/4egdxs5w/lg-ponyo-still.jpg"],
  ["Classics Movies", "Relive the magic of Cinema’s greatest moments.", "https://www.cinemark.com/media/75969718/sm_still_woz_2.jpg"],
  ["Comedy Movies", "From witty banter to outrageous moments, comedy hits are even better on the big screen.", "https://www.cinemark.com/media/u5vfacjm/comedygenrenapoleonsmstill.png"],
  ["Concert Events", "Feel the energy of live music on the big screen.", "https://www.cinemark.com/media/76003554/small-bts-yet-to-come-still.jpg"],
  ["Crime Movies", "Unravel gripping mysteries and high-stakes crime.", "https://www.cinemark.com/media/75968755/01-la-confidential-1250.jpg"],
  ["Documentary Movies", "Explore real stories, bold perspectives, and eye-opening journeys.", "https://www.cinemark.com/media/75980720/truman__tennessee_an_intimate_conversation_still_small.jpg"],
  ["Drama Movies", "Experience powerful performances and unforgettable stories.", "https://www.cinemark.com/media/75993194/downton_abbey_une_nouvelle_ere_vod_small.jpg"],
  ["Fantasy Movies", "Explore new war movies playing now and upcoming releases coming soon.", "https://www.cinemark.com/media/75971603/03-lord-of-the-rings-1250.jpg"],
  ["Fathom Events", "Fathom brings unforgettable experiences to the big screen.", "https://www.cinemark.com/media/j4xpi3aa/fathomentertainments.jpg"],
  ["Faith Movies", "Watch inspiring faith-based films to the big screen.", "https://www.cinemark.com/media/bfrlpewy/sm-thechosen1-still-2.jpg"],
  ["Family & Kids Movies", "Make movie night magical with fun for all ages.", "https://www.cinemark.com/media/lfrjw2dn/lgliloandstitchstill2.jpg"],
  ["Horror Movies", "New horror movies bring gripping plots, shocking twists, and unforgettable scares.", "https://www.cinemark.com/media/75988002/scream_still_small.jpg"],
  ["Indian Movies", "Vibrant stories. Unforgettable music. Big-screen magic.", "https://www.cinemark.com/media/oxdpx4fh/pushpa_2_the_rule_still_small.jpg"],
  ["Musical Movies", "Musical movies are best experienced on the big screen.", "https://www.cinemark.com/media/75976984/400-pwp-musicals-banner.jpg"],
  ["Romance Movies", "From first kisses to forever moments—see love stories unfold on the big screen.", "https://www.cinemark.com/media/3zafhoua/romancegenrethenotebooksmstill.png"],
  ["Science Fiction Movies", "From dystopian futures to interstellar odysseys, discover the latest sci-fi release.", "https://www.cinemark.com/media/3tsnjzxr/scifigenrealiensmstill.png"],
  ["Películas subtituladas en español", "¡Ve muchas películas nuevas dobladas EN ESPAÑOL!", "https://www.cinemark.com/media/lgwb1rur/sm-radical-still.jpg"],
  ["Sports Movies & Events", "Witness powerful stories of grit, glory, and comeback victories.", "https://www.cinemark.com/media/75969657/lg_still_rocky_2.jpg"],
  ["Thriller Movies", "Uncover twists and tension with the latest thrillers.", "https://www.cinemark.com/media/75996721/jaws_3d_vod_small.jpg"],
  ["Western Movies", "Step into the frontier with the newest Western movies.", "https://www.cinemark.com/media/cpypqqep/00-horizon-kevin-costner-hero.jpg"],
  ["War Movies", "Explore new war movies playing now and upcoming releases coming soon.", "https://www.cinemark.com/media/75963884/lg_still_1917.jpg"],
  ["Foreign Movies", "Find foreign films now playing in theaters near you.", "https://www.cinemark.com/media/75964447/lg_still_parasite_2.jpg"]
];

const genreGrid = document.querySelector("#genre-grid");
if (genreGrid) genreGrid.innerHTML = GENRES.map(([title, blurb, image]) => `
  <article class="genre-card">
    <img src="${image}" alt="">
    <div>
      <h3>${title}</h3>
      <p>${blurb}</p>
      <span class="more">Learn More</span>
    </div>
  </article>
`).join("");

const scroller = document.querySelector("#scroller");
if (scroller) scroller.innerHTML = MOVIES.map(([title, poster, advance]) => {
  const href = `movie.html?title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}`;
  return `
  <article class="card${advance ? " has-advance" : ""}">
    <div class="advance"${advance ? "" : " hidden"}>Advance Tickets</div>
    <a class="movie-open" href="${href}">
      <div class="poster">
        <img class="art" src="${poster}" alt="">
        <img class="play" src="https://www.cinemark.com/images/videoOverlay.png" alt="">
        <span class="heart" aria-hidden="true">♡</span>
      </div>
      <p class="title">${title}</p>
    </a>
  </article>
`;
}).join("");

const showdates = document.querySelector("#showdates");
if (showdates) {
  const dayNames = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  showdates.innerHTML = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const pretty = `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    const label = offset === 0
      ? `<span class="showdate-day">Today</span>`
      : `<span class="showdate-day">${dayNames[date.getDay()]}</span><span class="showdate-date">${date.getMonth() + 1}/${date.getDate()}</span>`;
    return `<button type="button" class="showdate${offset === 0 ? " on" : ""}" data-date="${pretty}">${label}</button>`;
  }).join("");
  showdates.addEventListener("click", (event) => {
    const chip = event.target.closest(".showdate");
    if (!chip) return;
    showdates.querySelectorAll(".showdate").forEach((el) => el.classList.remove("on"));
    chip.classList.add("on");
  });
}

const seatTitle = document.querySelector("#seat-title");
if (seatTitle) {
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title") || "Clayface";
  const rating = params.get("rating") || "R";
  const showtime = params.get("showtime") || "";
  seatTitle.textContent = title;
  const ratingEl = document.querySelector("#seat-rating");
  const timeEl = document.querySelector("#seat-time");
  if (ratingEl) ratingEl.textContent = rating;
  if (timeEl) timeEl.textContent = showtime;
  document.title = `${title} Seats`;
}

document.querySelector(".add-cart")?.addEventListener("click", () => {
  const params = new URLSearchParams(window.location.search);
  const next = new URLSearchParams({
    title: params.get("title") || "Clayface",
    poster: params.get("poster") || "https://www.cinemark.com/media/x4tfvaaf/mdclayfaceposter.jpg",
    date: params.get("date") || "",
    time: params.get("time") || ""
  });
  window.location.href = `checkout.html?${next.toString()}`;
});

const checkoutTitle = document.querySelector("#checkout-title");
if (checkoutTitle) {
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title") || "Clayface";
  checkoutTitle.textContent = title;
  document.title = `${title} Checkout`;
  const poster = document.querySelector("#checkout-poster");
  if (poster) {
    poster.src = params.get("poster") || "https://www.cinemark.com/media/x4tfvaaf/mdclayfaceposter.jpg";
    poster.alt = `${title} poster`;
  }
  const dateEl = document.querySelector("#checkout-date");
  const timeEl = document.querySelector("#checkout-time");
  if (dateEl) dateEl.textContent = params.get("date") || "";
  if (timeEl) timeEl.textContent = params.get("time") || "";
  document.querySelector("#guest-checkout")?.addEventListener("click", () => {
    const fields = document.querySelector("#guest-fields");
    if (fields) fields.hidden = false;
  });

  const phoneInput = document.querySelector("#phone");
  const phoneList = document.querySelector("#phone-list");
  const openPhoneList = () => {
    if (phoneList) phoneList.hidden = false;
  };
  phoneInput?.addEventListener("focus", openPhoneList);
  phoneInput?.addEventListener("click", openPhoneList);
  phoneList?.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-phone]");
    if (!choice || !phoneInput) return;
    phoneInput.value = choice.getAttribute("data-phone") || "";
    phoneList.hidden = true;
  });
  document.addEventListener("click", (event) => {
    if (!phoneList || event.target.closest(".phone-pick")) return;
    phoneList.hidden = true;
  });

  document.querySelector(".btn-complete")?.addEventListener("click", async () => {
    const phone = phoneInput?.value.trim() || "";
    const movieName = checkoutTitle.textContent.trim();
    if (!phone) {
      showToast("Select a phone number.");
      return;
    }
    try {
      const response = await fetch("/.netlify/functions/cinemark-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          movieName,
          currentSeat1: "E11",
          currentSeat2: "E12",
          currentSeat3: "E13",
          currentSeat4: "E14",
          costCurrentSeat1: 17.5,
          costCurrentSeat2: 17.5,
          costCurrentSeat3: 17.5,
          costCurrentSeat4: 17.5,
          dboxSeat1: "C8",
          dboxSeat2: "C9",
          dboxSeat3: "C10",
          dboxSeat4: "C11",
          costDboxSeat1: 25.5,
          costDboxSeat2: 25.5,
          costDboxSeat3: 25.5,
          costDboxSeat4: 25.5
        }).replace(/:(17\.5|25\.5)([,}])/g, (_, amount, end) => `:${amount}0${end}`)
      });
      if (!response.ok) {
        showToast("Purchase could not be sent.");
        return;
      }
      showToast("Purchase sent.");
    } catch {
      showToast("Purchase could not be sent.");
    }
  });
}

const movieName = document.querySelector("#movie-name");
if (movieName) {
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title") || "Clayface";
  const poster = params.get("poster") || "https://www.cinemark.com/media/x4tfvaaf/mdclayfaceposter.jpg";
  movieName.textContent = title;
  document.title = `${title} Showtimes & Tickets`;
  const image = document.querySelector("#movie-poster");
  if (image) {
    image.src = poster;
    image.alt = `${title} poster`;
  }
}

function scrollByCard(direction) {
  const card = scroller.querySelector(".card");
  const amount = (card ? card.getBoundingClientRect().width + 16 : 236) * 2;
  scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
}
document.querySelector("#prev")?.addEventListener("click", () => scrollByCard(-1));
document.querySelector("#next")?.addEventListener("click", () => scrollByCard(1));

document.addEventListener("click", (event) => {
  const showtimeLink = event.target.closest(".times a");
  if (showtimeLink) {
    const title = document.querySelector("#movie-name")?.textContent.trim() || "Clayface";
    const rating = document.querySelector("#movie-rating")?.textContent.trim() || "R";
    const time = showtimeLink.textContent.trim();
    const selected = document.querySelector("#showdates .showdate.on");
    const day = selected?.querySelector(".showdate-day")?.textContent.trim() || "Today";
    const date = selected?.querySelector(".showdate-date")?.textContent.trim() || "";
    const when = date ? `${day} ${date}` : day;
    const theater = showtimeLink.closest(".theatre-block")?.querySelector("h3")?.textContent.replace("›", "").replace(/\s+/g, " ").trim() || "";
    const poster = document.querySelector("#movie-poster")?.getAttribute("src") || "https://www.cinemark.com/media/x4tfvaaf/mdclayfaceposter.jpg";
    const params = new URLSearchParams({
      title,
      rating,
      poster,
      date: selected?.getAttribute("data-date") || "",
      time,
      showtime: [theater, when, time].filter(Boolean).join(" · ")
    });
    showtimeLink.href = `seats.html?${params.toString()}`;
    return;
  }
  if (event.target.closest(".wxcc-dock, .edge, .movie-open, .logo-home, .nav-private")) return;
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
