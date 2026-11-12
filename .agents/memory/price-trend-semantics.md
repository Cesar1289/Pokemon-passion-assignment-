---
name: Historical trends and current quotes
description: Why Wish List movement uses historical endpoints rather than the current simulated quote
---

Keep historical movement separate from current simulated quotes: compare the oldest and newest available samples within the 30-day window without replacing the catalog quote.

**Why:** The simulator's current catalog price and final historical sample can differ. The trend feature was required to preserve existing current prices and Wish List totals, not redefine catalog pricing.

**How to apply:** When extending price displays, label historical movement explicitly and disclose partial history. Do not make current prices equal historical endpoints unless a separate pricing change is requested.
