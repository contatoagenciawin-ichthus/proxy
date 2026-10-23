#!/usr/bin/env node

/**
 * Controlled Marketing API Access Tier test runner.
 *
 * Purpose:
 * - Generate successful, read-only Marketing API calls for Meta's App Review
 *   Testing requirement.
 * - Never mutate campaigns, ad sets, ads, budgets, or audiences.
 *
 * Required env:
 *   META_MARKETING_TEST_ACCESS_TOKEN
 *   META_MARKETING_TEST_AD_ACCOUNT_ID   (with or without "act_" prefix)
 *
 * Optional env:
 *   META_GRAPH_VERSION=v26.0
 *   META_MARKETING_TEST_COUNT=500
 *   META_MARKETING_TEST_DELAY_MS=1500
 *   META_MARKETING_TEST_START_AT=1
 *
 * Safety:
 * - Requires explicit --execute.
 * - Prints no access token.
 * - Uses GET /{ad-account-id}/insights only.
 * - Stops if the rolling success rate drops below 85% after 20 attempts.
 */

const args = new Set(process.argv.slice(2))

if (!args.has("--execute")) {
  console.log("Dry run only. No API calls were made.")
  console.log("")
  console.log("To execute:")
  console.log(
    "  META_MARKETING_TEST_ACCESS_TOKEN=... META_MARKETING_TEST_AD_ACCOUNT_ID=act_... node scripts/meta-marketing-access-tier-test.mjs --execute",
  )
  process.exit(0)
}

const token = process.env.META_MARKETING_TEST_ACCESS_TOKEN?.trim()
const rawAccountId = process.env.META_MARKETING_TEST_AD_ACCOUNT_ID?.trim()
const graphVersion = process.env.META_GRAPH_VERSION?.trim() || "v26.0"
const targetCount = Number(process.env.META_MARKETING_TEST_COUNT || "500")
const delayMs = Number(process.env.META_MARKETING_TEST_DELAY_MS || "1500")
const startAt = Number(process.env.META_MARKETING_TEST_START_AT || "1")

if (!token) {
  throw new Error("META_MARKETING_TEST_ACCESS_TOKEN is required.")
}

if (!rawAccountId) {
  throw new Error("META_MARKETING_TEST_AD_ACCOUNT_ID is required.")
}

if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 500) {
  throw new Error("META_MARKETING_TEST_COUNT must be an integer from 1 to 500.")
}

if (!Number.isFinite(delayMs) || delayMs < 500) {
  throw new Error("META_MARKETING_TEST_DELAY_MS must be at least 500 ms.")
}

if (!Number.isInteger(startAt) || startAt < 1 || startAt > targetCount) {
  throw new Error("META_MARKETING_TEST_START_AT must be between 1 and target count.")
}

const accountId = rawAccountId.startsWith("act_")
  ? rawAccountId
  : `act_${rawAccountId}`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let attempts = 0
let successes = 0
let failures = 0

function successRate() {
  return attempts === 0 ? 100 : (successes / attempts) * 100
}

async function runCall(index) {
  const params = new URLSearchParams({
    date_preset: "last_7d",
    level: "account",
    fields: "spend,impressions,reach,clicks",
    limit: "1",
  })

  const url =
    `https://graph.facebook.com/${graphVersion}/${accountId}/insights?${params.toString()}`

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  const raw = await response.text()
  let payload = null

  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    payload = { raw }
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error?.type ||
      `HTTP ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.code = payload?.error?.code
    error.subcode = payload?.error?.error_subcode
    throw error
  }

  return {
    index,
    status: response.status,
    rows: Array.isArray(payload?.data) ? payload.data.length : 0,
  }
}

console.log("Meta Marketing API Access Tier controlled test")
console.log(`Graph version: ${graphVersion}`)
console.log(`Ad account: ${accountId}`)
console.log(`Target calls: ${targetCount}`)
console.log(`Start at: ${startAt}`)
console.log(`Delay: ${delayMs} ms`)
console.log("Endpoint: GET /{ad-account-id}/insights")
console.log("")

for (let index = startAt; index <= targetCount; index += 1) {
  attempts += 1

  try {
    const result = await runCall(index)
    successes += 1

    console.log(
      `[${String(index).padStart(3, "0")}/${targetCount}] OK ${result.status} · rows=${result.rows} · success=${successRate().toFixed(1)}%`,
    )
  } catch (error) {
    failures += 1

    console.error(
      `[${String(index).padStart(3, "0")}/${targetCount}] FAIL · ${error.message} · success=${successRate().toFixed(1)}%`,
    )

    const rateLimited =
      error.status === 429 ||
      error.code === 4 ||
      error.code === 17 ||
      error.code === 32

    if (rateLimited) {
      console.log("Rate-limit signal detected. Waiting 30 seconds before continuing.")
      await sleep(30_000)
    }

    if (attempts >= 20 && successRate() < 85) {
      console.error("")
      console.error(
        "Stopped: success rate fell below Meta's 85% requirement. Resolve the errors before continuing.",
      )
      process.exitCode = 2
      break
    }
  }

  if (index < targetCount) {
    await sleep(delayMs)
  }
}

console.log("")
console.log("Run summary")
console.log(`Attempts: ${attempts}`)
console.log(`Successes: ${successes}`)
console.log(`Failures: ${failures}`)
console.log(`Success rate: ${successRate().toFixed(1)}%`)
console.log("")
console.log(
  "Meta notes that successful testing data can take up to 24 hours to appear in App Review.",
)

if (successRate() < 85) {
  process.exitCode = 2
}
