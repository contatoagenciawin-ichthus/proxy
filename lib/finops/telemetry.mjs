// Versioned, provider-internal telemetry contract. No network or tenant credentials.
export const FINOPS_SCHEMA_VERSION = 1;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEYS = (value, expected) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).sort().join('|') === expected.slice().sort().join('|');
const validCents = value => Number.isSafeInteger(value) && value >= 0;
const optionalCents = value => value === null || validCents(value);
const iso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const isMonth = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const assert = (condition, reason) => { if (!condition) throw new TypeError('finops_contract_' + reason); };

// No arbitrary records, prices, billing artifacts, tokens, messages or customer PII.
export function parseFinOpsSnapshot(input, expected) {
  assert(KEYS(expected, ['tenantId','sourceSystem','externalOrganizationId']), 'binding');
  assert(UUID.test(expected.tenantId) && UUID.test(expected.externalOrganizationId) &&
    /^[a-z][a-z0-9_-]{1,63}$/.test(expected.sourceSystem), 'binding');
  assert(KEYS(input, ['schemaVersion','tenantId','sourceSystem','externalOrganizationId',
    'service','competence','timezone','currency','estimatedCents','reservedCents',
    'uncertainCents','actualReconciledCents','actualSource','fetchedAt','completeness']), 'fields');
  assert(input.schemaVersion === FINOPS_SCHEMA_VERSION &&
    input.tenantId === expected.tenantId && input.sourceSystem === expected.sourceSystem &&
    input.externalOrganizationId === expected.externalOrganizationId, 'identity');
  assert(input.service === 'whatsapp_audio_transcription' &&
    isMonth(input.competence) && input.timezone === 'America/Sao_Paulo' &&
    input.currency === 'BRL', 'dimension');
  assert(optionalCents(input.estimatedCents) && optionalCents(input.reservedCents) &&
    optionalCents(input.uncertainCents) && optionalCents(input.actualReconciledCents), 'amount');
  assert(input.actualSource === null || (input.actualReconciledCents !== null &&
    input.actualSource === 'provider_invoice'), 'invoice');
  assert(input.actualReconciledCents === null || input.actualSource !== null, 'invoice');
  assert(['aggregate_estimate','itemized_estimate','reconciled'].includes(input.completeness), 'completeness');
  assert(input.completeness !== 'reconciled' || input.actualReconciledCents !== null, 'completeness');
  assert(input.completeness !== 'aggregate_estimate' ||
    (input.reservedCents === null && input.uncertainCents === null &&
     input.actualReconciledCents === null && input.actualSource === null), 'aggregate_detail');
  assert(iso(input.fetchedAt), 'timestamp');
  return structuredClone(input);
}

// Adapter of existing LA service_role-only RPC payload. Never interpret an
// unavailable breakdown as zero or pretend a local estimate is an invoice.
// The caller supplies a binding from an allowlisted trusted registry, not URL params.
export function fromLaAudioBudgetSnapshot(raw, binding, competence, fetchedAt) {
  assert(KEYS(binding, ['tenantId','sourceSystem','externalOrganizationId']), 'binding');
  assert(binding.sourceSystem === 'la-crm', 'source');
  assert(KEYS(raw, ['enabled','spent_estimate_cents','soft_limit_cents',
    'hard_limit_cents','basis']), 'la_fields');
  assert(raw.enabled === true && validCents(raw.spent_estimate_cents) &&
    validCents(raw.soft_limit_cents) && validCents(raw.hard_limit_cents) &&
    raw.hard_limit_cents >= raw.soft_limit_cents &&
    raw.basis === 'local_estimate_not_provider_invoice', 'la_estimate');
  return parseFinOpsSnapshot({
    schemaVersion: 1, ...binding, service: 'whatsapp_audio_transcription',
    competence, timezone: 'America/Sao_Paulo', currency: 'BRL',
    estimatedCents: raw.spent_estimate_cents,
    reservedCents: null, uncertainCents: null,
    actualReconciledCents: null, actualSource: null, fetchedAt,
    completeness: 'aggregate_estimate'
  }, binding);
}

// Arithmetic on integer centavos only. No false "profit" when costs are missing.
export function financialPosition({monthlyRevenueCents, allocatedCostCents, coverageComplete}) {
  assert(validCents(monthlyRevenueCents) && optionalCents(allocatedCostCents) &&
    typeof coverageComplete === 'boolean', 'financial_inputs');
  const remainingKnownCents = allocatedCostCents === null ? null :
    monthlyRevenueCents - allocatedCostCents;
  assert(remainingKnownCents === null || Number.isSafeInteger(remainingKnownCents), 'financial_overflow');
  const contributionMarginCents = coverageComplete ? remainingKnownCents : null;
  assert(!coverageComplete || allocatedCostCents !== null, 'financial_coverage');
  return { monthlyRevenueCents, allocatedCostCents, remainingKnownCents,
    contributionMarginCents, status: coverageComplete ? 'costs_covered' : 'partial_costs' };
}
