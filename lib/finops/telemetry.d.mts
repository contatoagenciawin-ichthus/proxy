export type FinOpsBinding = { tenantId: string; sourceSystem: string; externalOrganizationId: string };
export type FinOpsSnapshot = {
  schemaVersion: 1; tenantId: string; sourceSystem: string; externalOrganizationId: string;
  service: 'whatsapp_audio_transcription'; competence: string; timezone: 'America/Sao_Paulo';
  currency: 'BRL'; estimatedCents: number | null; reservedCents: number | null;
  uncertainCents: number | null; actualReconciledCents: number | null;
  actualSource: 'provider_invoice' | null; fetchedAt: string;
  completeness: 'aggregate_estimate' | 'itemized_estimate' | 'reconciled';
};
export type LaAudioBudgetSnapshot = {
  enabled: true; spent_estimate_cents: number; soft_limit_cents: number;
  hard_limit_cents: number; basis: 'local_estimate_not_provider_invoice';
};
export const FINOPS_SCHEMA_VERSION: 1;
export function parseFinOpsSnapshot(input: unknown, expected: FinOpsBinding): FinOpsSnapshot;
export function fromLaAudioBudgetSnapshot(raw: unknown, binding: FinOpsBinding, competence: string, fetchedAt: string): FinOpsSnapshot;
export function financialPosition(input: {
  monthlyRevenueCents: number; allocatedCostCents: number | null; coverageComplete: boolean;
}): { monthlyRevenueCents: number; allocatedCostCents: number | null;
  remainingKnownCents: number | null; contributionMarginCents: number | null;
  status: 'costs_covered' | 'partial_costs' };
