import test from 'node:test';
import assert from 'node:assert/strict';
import { FINOPS_SCHEMA_VERSION, parseFinOpsSnapshot, fromLaAudioBudgetSnapshot, financialPosition } from '../lib/finops/telemetry.mjs';

const binding = { tenantId:'11111111-1111-4111-8111-111111111111',
  sourceSystem:'la-crm', externalOrganizationId:'22222222-2222-4222-8222-222222222222' };
const fetchedAt = '2026-11-08T13:00:00.000Z';
const la = { enabled:true, spent_estimate_cents:82, soft_limit_cents:3000,
  hard_limit_cents:3300, basis:'local_estimate_not_provider_invoice' };
const snapshot = () => fromLaAudioBudgetSnapshot(la,binding,'2026-11',fetchedAt);
test('LA aggregate retains estimate, never asserts invoice or separate spending classes',()=>{
  assert.equal(FINOPS_SCHEMA_VERSION,1);
  assert.deepEqual(snapshot(), { schemaVersion:1, ...binding,
    service:'whatsapp_audio_transcription', competence:'2026-11', timezone:'America/Sao_Paulo',
    currency:'BRL', estimatedCents:82, reservedCents:null, uncertainCents:null,
    actualReconciledCents:null, actualSource:null, fetchedAt, completeness:'aggregate_estimate' });
});
test('strict input projection rejects secrets, message bodies, forged tenant and unknown states',()=>{
  for (const edit of [s=>s.accessToken='secret',s=>s.message='private',s=>s.tenantId='another',
    s=>s.sourceSystem='other',s=>s.externalOrganizationId='33333333-3333-4333-8333-333333333333',
    s=>s.estimatedCents=-1,s=>s.estimatedCents=0.1,s=>s.estimatedCents=Number.MAX_SAFE_INTEGER+1,
    s=>s.reservedCents=0,s=>s.actualReconciledCents=0,
    s=>s.actualSource='provider_invoice',s=>s.completeness='reconciled',
    s=>s.timezone='UTC',s=>s.competence='2026-13',s=>s.fetchedAt='invalid']) {
    const item=snapshot(); edit(item);assert.throws(()=>parseFinOpsSnapshot(item,binding));
  }
});
test('LA adapter rejects unsupported/untrusted RPC shapes and source mismatches',()=>{
  for(const edit of [r=>r.secret='key',r=>r.enabled=false,r=>r.spent_estimate_cents=-1,
    r=>r.spent_estimate_cents=1.5,r=>r.hard_limit_cents=2000,
    r=>r.basis='provider_invoice',r=>delete r.soft_limit_cents]) {
    const item={...la}; edit(item);
    assert.throws(()=>fromLaAudioBudgetSnapshot(item,binding,'2026-11',fetchedAt));
  }
  assert.throws(()=>fromLaAudioBudgetSnapshot(la,{...binding,sourceSystem:'other'},'2026-11',fetchedAt));
});
test('financial outputs distinguish partial remainder from actual contribution margin',()=>{
  assert.deepEqual(financialPosition({monthlyRevenueCents:29700,allocatedCostCents:3000,coverageComplete:false}),
    { monthlyRevenueCents:29700,allocatedCostCents:3000,remainingKnownCents:26700,
      contributionMarginCents:null,status:'partial_costs' });
  assert.equal(financialPosition({monthlyRevenueCents:29700,allocatedCostCents:3300,coverageComplete:false}).remainingKnownCents,26400);
  assert.equal(financialPosition({monthlyRevenueCents:29700,allocatedCostCents:null,coverageComplete:false}).remainingKnownCents,null);
  assert.equal(financialPosition({monthlyRevenueCents:1000,allocatedCostCents:1500,coverageComplete:true}).contributionMarginCents,-500);
  assert.throws(()=>financialPosition({monthlyRevenueCents:29700,allocatedCostCents:null,coverageComplete:true}));
  assert.throws(()=>financialPosition({monthlyRevenueCents:-1,allocatedCostCents:0,coverageComplete:true}));
});
