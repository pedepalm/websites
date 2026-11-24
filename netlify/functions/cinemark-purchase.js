/* Saves the order id on the Airtable Identity row, then forwards the purchase
   to the Webex Connect inbound webhook. AIRTABLE_TOKEN, AIRTABLE_BASE,
   AIRTABLE_ID_TABLE, and CINEMARK_PURCHASE_WEBHOOK stay on the server. */

const PHONE = /^\+[1-9]\d{7,14}$/;
const ORDER_ID = /^\d{7}$/;

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

function cleanSecret(value) {
  let text = String(value || "").replace(/^\uFEFF/, "").trim();
  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }
  if (text.toLowerCase().startsWith("bearer ")) text = text.slice(7).trim();
  return text;
}

function webhookUrl() {
  return cleanSecret(process.env.CINEMARK_PURCHASE_WEBHOOK);
}

async function saveOrderId(phone, orderid) {
  const token = cleanSecret(process.env.AIRTABLE_TOKEN);
  const base = cleanSecret(process.env.AIRTABLE_BASE);
  const table = cleanSecret(process.env.AIRTABLE_ID_TABLE);
  if (!token || !base || !table) {
    return { ok: false, status: 500, error: "Identity table is not configured." };
  }

  const formula = `{phone}='${phone.replace(/'/g, "''")}'`;
  const tableUrl = `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`;
  const lookup = await fetch(`${tableUrl}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  if (!lookup.ok) return { ok: false, status: 502, error: "Could not save the order." };

  const data = await lookup.json();
  const record = Array.isArray(data.records) && data.records.length ? data.records[0] : null;
  const recordId = record && /^rec[A-Za-z0-9]{14}$/.test(record.id) ? record.id : "";
  if (!recordId) return { ok: false, status: 404, error: "Could not save the order." };

  const update = await fetch(tableUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: [{ id: recordId, fields: { orderid } }]
    })
  });
  if (!update.ok) return { ok: false, status: 502, error: "Could not save the order." };
  return { ok: true };
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
    const privEventInterest = payload.privEventInterest === "yes" ? "yes" : "no";
    const orderid = String(payload.orderid || "").trim();
    const abcuserid = String(payload.abcuserid || "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 200);
    if (!PHONE.test(phone)) return json(400, { error: "Select a phone number." });
    if (!movieName) return json(400, { error: "Movie name is missing." });
    if (!ORDER_ID.test(orderid)) return json(400, { error: "Order id is missing." });

    const saved = await saveOrderId(phone, orderid);
    if (!saved.ok) return json(saved.status, { error: saved.error });

    const response = await fetch(hook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ phone, movieName, privEventInterest, orderid, abcuserid, ...PURCHASE_DETAILS }).replace(/:(17\.5|25\.5)([,}])/g, (_, amount, end) => `:${amount}0${end}`)
    });
    if (!response.ok) return json(502, { error: "Could not send the purchase." });
    return json(200, { ok: true });
  } catch {
    return json(502, { error: "Could not send the purchase." });
  }
};
