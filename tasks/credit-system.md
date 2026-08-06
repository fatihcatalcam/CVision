# Credit system — plan

Replaces the weekly quota AND the premium feature gate with a single currency.
No paying users today, so this is the cheapest this change will ever be.

## Prices (agreed)

| Action | Credits |
|---|---|
| Analysis | 1 |
| Unlock full report | +2 |
| Job-description match | 1 |
| AI cover letter | 2 |
| Bullet rewrite | 1 |

New account: **3**. Weekly grant: **+2** on login. Referral: **+3**.

A full "apply to this job" run is 1 + 2 + 1 + 2 = **6 credits** — three weeks of
free grants, or a small purchase. That is the intended shape of the paywall.

## One change to what we discussed

You described "normal analysis 1 / pro analysis 3" as a choice made up front.
Recommend charging **1 to analyse, then +2 to unlock** on the result page.

Same 3 credits for the same outcome, but:
- The cheapest possible first action. Nobody has to gamble 3 credits on a tool
  they have not seen work yet.
- The locked report already shows blurred teasers, so the product does the
  selling at the moment the user most wants the answer.
- It matches the code. `_build_analysis_response` already gates on a flag; this
  moves that flag from "is the viewer premium" to "is this report unlocked".

Say the word if you would rather keep the up-front choice.

## Data model

- **`users.credits`** INTEGER NOT NULL DEFAULT 0
- **`users.credits_granted_at`** TIMESTAMP NULL — last weekly grant
- **`analysis_results.is_unlocked`** BOOLEAN NOT NULL DEFAULT FALSE — per report,
  replacing "is the viewer premium"
- **`credit_transactions`** — id, user_id, delta, reason, ref_id, balance_after,
  created_at

The ledger is not over-engineering at 50 users; it is what makes the balance
defensible once step 3 sells credits for money. "I paid and my credits vanished"
cannot be answered from a single integer, and history cannot be retrofitted -
the events are already gone. `balance_after` lets any row be checked against the
running total, so drift surfaces instead of hiding.

## Rules

- **Accumulate. Purchased credits never expire.** Turkish consumer law is
  unfriendly to expiring prepaid balances, and it is a trust cost we do not need.
- **Cap free-earned credits at 12** (six weeks). Purchased credits are exempt.
  Stops a dormant account banking a year of grants, which would remove any
  reason to buy.
- **The weekly grant is claimed on login, not accrued.** One per visit at most:
  away for five weeks means 2 on return, not 10. Rewards showing up.
- **Refund on failure.** Already the rule for quota (`_mark_failed` refunds);
  carries over. A failed parse must never cost anything.
- **Referral pays when the invited user completes their first real analysis**,
  not at signup. Costs an abuser real work per fake account without needing
  email verification, which we are deliberately deferring so registration stays
  frictionless.

## Migration for the existing 50

Everyone starts at **3 credits**, same as a new account.

Accounts currently flagged `premium` (yours, plus the one you granted) keep
working via a larger opening balance rather than a plan flag, so there is exactly
one code path. Proposed **50** — enough that nothing you do day to day hits a
wall, and it retires `plan_type` cleanly.

## Tasks

- [ ] 1. Migration: `users.credits`, `users.credits_granted_at`,
      `analysis_results.is_unlocked`, `credit_transactions`. Backfill balances.
- [ ] 2. `CreditService`: `spend()`, `grant()`, `balance()`, all writing the
      ledger. `spend` is atomic and refuses to go negative.
- [ ] 3. Replace the quota check in `cv_service.py` with `spend(1)`. Keep the
      refund path on failure.
- [ ] 4. Weekly grant on login, with the cap and the one-per-visit rule.
- [ ] 5. Move report gating from `plan_type` to `analysis_results.is_unlocked`;
      add the unlock endpoint (`spend(2)`).
- [ ] 6. Price match, cover letter and bullet rewrite in credits; drop their
      `plan_type` checks.
- [ ] 7. Referral: code per user, claimed on the invited user's first completed
      analysis, through the ledger.
- [ ] 8. Frontend: balance in the header, cost on every action, unlock button on
      a locked report, referral screen. Copy in 5 languages.
- [ ] 9. Admin: balance column, manual adjust (writes the ledger like everything
      else).
- [ ] 10. Retire `plan_type` from gating. Leave the column; dropping it is a
      separate, reversible step.

Steps 1–4 are shippable alone and change nothing a user sees except the number.
5–6 is where the paywall actually moves. 7 can follow later.

## Review

All ten tasks done. ~45 files, 6 new test files.

### Decisions that changed during the build

**Charge at unlock, not up front.** Proposed above, accepted: 1 credit to analyse,
+2 to unlock. The locked report already sells itself with blurred teasers.

**Prices live in settings, and 0 means free.** `charge()` short-circuits on a
zero price, because CreditService rightly refuses a zero-value spend and without
that a price could never be tuned down to free from the environment.

**The Pro subscription now hands over credits.** Not in the original plan and it
had to be: `plan_type` stopped gating anything, so a purchase would have taken
the money and delivered nothing. `CREDIT_PREMIUM_PURCHASE` is set high (200)
because there are no payers yet - over-delivering to the first few costs almost
nothing at ~$0.008 of compute per analysis, and under-delivering to someone who
already paid cannot be undone. **Set the real number when credit packs replace
the subscription.**

**fetch-url is rate limited, not priced.** Dropping the Pro gate would otherwise
have handed every registered account an unbounded outbound fetcher - that gate
was its only protection. It is an input step, so a credit price is the wrong
tool; 10/minute is.

### Bugs found and fixed on the way

- **Google signups got zero credits.** The opening balance was added to the
  email/password path only, so a Google account could not run a single analysis.
  Now one `open_account()` both paths call.
- **The first report re-locked itself.** The welcome perk was computed per
  request as `total_analyses == 1`, so uploading a second CV took away a report
  the user already had. Now written onto the row.
- **The unlock button did nothing.** `onClick={undefined}` on the summary gate.
- **A lapsed subscription re-locked paid results.** Gating keyed off the viewer's
  plan; it is now a property of the report.

### Left deliberately

`analysis_count`, `quota_reset_at` and `plan_type` still exist. Nothing gates on
them - `plan_type` is now only a badge, an admin count and the cancel flow.
Dropping columns is irreversible and separate.

### Credit packs (roadmap step 3) — done

Three packs of 10 / 30 / 75 credits, sold through Lemon Squeezy, replacing the
monthly subscription. Prices live on the Lemon variant, never in our code.

`grant_once()` keys on the Lemon order id: their webhook is retried by design,
and a second delivery must not hand out a second pack. A checkout may only be
opened for a variant we know the credit value of, and an order for an unknown
variant grants nothing and logs loudly - a guess would be either theft or a
giveaway.

**Needs manual setup before it works.** Create three one-time products in Lemon
Squeezy, take their variant ids, and set on Render:

    CREDIT_PACKS=<variant1>:10,<variant2>:30,<variant3>:75

Empty means nothing is on sale and the page says so, so this is safe to deploy
before the products exist.

### Still open

`CREDIT_PREMIUM_PURCHASE` (200) is the placeholder for the legacy subscription
path, which the packs now supersede. Once nobody can reach the subscription,
that constant and `_upgrade_user` can go.
