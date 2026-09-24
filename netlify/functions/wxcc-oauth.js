const {
  COOKIE_TOKEN,
  newSessionId,
  saveSession,
  deleteAccessToken,
  resolveAccessToken,
  cookieValue,
  looksLikeJwt
} = require("../lib/wxcc-session");

const AUTHORIZE = "https://webexapis.com/v1/authorize";
const TOKEN = "https://webexapis.com/v1/access_token";
const DEFAULT_SCOPES = "cjp:user cjp:config cjp:config_read cjp:config_write";
const HOME = "/svcdesk/";
const COOKIE_STATE = "wxcc_oauth_state";
const COOKIE_POPUP = "wxcc_popup";
const SESSION_COOKIE_AGE = 7776000;
const POPUP_STATUSES = new Set(["connected", "error", "disconnected", "denied"]);

function header(event, name) {
  const headers = event.headers || {};
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return match ? headers[match] : "";
}

function query(event, name) {
  return (event.queryStringParameters || {})[name] || "";
}

function cleanSecret(value) {
  let text = String(value || "").replace(/^\uFEFF/, "").trim();
  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }
  return text;
}

async function isConnected(event) {
  return Boolean(await resolveAccessToken(event));
}

function redirectUri(event) {
  const configured = cleanSecret(process.env.WXCC_REDIRECT_URI);
  if (configured) return configured;
  const host = header(event, "x-forwarded-host") || header(event, "host");
  const proto = header(event, "x-forwarded-proto") || "https";
  return `${proto}://${host}/.netlify/functions/wxcc-oauth`;
}

function setCookie(name, value, maxAge) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax"
  ];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function cookieList(cookies) {
  if (!cookies) return [];
  return (Array.isArray(cookies) ? cookies : [cookies]).filter(Boolean);
}

function withCookies(headers, cookies) {
  const list = cookieList(cookies);
  if (list.length <= 1) {
    const next = { ...headers };
    if (list[0]) next["Set-Cookie"] = list[0];
    return { headers: next };
  }
  return {
    headers,
    multiValueHeaders: { "Set-Cookie": list }
  };
}

function redirect(location, cookies) {
  return {
    statusCode: 302,
    ...withCookies({ Location: location }, cookies),
    body: ""
  };
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function wantsPopup(event, state) {
  const returned = state || query(event, "state");
  return query(event, "popup") === "1"
    || cookieValue(event, COOKIE_POPUP) === "1"
    || String(returned).endsWith(".p");
}

function popupPage(status, cookies) {
  const safe = POPUP_STATUSES.has(status) ? status : "error";
  const payload = JSON.stringify({ type: "wxcc-oauth", status: safe });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Webex authorization</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1b2430; }
  a { color: #0b5cab; }
</style>
</head>
<body>
<p>Authorization finished. You can close this window.</p>
<p><a href="${HOME}" id="wxcc-oauth-close">Close this window</a></p>
<script>
(function () {
  var payload = ${payload};
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
    }
  } catch (err) {}
  window.setTimeout(function () {
    try { window.close(); } catch (err) {}
  }, 50);
  var link = document.getElementById("wxcc-oauth-close");
  if (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      try { window.close(); } catch (err) {}
    });
  }
})();
</script>
</body>
</html>`;
  return {
    statusCode: 200,
    ...withCookies({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }, cookies),
    body: html
  };
}

function finish(event, status, cookies, state) {
  const list = cookieList(cookies);
  list.push(clearCookie(COOKIE_POPUP));
  if (wantsPopup(event, state)) {
    return popupPage(status, list);
  }
  return redirect(`${HOME}?wxcc=${status}`, list);
}

async function handle(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204 };
  }
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  if (query(event, "status") === "1") {
    const connected = await isConnected(event);
    const sessionId = cookieValue(event, COOKIE_TOKEN);
    if (connected && sessionId && !looksLikeJwt(sessionId)) {
      return {
        statusCode: 200,
        ...withCookies(
          { "Content-Type": "application/json" },
          setCookie(COOKIE_TOKEN, sessionId, SESSION_COOKIE_AGE)
        ),
        body: JSON.stringify({ connected })
      };
    }
    return json(200, { connected });
  }

  if (query(event, "logout") === "1") {
    await deleteAccessToken(event, cookieValue(event, COOKIE_TOKEN));
    return redirect(`${HOME}?wxcc=disconnected`, [
      clearCookie(COOKIE_TOKEN),
      clearCookie(COOKIE_POPUP)
    ]);
  }

  const clientId = cleanSecret(process.env.WXCC_CLIENT_ID);
  const clientSecret = cleanSecret(process.env.WXCC_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    return finish(event, "error", clearCookie(COOKIE_STATE));
  }

  const code = query(event, "code");
  const oauthError = query(event, "error");
  if (oauthError) {
    return finish(event, "denied", clearCookie(COOKIE_STATE));
  }

  const uri = redirectUri(event);

  if (!code) {
    const popup = query(event, "popup") === "1";
    const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const state = popup ? `${nonce}.p` : nonce;
    const authorize = new URL(AUTHORIZE);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", uri);
    authorize.searchParams.set("scope", process.env.WXCC_SCOPES || DEFAULT_SCOPES);
    authorize.searchParams.set("state", state);
    return redirect(authorize.toString(), [
      setCookie(COOKIE_STATE, state, 600),
      popup ? setCookie(COOKIE_POPUP, "1", 600) : clearCookie(COOKIE_POPUP)
    ]);
  }

  const expectedState = cookieValue(event, COOKIE_STATE);
  const returnedState = query(event, "state");
  if (!expectedState || !returnedState || expectedState !== returnedState) {
    return finish(event, "error", clearCookie(COOKIE_STATE), returnedState);
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: uri
    });
    const response = await fetch(TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: body.toString()
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) {
      return finish(event, "error", clearCookie(COOKIE_STATE), returnedState);
    }
    const sessionId = newSessionId();
    const saved = await saveSession(event, sessionId, data);
    if (!saved) {
      return finish(event, "error", clearCookie(COOKIE_STATE), returnedState);
    }
    const maxAge = Math.max(SESSION_COOKIE_AGE, Number(data.refresh_token_expires_in) || 0);
    return finish(event, "connected", [
      setCookie(COOKIE_TOKEN, sessionId, maxAge),
      clearCookie(COOKIE_STATE)
    ], returnedState);
  } catch {
    return finish(event, "error", clearCookie(COOKIE_STATE), returnedState);
  }
}

exports.handler = async (event) => {
  try {
    return await handle(event);
  } catch {
    return finish(event, "error");
  }
};
