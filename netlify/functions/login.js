const EMPLOYEE_ID = /^\d{5}$/;

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
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const base = process.env.AIRTABLE_BASE;
  const table = process.env.AIRTABLE_TABLE;
  const token = process.env.AIRTABLE_TOKEN;
  if (!base || !table || !token) {
    return { statusCode: 500, body: JSON.stringify({ error: "Login is not configured." }) };
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
  const url = `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(formula)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Login Failed" }) };
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
        employeeId: field(fields, ["employeeId", "employeeid", "Employee ID"]) || employeeId,
        fname: field(fields, ["fname", "First Name", "firstName", "FirstName"]),
        lname: field(fields, ["lname", "Last Name", "lastName", "LastName"])
      })
    };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "Login Failed" }) };
  }
};
