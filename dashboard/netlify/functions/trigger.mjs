// GET  -> { configured }
// POST {secret, confirm:"RUN"} -> POSTs harvest request to HARVEST_TRIGGER_URL with Authorization: HARVEST_WEBHOOK_AUTH
import { createHash, timingSafeEqual } from "node:crypto";
const json = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const digest = (s) => createHash("sha256").update(String(s)).digest();
const safeEqual = (a, b) => timingSafeEqual(digest(a), digest(b)); // equal-length digests -> constant time
const COOLDOWN_MS = 10 * 60 * 1000;
let lastTrigger = 0; // best-effort: only holds within a warm function instance

export default async (req) => {
  const url = process.env.HARVEST_TRIGGER_URL, auth = process.env.HARVEST_WEBHOOK_AUTH, secret = process.env.HARVEST_TRIGGER_SECRET;
  const configured = Boolean(url && auth && secret);
  if (req.method === "GET") return json(200, { configured });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });
  if (!configured) return json(503, { error: "Trigger not configured (HARVEST_TRIGGER_URL, HARVEST_WEBHOOK_AUTH, HARVEST_TRIGGER_SECRET)." });
  let b = {}; try { b = await req.json(); } catch {}
  if (typeof b.secret !== "string" || !safeEqual(b.secret, secret)) return json(401, { error: "Wrong passphrase." });
  if (b.confirm !== "RUN") return json(400, { error: "Type RUN to confirm." });
  const wait = lastTrigger + COOLDOWN_MS - Date.now();
  if (wait > 0) return json(429, { error: `A harvest was just started. Try again in ${Math.ceil(wait / 60000)} min.` });
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: auth },
      body: JSON.stringify({ project: "harvest-playground", action: "harvest", source: "harvest-dashboard", requestedAt: new Date().toISOString() }) });
    if (!r.ok) return json(502, { error: `Harvest webhook rejected the request (HTTP ${r.status}).` });
    lastTrigger = Date.now();
    return json(202, { ok: true, message: "Harvest started — new cycle will appear here when done" });
  } catch { return json(502, { error: "Harvest webhook unreachable." }); }
};
