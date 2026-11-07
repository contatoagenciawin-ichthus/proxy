// Platform authorization is independent from all CRM organization memberships.
export function getAdminConfig(env = process.env) {
  if (env.PROXY_ADMIN_ENABLED !== 'true') return null;
  const ids = (env.PROXY_ADMIN_GITHUB_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!ids.length || ids.some(id => !/^[1-9][0-9]{0,19}$/.test(id))) return null;
  // The G2 Preview is deliberately isolated from the platform OAuth App.
  // Never silently fall back to general Preview/Production GitHub credentials.
  const isG2Preview = env.VERCEL_ENV === 'preview' &&
    env.VERCEL_GIT_COMMIT_REF === 'feat/g2-admin-read-isolation-20261106';
  const githubId = isG2Preview ? env.PROXY_G2_ADMIN_GITHUB_ID : env.PROXY_ADMIN_GITHUB_ID;
  const githubSecret = isG2Preview ? env.PROXY_G2_ADMIN_GITHUB_SECRET : env.PROXY_ADMIN_GITHUB_SECRET;
  if (!env.PROXY_ADMIN_AUTH_SECRET || env.PROXY_ADMIN_AUTH_SECRET.length < 32 ||
      !githubId || !githubSecret) return null;
  let url;
  try { url = new URL(env.PROXY_ADMIN_ORIGIN); } catch { return null; }
  const local = env.NODE_ENV === 'development' && url.protocol === 'http:' && url.hostname === 'localhost';
  if ((!local && url.protocol !== 'https:') || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) return null;
  return { origin: url.origin, ids, secret: env.PROXY_ADMIN_AUTH_SECRET,
    githubId, githubSecret,
    secure: !local };
}
export function isPlatformAdmin(id, config) {
  return Boolean(config && typeof id === 'string' && config.ids.includes(id));
}
export function requestHasAdminOrigin(request, config) {
  if (!config || new URL(request.url).origin !== config.origin) return false;
  const origin = request.headers.get('origin');
  return !origin || origin === config.origin;
}
// Exported separately to exercise identity, revocation and update attacks offline.
export function adminCallbacks(readConfig = () => getAdminConfig()) {
  return {
    signIn({ account }) {
      return account?.provider === 'github' && isPlatformAdmin(account.providerAccountId, readConfig());
    },
    jwt({ token, account }) {
      const id = account ? (account.provider === 'github' ? account.providerAccountId : undefined) : token.proxyAdminId;
      if (!isPlatformAdmin(id, readConfig())) return null;
      // Never persist provider access tokens, profile, CRM roles or browser session updates.
      return { proxyAdminId: id, sub: id };
    },
    session({ session, token }) {
      const allowed = isPlatformAdmin(token.proxyAdminId, readConfig());
      return { expires: session.expires, user: allowed ? { id: token.proxyAdminId } : undefined };
    },
  };
}
