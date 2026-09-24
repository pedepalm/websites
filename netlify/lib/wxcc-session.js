const TOKEN_URL = "https://webexapis.com/v1/access_token";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_TOKEN = "wxcc_at";

function tokenStore(event) {
  try {
    const { getStore, connectLambda } = require("@netlify/blobs");
    if (event && typeof connectLambda === "function") {
      try {
        connectLambda(event);
      } catch {
        // already initialized for this invocation
      }
    }
    return getStore("wxcc-tokens");
  } catch {
    return null;
  }
}

function newSessionId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function looksLikeJwt(value) {
  return String(value || "").split(".").length === 3 && String(value).length > 80;
}

function header(event, name) {
  const headers = (event && event.headers) || {};
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  const value = match ? headers[match] : "";
  return Array.isArray(value) ? value.join("; ") : value;
}

function cookieValue(event, name) {
  const raw = header(event, "cookie");
  if (!raw) return "";
  const parts = String(raw).split(";");
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

function parseRecord(raw) {
  if (!raw) return null;
  if (typeof raw === "object" && raw.access_token) return raw;
  const text = String(raw);
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.access_token) return parsed;
  } catch {
    // legacy blob value was the raw access token
  }
  if (text) return { access_token: text, refresh_token: "", expires_at: 0, refreshed_at: 0 };
  return null;
}

function recordFromTokenResponse(data, previous) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || previous?.refresh_token || "",
    expires_at: Date.now() + (Number(data.expires_in) || 43200) * 1000,
    refreshed_at: Date.now()
  };
}

async function saveSession(event, sessionId, data, previous) {
  const store = tokenStore(event);
  if (!store || !sessionId || !data?.access_token) return false;
  await store.set(sessionId, JSON.stringify(recordFromTokenResponse(data, previous)));
  return true;
}

async function loadRecord(event, sessionId) {
  const store = tokenStore(event);
  if (!store || !sessionId) return null;
  try {
    return parseRecord(await store.get(sessionId));
  } catch {
    return null;
  }
}

async function deleteAccessToken(event, sessionId) {
  const store = tokenStore(event);
  if (!store || !sessionId) return;
  try {
    await store.delete(sessionId);
  } catch {
    // ignore missing keys
  }
}

async function refreshRecord(event, sessionId, record) {
  const refreshToken = record?.refresh_token;
  const clientId = cleanSecret(process.env.WXCC_CLIENT_ID);
  const clientSecret = cleanSecret(process.env.WXCC_CLIENT_SECRET);
  if (!refreshToken || !clientId || !clientSecret) return record || null;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    }).toString()
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) return record || null;
  await saveSession(event, sessionId, data, record);
  return recordFromTokenResponse(data, record);
}

function needsRefresh(record) {
  if (!record?.access_token) return Boolean(record?.refresh_token);
  if (record.expires_at && Date.now() > record.expires_at - 60 * 1000) return true;
  if (record.refreshed_at && Date.now() - record.refreshed_at > WEEK_MS) return true;
  return false;
}

async function resolveAccessToken(event) {
  const raw = cookieValue(event, COOKIE_TOKEN);
  if (!raw) return "";
  if (looksLikeJwt(raw)) return raw;
  let record = await loadRecord(event, raw);
  if (!record) return "";
  if (needsRefresh(record)) {
    try {
      record = await refreshRecord(event, raw, record);
    } catch {
      // keep the current access token if refresh fails
    }
  }
  return record?.access_token || "";
}

async function saveAccessToken(event, sessionId, token) {
  return saveSession(event, sessionId, { access_token: token });
}

async function loadAccessToken(event, sessionId) {
  const record = await loadRecord(event, sessionId);
  return record?.access_token || "";
}

module.exports = {
  COOKIE_TOKEN,
  newSessionId,
  saveSession,
  saveAccessToken,
  loadAccessToken,
  loadRecord,
  deleteAccessToken,
  resolveAccessToken,
  looksLikeJwt,
  cookieValue
};
