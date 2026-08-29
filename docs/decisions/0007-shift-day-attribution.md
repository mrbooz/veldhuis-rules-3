# ADR-0007: which day owns a shift that crosses midnight

## Context

Three products — Rota, Hours, Pay-Ready — consume one answer to which calendar day owns a shift's hours, and since the 2021 capture rework the engine has had two answers living side by side: attributionDay hands the whole shift to its start day, and the divider that splits at midnight sits deprecated with nothing calling it. Every customer contract takes a position (Aldervale's 1998 agreement divides at midnight; Nordkant's caps assume worked days), payroll corrects our output by hand when the answers collide, and the engineer who understood the trade-offs left in 2023. VEL-6121 restored the division for Aldervale behind a flag; what has never been written down is the rule the ENGINE commits to — so every future export change re-litigates 2017 from scratch.

## Option A — the shift's start day owns all of it

One rule, one owner: the whole shift belongs to the day it started. It is what the engine has done since 2021, so nothing moves and no export changes. To the person who worked it, a night is one shift — Ruth clocks one shift, not two halves. Cheap, stable, and already wrong twice a week: it puts hours on days they were not worked, so rota counts, day rates and weekly caps all read from a fiction, and the corrections land in payroll's hands.

## Option B — split at midnight

Divide once, low down: a shift crossing midnight is split at midnight and each day owns the hours worked inside it, at that day's rate, against that day's staffing and caps. It is what the signed agreements describe, it is Wim's 2017 design, and it makes every downstream number a statement about hours actually worked. Costs: every export that assumed one-shift-one-day has to move (VEL-6122/6123 are that work), the month-edge double-pay guard must run BEFORE the division or the 2019 bug returns on the last night of each month, and premium rounding happens per-day, which changes some payslips by design — each such change needs the contract clause beside it.

## Decision

A shift that crosses midnight is divided at midnight and each calendar day owns the hours worked inside it — at that day's rate, against that day's staffing and caps — with the month-edge double-pay guard applied before the division; attributionPortions() is the one function that says so, and any export still reading a single day is consuming the deprecated view and owes a migration ticket.

## Why not the other one

Not because A is cheaper — it is, and stability is a real argument, which is why it survived nine years. Rejected because A makes the engine's numbers statements about scheduling rather than about work: it prices Wednesday hours at Tuesday's rate, counts Wednesday staff on Tuesday's ward, and runs Nordkant's legal cap against days nobody worked. Every one of those is a sentence a customer can check against a signed page and find false, and this engine's only real product is numbers a customer cannot argue with. Keeping A would mean the fiction stays load-bearing and every future fix starts by lying about a day.

## What this makes harder (CONS-NIGHT-2130)

CONS-NIGHT-2130: any night comparison across the 2021–2026 boundary is now grouped two different ways, so nine years of totals cannot be compared to new ones without re-running history through the divider — trend reports, year-on-year staffing views and any audit spanning the boundary get harder, permanently. It also makes the 21:30 premium boundary a per-day question: a shift's premium hours now round within each day, so some payslips change by design, and every such change has to be defended from the contract clause rather than from precedent — CONS-NIGHT-2130 is the reference to cite when one of them is questioned.
