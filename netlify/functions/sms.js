/* Starts an SMS thread by posting IT or Human Resources to the Webex Connect webhook. */

const EMPLOYEE_ID = /^\d{5}$/;
const TYPES = new Set(["IT", "Human Resources"]);

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function cleanText(value, max) {
  return String(value || "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, max || 80);
}

function toE164(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length === 10) return `+1${digits}`;
  return "";
}

function webhookUrl() {
  let text = String(process.env.WEBEX_CONNECT_SMS_WEBHOOK || "").replace(/^\uFEFF/, "").trim();
  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }
  return text;
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

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204 };
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const hook = webhookUrl();
    if (!hook) {
      return json(500, { error: "SMS webhook is not configured." });
    }

    const payload = requestBody(event);
    const type = cleanText(payload.type, 32);
    if (!TYPES.has(type)) {
      return json(400, { error: "Choose IT Support or Human Resources Support." });
    }

    const body = {
      routeTo: "svcdesk",
      type,
      source: "sms"
    };
    const employeeId = cleanText(payload.employeeId, 8);
    if (EMPLOYEE_ID.test(employeeId)) {
      body.fname = cleanText(payload.fname, 80);
      body.lname = cleanText(payload.lname, 80);
      body.employeeId = employeeId;
      const phone = toE164(payload.phone);
      if (phone) body.phone = phone;
    }

    const response = await fetch(hook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    if (!response.ok) {
      return json(502, { error: "Could not start the SMS thread." });
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text || JSON.stringify({ ok: true })
    };
  } catch {
    return json(502, { error: "Could not start the SMS thread." });
  }
};
