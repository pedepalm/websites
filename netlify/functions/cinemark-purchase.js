/* Forwards a Cinemark demo purchase to the Webex Connect inbound webhook.
   The webhook address is read from CINEMARK_PURCHASE_WEBHOOK so it is not stored in source. */

const PHONE = /^\+[1-9]\d{7,14}$/;

const PURCHASE_DETAILS = {
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
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function webhookUrl() {
  let text = String(process.env.CINEMARK_PURCHASE_WEBHOOK || "").replace(/^\uFEFF/, "").trim();
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
    if (!hook) return json(500, { error: "Purchase webhook is not configured." });

    const payload = requestBody(event);
    const phone = String(payload.phone || "").trim();
    const movieName = String(payload.movieName || "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 200);
    if (!PHONE.test(phone)) return json(400, { error: "Select a phone number." });
    if (!movieName) return json(400, { error: "Movie name is missing." });

    const response = await fetch(hook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ phone, movieName, ...PURCHASE_DETAILS }).replace(/:(17\.5|25\.5)([,}])/g, (_, amount, end) => `:${amount}0${end}`)
    });
    if (!response.ok) return json(502, { error: "Could not send the purchase." });
    return json(200, { ok: true });
  } catch {
    return json(502, { error: "Could not send the purchase." });
  }
};
