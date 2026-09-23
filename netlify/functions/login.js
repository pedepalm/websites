const EMPLOYEE_ID = /^\d{5}$/;
const AIRTABLE_BASE = "appgAU3E3SIB5Ma7l";
const AIRTABLE_TABLE = "tbllwB3xBNiY1Hre2";

function cleanSecret(value) {
  let text = String(value || "").replace(/^\uFEFF/, "").trim();
  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }
  if (text.toLowerCase().startsWith("bearer ")) {
    text = text.slice(7).trim();
  }
  return text;
}

function field(fields, names) {
  for (const name of names) {
    if (fields[name] !== undefined && fields[name] !== null && String(fields[name]).trim() !== "") {
      return String(fields[name]).trim();
    }
  }
  return "";
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204 };
  }

  if (event.httpMethod === "GET") {
    const token = cleanSecret(process.env.AIRTABLE_TOKEN);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        configured: Boolean(token),
        tokenLength: token.length
      })
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = cleanSecret(process.env.AIRTABLE_TOKEN);
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Login Failed" }) };
  }

  let employeeId = "";
  try {
    const payload = JSON.parse(event.body || "{}");
    employeeId = String(payload.employeeId || payload.userId || "").trim();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Login Failed" }) };
  }

  if (!EMPLOYEE_ID.test(employeeId)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Enter a 5-digit User ID." }) };
  }

  const formula = `employeeid='${employeeId}'`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/?filterByFormula=${encodeURIComponent(formula)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Login Failed",
          airtableStatus: response.status
        })
      };
    }
    const record = Array.isArray(data.records) && data.records.length > 0 ? data.records[0] : null;
    if (!record) {
      return { statusCode: 401, body: JSON.stringify({ error: "Login Failed" }) };
    }
    const fields = record.fields || {};
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: field(fields, ["employeeid", "employeeId"]) || employeeId,
        fname: field(fields, ["fname"]),
        lname: field(fields, ["lname"]),
        phone: field(fields, ["phone", "Phone"])
      })
    };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "Login Failed", airtableStatus: 0 }) };
  }
};
