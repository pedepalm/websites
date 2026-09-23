const WXCC_TASKS = "https://api.wxcc-us1.cisco.com/v1/tasks";
const ORG_ID = "d06af121-6f1c-4724-822e-f602a2748cb9";
const WXCC_SCHEDULED = `https://api.wxcc-us1.cisco.com/v1/callbacks/organization/${ORG_ID}/scheduled-callback`;

function header(event, name) {
  const headers = event.headers || {};
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return match ? headers[match] : "";
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204 };
  }

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, service: "wxcc-tasks-proxy" })
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const authorization = header(event, "authorization");
  if (!authorization) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing Authorization header" }) };
  }

  const callbackType = header(event, "x-callback-type").toLowerCase();
  const upstream = callbackType === "scheduled" ? WXCC_SCHEDULED : WXCC_TASKS;

  try {
    const response = await fetch(upstream, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: event.body || "{}"
    });
    const text = await response.text();
    return {
      statusCode: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
      body: text
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Could not reach the Webex Contact Center API." })
    };
  }
};
