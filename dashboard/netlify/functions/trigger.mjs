// GET  -> { configured }   POST {secret, confirm:"RUN"} -> forwards to HARVEST_TRIGGER_URL
const json = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export default async (req) => {
  const url = process.env.HARVEST_TRIGGER_URL, secret = process.env.HARVEST_TRIGGER_SECRET;
  const configured = Boolean(url && secret);
  if (req.method === "GET") return json(200, { configured });
  if (req.method !== "POST") return json(405, { error: "method not allowed" });
  if (!configured) return json(503, { error: "Trigger not configured (set HARVEST_TRIGGER_URL and HARVEST_TRIGGER_SECRET)." });
  let b = {}; try { b = await req.json(); } catch {}
  if (b.confirm !== "RUN") return json(400, { error: "Type RUN to confirm." });
  if (typeof b.secret !== "string" || b.secret !== secret) return json(401, { error: "Wrong shared secret." });
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-harvest-secret": secret },
      body: JSON.stringify({ project: "harvest-playground", action: "harvest", source: "harvest-dashboard", requestedAt: new Date().toISOString() }) });
    return json(r.ok ? 202 : 502, { ok: r.ok, upstreamStatus: r.status });
  } catch (e) { return json(502, { error: "Webhook unreachable" }); }
};
