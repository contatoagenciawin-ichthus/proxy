# Marketing API Access Tier test run

This document covers the controlled test runner for the Meta App Review requirement shown in **Testing → Create and manage ads with the Marketing API → Marketing API Access Tier**.

The Meta UI currently requires:

- 500 Marketing API calls
- at least 85% success rate
- testing data may take up to 24 hours to appear

## Why this runner exists

The production `ads_read` review flow already proves real read-only access to authorized ad accounts and Insights. The Access Tier requirement is a separate volume test tracked by Meta.

The runner uses only:

`GET /{ad-account-id}/insights`

It does **not** create, update, pause, delete, or otherwise mutate campaigns, ad sets, ads, budgets, audiences, or business assets.

## Before running

Do not run this until:

1. `ads_read` has been tested successfully in Meta's Graph API Explorer.
2. The App Review Testing page still explicitly shows the 500-call requirement for Marketing API Access Tier.
3. You have a current user access token created for the **Proxy Whapp Platform** app with `ads_read`.
4. You have chosen an active ad account you are authorized to access.

For the Pet Endoscopia pilot, the ad account currently used in testing is:

`act_1268202195121223`

Do not commit the access token to GitHub, a document, chat, or source file.

## Dry run

Running the script without `--execute` makes no API calls:

```bash
node scripts/meta-marketing-access-tier-test.mjs
```

## Execute

PowerShell:

```powershell
$env:META_MARKETING_TEST_ACCESS_TOKEN="PASTE_TEMPORARY_TOKEN_HERE"
$env:META_MARKETING_TEST_AD_ACCOUNT_ID="act_1268202195121223"
$env:META_MARKETING_TEST_COUNT="500"
$env:META_MARKETING_TEST_DELAY_MS="1500"
node scripts/meta-marketing-access-tier-test.mjs --execute
```

The default delay is 1.5 seconds between calls, so a clean 500-call run takes roughly 12–15 minutes.

## Safety behavior

The runner:

- requires explicit `--execute`;
- never prints the access token;
- caps a run at 500 calls;
- uses only a read-only Insights GET;
- waits 30 seconds if it detects common Meta rate-limit signals;
- stops after 20 attempts if the observed success rate falls below 85%.

If the script stops, fix the underlying error before resuming. Do not brute-force retries.

## Resuming

If a run stops after a known call number, set:

```powershell
$env:META_MARKETING_TEST_START_AT="201"
```

Then rerun with `--execute`.

Only resume from a call number you can verify from the previous console output.

## After the run

1. Confirm the console reports at least 85% success.
2. Return to Meta for Developers → App Review → Testing.
3. Refresh the Marketing API use case.
4. Do not be concerned if the counter does not update immediately; Meta's own UI states that testing data can take up to 24 hours to appear.
5. Once the Access Tier counter is satisfied, return to the App Review submission and complete the remaining confirmation.
