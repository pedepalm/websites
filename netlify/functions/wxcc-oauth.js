const {
  newSessionId,
  saveAccessToken,
  loadAccessToken,
  deleteAccessToken,
  looksLikeJwt
} = require("../lib/wxcc-session");

const AUTHORIZE = "https://webexapis.com/v1/authorize";
const TOKEN = "https://webexapis.com/v1/access_token";
const DEFAULT_SCOPES = "cjp:user cjp:config cjp:config_read cjp:config_write";
const HOME = "/svcdesk/";
const COOKIE_TOKEN = "wxcc_at";
const COOKIE_STATE = "wxcc_oauth_state";

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

function cookieValue(event, name) {
  const raw = header(event, "cookie");
  const text = Array.isArray(raw) ? raw.join("; ") : String(raw || "");
  if (!text) return "";
  const parts = text.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      const value = rest.join("=");
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return "";
}

async function isConnected(event) {
  const raw = cookieValue(event, COOKIE_TOKEN);
  if (!raw) return false;
  if (looksLikeJwt(raw)) return true;
  return Boolean(await loadAccessToken(raw));
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

function redirect(location, cookie) {
  const headers = { Location: location };
  if (Array.isArray(cookie)) cookie = cookie[0];
  if (typeof cookie === "string" && cookie) headers["Set-Cookie"] = cookie;
  return { statusCode: 302, headers, body: "" };
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

async function handle(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204 };
  }
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  if (query(event, "status") === "1") {
    return json(200, { connected: await isConnected(event) });
  }

  if (query(event, "logout") === "1") {
    await deleteAccessToken(cookieValue(event, COOKIE_TOKEN));
    return redirect(`${HOME}?wxcc=disconnected`, clearCookie(COOKIE_TOKEN));
  }

  const clientId = cleanSecret(process.env.WXCC_CLIENT_ID);
  const clientSecret = cleanSecret(process.env.WXCC_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    return redirect(`${HOME}?wxcc=error`);
  }

  const code = query(event, "code");
  const oauthError = query(event, "error");
  if (oauthError) {
    return redirect(`${HOME}?wxcc=denied`);
  }

  const uri = redirectUri(event);

  if (!code) {
    const state = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const authorize = new URL(AUTHORIZE);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", uri);
    authorize.searchParams.set("scope", process.env.WXCC_SCOPES || DEFAULT_SCOPES);
    authorize.searchParams.set("state", state);
    return redirect(authorize.toString(), setCookie(COOKIE_STATE, state, 600));
  }

  const expectedState = cookieValue(event, COOKIE_STATE);
  const returnedState = query(event, "state");
  if (!expectedState || !returnedState || expectedState !== returnedState) {
    return redirect(`${HOME}?wxcc=error`, clearCookie(COOKIE_STATE));
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
      return redirect(`${HOME}?wxcc=error`, clearCookie(COOKIE_STATE));
    }
    const maxAge = Number(data.expires_in) || 43200;
    const sessionId = newSessionId();
    const saved = await saveAccessToken(sessionId, data.access_token);
    const cookieValueToSet = saved ? sessionId : data.access_token;
    return redirect(`${HOME}?wxcc=connected`, setCookie(COOKIE_TOKEN, cookieValueToSet, maxAge));
  } catch {
    return redirect(`${HOME}?wxcc=error`, clearCookie(COOKIE_STATE));
  }
}

exports.handler = async (event) => {
  try {
    return await handle(event);
  } catch {
    return redirect(`${HOME}?wxcc=error`);
  }
};
