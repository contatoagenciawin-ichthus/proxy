import type { Binding, Snapshot } from './diagnostics-protocol.mjs';
export type DiagnosticResult = { state: 'unsupported' | 'disabled' | 'unconfigured' | 'denied' | 'unavailable' | 'invalid' | 'available'; snapshot: Snapshot | null };
export function diagnosticConfig(client: string, env?: NodeJS.ProcessEnv): { state: string; binding?: Binding; secret?: string; url?: string };
export function readProductDiagnostic(client: string, env?: NodeJS.ProcessEnv, fetcher?: typeof fetch, now?: number): Promise<DiagnosticResult>;
