# Signed-in Wish List browser verification

Date: 2026-11-12  
Environment: development preview  
Result: **All four assigned acceptance criteria passed.** Two unrelated issues were observed and are listed below.

## Method and safety

A real browser registered a fresh, disposable account through the existing
username/password form. Authentication was not bypassed, mocked, or changed.
Only this account's test items were added, edited, and removed. No pre-existing
user data was touched. The test finished with both lists empty and signed out.
The disposable account itself was retained; no credentials or session values are
included in this report.

## Acceptance results

| Requirement | Result | Observed evidence |
| --- | --- | --- |
| Add from the card directory | PASS | Bulbasaur, Scarlet & Violet 151 · 1, was added from `/cards`. The control changed to its already-listed label. |
| Add from card detail | PASS | Charmander, Scarlet & Violet 151 · 4, was added from `/cards/sv3pt5-4`. The control changed to “On Wish List.” |
| Wish List shows cards and total, then updates after removal | PASS | Two cards showed current simulated prices $0.75 and $1.00, totaling $1.75. Removing Bulbasaur left one card and $1.00. |
| Empty state after the last removal | PASS | Removing Charmander showed count 0, $0.00, and “Your wish list is empty — hunt some cards!” The browse control navigated to `/cards`. |
| Existing My Collection remains available | PASS | A test Fuecoco binder entry showed one Near Mint copy and $0.10. Editing quantity to 2 updated the summary to two copies and $0.20. Removing it through the confirmation dialog restored zero copies and $0.00. |

Additional checks:

- Both Wish List items and their $1.75 total persisted after reload.
- Switching between My Collection and Wish List kept their contents independent.
- Totals used current simulated prices, not historical chart endpoints.
- The signed-out Wish List API returned HTTP 401.
- After logout, protected binder data returned HTTP 401. The tester observed a
  sign-in-required error in the remaining shell rather than verifying the full
  signed-out landing experience.
- Already-added labels were observed in the browser. The controls' disabled
  attributes were confirmed in source, not independently asserted in the browser.

## Screenshot evidence

Screenshots were captured in the browser test report, not checked into source:

- Populated Wish List: two cards, $1.75 (evidence `304puq`).
- Empty Wish List: zero cards, $0.00 (evidence `c5wrch`).
- My Collection: edited quantity of two (evidence `2we6gj`).
- My Collection after test-entry removal (evidence `hm75lq`).

## Separate findings

The browser tester reported an overall partial/failure verdict because the
expanded test plan also asked for confirmation toasts. This did not represent a
failure of the assigned add/remove/total/empty-state/collection criteria.

1. **Confirmation toasts were absent after Wish List additions.** Source
   inspection found that `App.tsx` calls `toast` from `sonner` but mounts the
   separate `components/ui/toaster` implementation. This likely affects other
   success/error notifications too. No notification code was changed during
   this verification-only task.
2. **Possible catalog artwork mismatch.** The tester saw Arboliva artwork on
   the Fuecoco detail page. The seed labels `sv1-23` as Fuecoco and derives its
   artwork from that catalog ID. The catalog mapping needs a separate audit;
   this report does not claim that all artwork was checked.
