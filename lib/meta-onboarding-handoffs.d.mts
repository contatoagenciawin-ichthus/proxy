// Type declarations for the fail-closed Meta handoff allowlist.
export interface HandoffAsset {
  wabaId: string;
  phoneNumberId: string;
  handoffUrl: string;
}
export const EDUARDO_ASSET: Readonly<HandoffAsset>;
export const ICHTHUS_ASSET: Readonly<Pick<HandoffAsset, "wabaId" | "phoneNumberId">>;
export function validateIchthusHandoffUrl(value: unknown): string | null;
export function resolveMetaHandoffCandidates(input?: {
  requestedWabaId?: string;
  requestedPhoneNumberId?: string;
  env?: Record<string, string | undefined>;
}): HandoffAsset[];
