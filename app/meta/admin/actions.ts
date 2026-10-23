'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth } from '@/lib/meta-admin/auth'
import { getAdminConfig } from '@/lib/meta-admin/policy.mjs'
async function authForAction() {
  const config = getAdminConfig()
  if (!config) redirect('/meta/admin/login')
  const requestHeaders = await headers()
  if (requestHeaders.get('origin') !== config.origin) throw new Error('Origin rejected')
  return adminAuth()!
}
export async function loginAdmin() { const instance = await authForAction(); await instance.signIn('github', { redirectTo: '/meta/admin' }) }
export async function logoutAdmin() { const instance = await authForAction(); await instance.signOut({ redirectTo: '/meta/admin/login' }) }
