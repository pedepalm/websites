const { loadAccessToken, looksLikeJwt } = require("../lib/wxcc-session");

const JOURNEY_URL = "https://api.wxcc-us1.cisco.com/publish/v1/api/event?workspaceId=6943034cbd0c8a694273e705";
const EMPLOYEE_ID = /^\d{5}$/;

function header(event, name) {
  const headers = event.headers || {};
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

async function authorizationHeader(event) {
  const headerValue = header(event, "authorization");
  if (headerValue) return headerValue;
  const raw = cookieValue(event, "wxcc_at");
  if (!raw) return "";
  const token = looksLikeJwt(raw) ? raw : (await loadAccessToken(raw));
  return token ? `Bearer ${token}` : "";
}

function requestBody(event) {
  if (event.body == null) return {};
  const text = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function newEventId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function journeyPayload(action, user) {
  const employeeId = user.employeeId;
  const first = user.fname;
  const last = user.lname;
  const isLogout = action === "logout";
  return {
    id: newEventId(),
    specversion: "1.0",
    type: "Web",
    source: "SvcDeskWebpage",
    identity: employeeId,
    identitytype: "customerId",
    datacontenttype: "application/json",
    data: {
      uiData: {
        title: isLogout ? "Svc Desk Logout" : "Svc Desk Login",
        iconType: "sign-in-bold",
        subTitle: isLogout
          ? `${first} ${last} with user ID ${employeeId} Logged off`
          : `${first} ${last} with user ID ${employeeId} Logged On`,
        filterTags: [isLogout ? "Logout" : "Login", "Svc Desk"]
      }
    }
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204 };
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const authorization = await authorizationHeader(event);
    if (!authorization) {
      return json(401, { error: "Connect Webex Contact Center first." });
    }

    const payload = requestBody(event);
    const action = String(payload.action || "").toLowerCase();
    if (action !== "login" && action !== "logout") {
      return json(400, { error: "Unsupported journey action." });
    }

    const user = {
      employeeId: String(payload.employeeId || "").trim(),
      fname: String(payload.fname || "").trim(),
      lname: String(payload.lname || "").trim()
    };
    if (!EMPLOYEE_ID.test(user.employeeId)) {
      return json(400, { error: "Missing employee id." });
    }

    const response = await fetch(JOURNEY_URL, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(journeyPayload(action, user))
    });
    const text = await response.text();
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: text || JSON.stringify({ ok: response.ok })
    };
  } catch {
    return json(502, { error: "Could not publish the journey event." });
  }
};
