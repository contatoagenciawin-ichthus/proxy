// Exact asset allowlist for the Meta Embedded Signup handoff.
// The existing Eduardo route is immutable here; Ichthus stays disabled until
// its CRM receiver and protected environment configuration are approved.
export const EDUARDO_ASSET = Object.freeze({
  wabaId: "269938242876600",
  phoneNumberId: "280401731826708",
  handoffUrl: "https://eduardobrasil.fonsecabrasilserrao.com/api/whatsapp/meta/credentials",
});

export const ICHTHUS_ASSET = Object.freeze({
  wabaId: "107697061976892",
  phoneNumberId: "107612478652254",
});

export function validateIchthusHandoffUrl(value) {
  if (typeof value !== "string" || !value || value.trim() !== value) return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash) return null;
  if (!/^([a-z0-9-]+\.)*vercel\.app$/i.test(url.hostname) &&
      url.hostname !== "relationship.ichthusmkt.com.br") return null;
  if (url.pathname !== "/api/relationship/meta/credentials") return null;
  return url.toString();
}

export function resolveMetaHandoffCandidates({ requestedWabaId, requestedPhoneNumberId, env = process.env } = {}) {
  const ichthusUrl = validateIchthusHandoffUrl(env.ICHTHUS_META_HANDOFF_URL);
  const clients = [EDUARDO_ASSET];
  if (env.ICHTHUS_META_HANDOFF_ENABLED === "true" && ichthusUrl) {
    clients.push({ ...ICHTHUS_ASSET, handoffUrl: ichthusUrl });
  }
  const waba = typeof requestedWabaId === "string" ? requestedWabaId.trim() : "";
  const phone = typeof requestedPhoneNumberId === "string" ? requestedPhoneNumberId.trim() : "";
  // Fail closed: require both exact ids to identify a customer before
  // interacting with their Meta phone asset or delivering credentials.
  if (!/^\d+$/.test(waba) || !/^\d+$/.test(phone)) return [];
  return clients.filter(client => client.wabaId === waba && client.phoneNumberId === phone);
}
