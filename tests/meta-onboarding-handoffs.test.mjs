import test from "node:test";
import assert from "node:assert/strict";
import { EDUARDO_ASSET, ICHTHUS_ASSET, resolveMetaHandoffCandidates, validateIchthusHandoffUrl } from "../lib/meta-onboarding-handoffs.mjs";

const safeUrl = "https://relationship.ichthusmkt.com.br/api/relationship/meta/credentials";
const configured = { ICHTHUS_META_HANDOFF_ENABLED: "true", ICHTHUS_META_HANDOFF_URL: safeUrl, ICHTHUS_HANDOFF_SIGNING_SECRET: "TEST_ONLY_signing_secret_32chars_minimum" };

test("Eduardo legacy connection remains available with or without supplied identifiers", () => {
  for (const input of [{}, { requestedWabaId: EDUARDO_ASSET.wabaId }, { requestedPhoneNumberId: EDUARDO_ASSET.phoneNumberId }, { requestedWabaId: EDUARDO_ASSET.wabaId, requestedPhoneNumberId: EDUARDO_ASSET.phoneNumberId }]) {
    assert.deepEqual(resolveMetaHandoffCandidates({ ...input, env: configured }), [EDUARDO_ASSET]);
    assert.deepEqual(resolveMetaHandoffCandidates({ ...input, env: {} }), [EDUARDO_ASSET]);
  }
});

test("Ichthus asset cannot be routed before explicit backend enablement", () => {
  const ids = { requestedWabaId: ICHTHUS_ASSET.wabaId, requestedPhoneNumberId: ICHTHUS_ASSET.phoneNumberId };
  assert.deepEqual(resolveMetaHandoffCandidates({ ...ids, env: {} }), []);
  assert.deepEqual(resolveMetaHandoffCandidates({ ...ids, env: { ICHTHUS_META_HANDOFF_URL: safeUrl } }), []);
  assert.deepEqual(resolveMetaHandoffCandidates({ ...ids, env: { ICHTHUS_META_HANDOFF_ENABLED: "true" } }), []);
  assert.deepEqual(resolveMetaHandoffCandidates({ ...ids, env: { ICHTHUS_META_HANDOFF_ENABLED: "true", ICHTHUS_META_HANDOFF_URL: safeUrl } }), []);
  assert.deepEqual(resolveMetaHandoffCandidates({ ...ids, env: { ...configured, ICHTHUS_HANDOFF_SIGNING_SECRET: "too-short" } }), []);
  assert.deepEqual(resolveMetaHandoffCandidates({ ...ids, env: configured }), [{ ...ICHTHUS_ASSET, handoffUrl: safeUrl }]);
});

test("Ichthus requires both correct Meta asset IDs", () => {
  for (const ids of [{ requestedWabaId: ICHTHUS_ASSET.wabaId }, { requestedPhoneNumberId: ICHTHUS_ASSET.phoneNumberId }, { requestedWabaId: EDUARDO_ASSET.wabaId, requestedPhoneNumberId: ICHTHUS_ASSET.phoneNumberId }, { requestedWabaId: ICHTHUS_ASSET.wabaId, requestedPhoneNumberId: EDUARDO_ASSET.phoneNumberId }]) {
    assert.deepEqual(resolveMetaHandoffCandidates({ ...ids, env: configured }), []);
  }
});

test("handoff destination is HTTPS, allowlisted and path-specific", () => {
  assert.equal(validateIchthusHandoffUrl(safeUrl), safeUrl);
  assert.equal(validateIchthusHandoffUrl("https://proxy-relationship-demo.vercel.app/api/relationship/meta/credentials"),"https://proxy-relationship-demo.vercel.app/api/relationship/meta/credentials");
  for (const url of ["http://relationship.ichthusmkt.com.br/api/relationship/meta/credentials", "https://example.com/api/relationship/meta/credentials", "https://relationship.ichthusmkt.com.br/elsewhere", "https://user:pass@relationship.ichthusmkt.com.br/api/relationship/meta/credentials", "https://relationship.ichthusmkt.com.br/api/relationship/meta/credentials?token=x", "https://relationship.ichthusmkt.com.br.evil.com/api/relationship/meta/credentials", "https://unknown-preview.vercel.app/api/relationship/meta/credentials"]) {
    assert.equal(validateIchthusHandoffUrl(url), null);
  }
});
