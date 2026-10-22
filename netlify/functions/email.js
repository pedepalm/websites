/* Forwards a service-desk email thread to the Webex Connect inbound webhook. */
const EMAIL_HOOK = "https://hooks.us.webexconnect.io/events/K22XV81ZQU";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204 };
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON." });
  }

  const customerEmail = String(payload.customerEmail || "").trim();
  const emailSubject = String(payload.emailSubject || "").trim().slice(0, 60);
  const reasonForCalling = String(payload.reasonForCalling || "").trim();
  const message = String(payload.message || "").trim().slice(0, 800);

  if (!EMAIL.test(customerEmail)) return json(400, { error: "Enter a valid email address." });
  if (!emailSubject) return json(400, { error: "Enter an email subject." });
  if (reasonForCalling !== "IT" && reasonForCalling !== "Human Resources") {
    return json(400, { error: "Choose Technical Support or Human Resources." });
  }
  if (!message) return json(400, { error: "Enter a message." });

  try {
    const response = await fetch(EMAIL_HOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        customerEmail,
        emailSubject,
        reasonForCalling,
        message
      })
    });
    if (!response.ok) {
      return json(502, { error: "Could not start the email thread." });
    }
    return json(200, { ok: true });
  } catch {
    return json(502, { error: "Could not start the email thread." });
  }
};
