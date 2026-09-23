function tokenStore() {
  try {
    const { getStore } = require("@netlify/blobs");
    return getStore("wxcc-tokens");
  } catch {
    return null;
  }
}

function newSessionId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

async function saveAccessToken(sessionId, token) {
  const store = tokenStore();
  if (!store || !sessionId || !token) return false;
  await store.set(sessionId, token);
  return true;
}

async function loadAccessToken(sessionId) {
  const store = tokenStore();
  if (!store || !sessionId) return "";
  try {
    return (await store.get(sessionId)) || "";
  } catch {
    return "";
  }
}

async function deleteAccessToken(sessionId) {
  const store = tokenStore();
  if (!store || !sessionId) return;
  try {
    await store.delete(sessionId);
  } catch {
    // ignore missing keys
  }
}

function looksLikeJwt(value) {
  return String(value || "").split(".").length === 3 && String(value).length > 80;
}

module.exports = {
  newSessionId,
  saveAccessToken,
  loadAccessToken,
  deleteAccessToken,
  looksLikeJwt
};
