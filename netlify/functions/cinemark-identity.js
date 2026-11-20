/* Reads abcuserid for a phone from the Airtable identity table.
   AIRTABLE_TOKEN stays on the server. */

const PHONE = /^\+[1-9]\d{7,14}$/;

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

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
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

function fieldText(fields, name) {
  const keys = Object.keys(fields || {});
  const match = keys.find((key) => key.toLowerCase() === name);
  const value = match ? fields[match] : "";
  if (value == null) return "";
  if (Array.isArray(value)) return fieldText({ value: value[0] }, "value");
  if (typeof value === "object") {
    return String(value.name || value.email || value.text || "").trim();
  }
  return String(value).replace(/[\u0000-\u001F]/g, "").trim().slice(0, 200);
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204 };
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const phone = String(requestBody(event).phone || "").trim();
    if (!PHONE.test(phone)) return json(400, { error: "Select a phone number." });

    const token = cleanSecret(process.env.AIRTABLE_TOKEN);
    const base = cleanSecret(process.env.AIRTABLE_BASE);
    const table = cleanSecret(process.env.AIRTABLE_TABLE);
    if (!token || !base || !table) return json(200, { lookupOk: false, abcuserid: "" });

    const formula = `{phone}='${phone.replace(/'/g, "''")}'`;
    const url = `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    if (!response.ok) return json(200, { lookupOk: false, abcuserid: "" });
    const data = await response.json();
    const record = Array.isArray(data.records) && data.records.length ? data.records[0] : null;
    const abcuserid = record ? fieldText(record.fields, "abcuserid") : "";
    return json(200, { lookupOk: true, abcuserid });
  } catch {
    return json(200, { lookupOk: false, abcuserid: "" });
  }
};
