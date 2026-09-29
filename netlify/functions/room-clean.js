exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin(event.headers.origin || event.headers.Origin),
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, headers, { error: "Use POST." });
  }

  const destination = process.env.WEBEX_CONNECT_EVENT_URL;
  if (!destination) {
    return json(500, headers, { error: "WEBEX_CONNECT_EVENT_URL is not configured." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "");
  } catch (_error) {
    return json(400, headers, { error: "Body must be JSON." });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json(400, headers, { error: "Body must be a JSON object." });
  }

  const response = await fetch(destination, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return {
    statusCode: response.status,
    headers,
    body: await response.text(),
  };
};

function allowedOrigin(origin) {
  if (!origin) return "*";
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" || url.hostname === "localhost") return origin;
  } catch (_error) {
    return "*";
  }
  return "*";
}

function json(statusCode, headers, body) {
  return {
    statusCode,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
