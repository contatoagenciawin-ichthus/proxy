import type { NextAuthConfig } from 'next-auth';
export type AdminConfig = { origin: string; ids: string[]; secret: string; githubId: string; githubSecret: string; secure: boolean };
export function getAdminConfig(env?: Record<string, string | undefined>): AdminConfig | null;
export function isPlatformAdmin(id: unknown, config: AdminConfig | null): boolean;
export function requestHasAdminOrigin(request: Request, config: AdminConfig | null): boolean;
export function adminCallbacks(readConfig?: () => AdminConfig | null): NonNullable<NextAuthConfig['callbacks']>;
