const { loadAccessToken, looksLikeJwt } = require("../lib/wxcc-session");

const WXCC_TASKS = "https://api.wxcc-us1.cisco.com/v1/tasks";
const ORG_ID = "d06af121-6f1c-4724-822e-f602a2748cb9";
const WXCC_SCHEDULED = `https://api.wxcc-us1.cisco.com/v1/callbacks/organization/${ORG_ID}/scheduled-callback`;

function header(event, name) {
  const headers = event.headers || {};
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  const value = match ? headers[match] : "";
  return Array.isArray(value) ? value.join("; ") : value;
}

function query(event, name) {
  const params = event.queryStringParameters || {};
  return params[name] || "";
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

async function authorizationHeader(event) {
  const headerValue = header(event, "authorization");
  if (headerValue) return headerValue;
  const raw = cookieValue(event, "wxcc_at");
  if (!raw) return "";
  const token = looksLikeJwt(raw) ? raw : (await loadAccessToken(raw));
  return token ? `Bearer ${token}` : "";
}

function requestBody(event) {
  if (event.body == null) return "{}";
  if (event.isBase64Encoded) {
    return Buffer.from(event.body, "base64").toString("utf8") || "{}";
  }
  return event.body || "{}";
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

  const callbackType = String(header(event, "x-callback-type") || "").toLowerCase();
  const isScheduled = callbackType === "scheduled";

  if (event.httpMethod === "GET" && !isScheduled) {
    return json(200, { ok: true, service: "wxcc-tasks-proxy" });
  }

  const authorization = await authorizationHeader(event);
  if (!authorization) {
    return json(401, { error: "Connect Webex Contact Center first." });
  }

  let upstream = WXCC_TASKS;
  let method = event.httpMethod;
  let body = requestBody(event);

  if (isScheduled) {
    if (method === "GET") {
      const callbackNumber = query(event, "callbackNumber");
      const search = new URLSearchParams();
      if (callbackNumber) search.set("callbackNumber", callbackNumber);
      upstream = `${WXCC_SCHEDULED}?${search.toString()}`;
      body = undefined;
    } else if (method === "DELETE") {
      const id = query(event, "id");
      if (!id) return json(400, { error: "Missing callback id" });
      upstream = `${WXCC_SCHEDULED}/${encodeURIComponent(id)}`;
      body = undefined;
    } else if (method === "POST") {
      upstream = WXCC_SCHEDULED;
    } else if (method === "PUT") {
      const id = query(event, "id");
      if (!id) return json(400, { error: "Missing callback id" });
      upstream = `${WXCC_SCHEDULED}/${encodeURIComponent(id)}`;
    } else {
      return json(405, { error: "Method not allowed" });
    }
  } else if (method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const headers = {
    Authorization: authorization,
    Accept: "application/json"
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(upstream, { method, headers, body });
  const text = await response.text();
  return {
    statusCode: response.status,
    headers: { "Content-Type": "application/json" },
    body: text || JSON.stringify({ ok: response.ok })
  };
}

exports.handler = async (event) => {
  try {
    return await handle(event);
  } catch {
    return json(500, { error: "Callback service failed. Disconnect Webex, connect again, and retry." });
  }
};
