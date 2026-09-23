const WXCC_TASKS = "https://api.wxcc-us1.cisco.com/v1/tasks";
const ORG_ID = "d06af121-6f1c-4724-822e-f602a2748cb9";
const WXCC_SCHEDULED = `https://api.wxcc-us1.cisco.com/v1/callbacks/organization/${ORG_ID}/scheduled-callback`;

function header(event, name) {
  const headers = event.headers || {};
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return match ? headers[match] : "";
}

function query(event, name) {
  const params = event.queryStringParameters || {};
  return params[name] || "";
}

function cookieValue(event, name) {
  const raw = header(event, "cookie");
  if (!raw) return "";
  const parts = raw.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function authorizationHeader(event) {
  const headerValue = header(event, "authorization");
  if (headerValue) return headerValue;
  const token = cookieValue(event, "wxcc_at");
  return token ? `Bearer ${token}` : "";
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204 };
  }

  const callbackType = header(event, "x-callback-type").toLowerCase();
  const isScheduled = callbackType === "scheduled";

  if (event.httpMethod === "GET" && !isScheduled) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, service: "wxcc-tasks-proxy" })
    };
  }

  const authorization = authorizationHeader(event);
  if (!authorization) {
    return { statusCode: 401, body: JSON.stringify({ error: "Connect Webex Contact Center first." }) };
  }

  let upstream = WXCC_TASKS;
  let method = event.httpMethod;
  let body = event.body || "{}";

  if (isScheduled) {
    if (method === "GET") {
      const callbackNumber = query(event, "callbackNumber");
      const search = new URLSearchParams();
      if (callbackNumber) search.set("callbackNumber", callbackNumber);
      upstream = `${WXCC_SCHEDULED}?${search.toString()}`;
      body = undefined;
    } else if (method === "DELETE") {
      const id = query(event, "id");
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing callback id" }) };
      }
      upstream = `${WXCC_SCHEDULED}/${encodeURIComponent(id)}`;
      body = undefined;
    } else if (method === "POST") {
      upstream = WXCC_SCHEDULED;
    } else if (method === "PUT") {
      const id = query(event, "id");
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing callback id" }) };
      }
      upstream = `${WXCC_SCHEDULED}/${encodeURIComponent(id)}`;
    } else {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }
  } else if (method !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const headers = {
      Authorization: authorization,
      Accept: "application/json"
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(upstream, {
      method,
      headers,
      body
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
