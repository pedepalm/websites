const { resolveAccessToken } = require("../lib/wxcc-session");

const JOURNEY_URL = "https://api.wxcc-us1.cisco.com/publish/v1/api/event?workspaceId=6943034cbd0c8a694273e705";
const EMPLOYEE_ID = /^\d{5}$/;

function header(event, name) {
  const headers = event.headers || {};
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  const value = match ? headers[match] : "";
  return Array.isArray(value) ? value.join("; ") : value;
}

async function authorizationHeader(event) {
  const headerValue = header(event, "authorization");
  if (headerValue) return headerValue;
  const token = await resolveAccessToken(event);
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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    const { randomBytes } = require("crypto");
    bytes.set(randomBytes(16));
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function cleanText(value, max) {
  return String(value || "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, max || 80);
}

function journeyPayload(action, user, extras) {
  const employeeId = user.employeeId;
  const first = user.fname;
  const last = user.lname;
  const base = {
    id: newEventId(),
    specversion: "1.0",
    type: "Web",
    source: "SvcDeskWebpage",
    identity: employeeId,
    identitytype: "customerId",
    datacontenttype: "application/json"
  };

  if (action === "login" || action === "logout") {
    const isLogout = action === "logout";
    return {
      ...base,
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

  if (action === "product") {
    const product = cleanText(extras.product, 80);
    if (!product) return null;
    return {
      ...base,
      data: {
        uiData: {
          title: "Product Interest",
          iconType: "mouse-cursor-bold",
          subTitle: `${first} ${last} might like product - ${product}`,
          filterTags: ["Product", product]
        }
      }
    };
  }

  if (action === "immediate") {
    const number = cleanText(extras.number, 20);
    if (!number) return null;
    return {
      ...base,
      data: {
        Number: number,
        uiData: {
          title: "Immediate Callback",
          iconType: "calendar-day-bold",
          subTitle: `${first} ${last} initiated an immediate callback`,
          filterTags: ["Callback", "Immediate"]
        }
      }
    };
  }

  const scheduledCopy = {
    scheduled: {
      title: "Scheduled Callback",
      subTitle: `${first} ${last} scheduled a callback`,
      filterTags: ["Callback", "Scheduled"]
    },
    cancelled: {
      title: "Cancelled Scheduled Callback",
      subTitle: `${first} ${last} cancelled a scheduled callback`,
      filterTags: ["Callback", "Scheduled", "Cancelled"]
    },
    modified: {
      title: "Modified Scheduled Callback",
      subTitle: `${first} ${last} modified a scheduled callback`,
      filterTags: ["Callback", "Scheduled", "Modified"]
    }
  }[action];

  if (scheduledCopy) {
    const number = cleanText(extras.number, 20);
    const date = cleanText(extras.date, 32);
    const startTime = cleanText(extras.startTime, 16);
    const endTime = cleanText(extras.endTime, 16);
    if (!number || !date || !startTime || !endTime) return null;
    return {
      ...base,
      data: {
        Number: number,
        Date: date,
        "Start Time": startTime,
        "End Time": endTime,
        uiData: {
          title: scheduledCopy.title,
          iconType: "calendar-day-bold",
          subTitle: scheduledCopy.subTitle,
          filterTags: scheduledCopy.filterTags
        }
      }
    };
  }

  return null;
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
    const extras = {
      product: payload.product,
      number: payload.number,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime
    };

    const user = {
      employeeId: String(payload.employeeId || "").trim(),
      fname: String(payload.fname || "").trim(),
      lname: String(payload.lname || "").trim()
    };
    if (!EMPLOYEE_ID.test(user.employeeId)) {
      return json(400, { error: "Missing employee id." });
    }

    const eventBody = journeyPayload(action, user, extras);
    if (!eventBody) {
      return json(400, { error: "Unsupported journey action." });
    }

    const response = await fetch(JOURNEY_URL, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(eventBody)
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
