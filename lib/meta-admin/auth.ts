import 'server-only'
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { adminCallbacks, getAdminConfig, isPlatformAdmin } from './policy.mjs'

export function adminAuth() {
  const config = getAdminConfig()
  if (!config) return null
  return NextAuth({
    basePath: '/api/meta/admin/auth',
    secret: config.secret,
    trustHost: true,
    providers: [GitHub({ clientId: config.githubId, clientSecret: config.githubSecret,
      authorization: { params: { scope: 'read:user' } } })],
    session: { strategy: 'jwt', maxAge: 60 * 60 },
    cookies: {
      sessionToken: { name: config.secure ? '__Host-proxy-admin-session' : 'proxy-admin-session',
        options: { httpOnly: true, sameSite: 'lax', path: '/', secure: config.secure } },
    },
    pages: { signIn: '/meta/admin/login', error: '/meta/admin/login' },
    callbacks: adminCallbacks(),
    logger: { error() { console.error('Proxy admin authentication failed') }, warn() {}, debug() {} },
  })
}
export async function currentPlatformAdmin() {
  const instance = adminAuth()
  if (!instance) return null
  const session = await instance.auth()
  return isPlatformAdmin(session?.user?.id, getAdminConfig()) ? session : null
}
