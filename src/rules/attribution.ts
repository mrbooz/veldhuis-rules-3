// src/rules/attribution.ts
//
// Which calendar day a shift's hours are counted against. The rota a ward
// manager reads, the staffing count on a ward view and the fortnightly
// Pay-Ready export all consume the one answer this file gives, so a change
// here lands in three products at once.
//
// Contracts became data in 2017. That is why the functions below take a
// contract and not a clock: where one day ends and the next begins is part
// of what a customer signed, not something the wall clock knows.

import type { Contract } from "./contract";
import type { Minutes } from "./types";
import type { DayKey, Shift } from "../types";

// The day key comes from the window helper and nowhere else, so every
// consumer agrees on what a day is.
import { dayKeyOf, shiftWindows } from "../lib/shiftWindow";
import { minutesBetween } from "../lib/instant";

/** One day's share of a shift: the day, and the minutes worked inside it. */
export interface DayPortion {
  day: DayKey;
  minutes: Minutes;
}

/**
 * The hours of a shift, divided among the calendar days they were worked in.
 *
 * A shift that crosses midnight is divided at midnight and each day owns the
 * hours worked inside it — the Aldervale agreement's rule (VEL-6120, and
 * src/contracts/aldervale.ts), and the rule every consumer of this file is
 * supposed to have been applying. The split itself has been in the engine
 * since the 2021 capture rework (shiftWindows); nothing was calling it.
 *
 * Ruth Adeyemi, 19:00 Tuesday to 07:00 Wednesday: five hours on Tuesday and
 * seven on Wednesday, each at that day's rate, against that day's staffing.
 * (SUP-2291 / SUP-2304 / SUP-2312 — one attribution, three symptoms.)
 */
export function attributionPortions(shift: Shift, contract: Contract): DayPortion[] {
  return shiftWindows(shift)
    .map((w) => ({ day: dayKeyOf(w.from), minutes: minutesBetween(w.from, w.to) }))
    .filter((p) => p.minutes > 0);
}

/**
 * The single day a whole shift is attributed to.
 *
 * THIS IS THE OLD ANSWER, and it is wrong for a shift that crosses midnight:
 * it hands the entire shift to the day it started, which is what put fourteen
 * people on a Tuesday-night rota and Ruth's Wednesday hours on Tuesday's
 * payslip. It is kept, unchanged, because the rota and pay exports stand on
 * it today and each moves to attributionPortions() under its own ticket
 * (VEL-6122, VEL-6123) — behind the Aldervale flag, with its own
 * reconciliation. The comment this function used to carry described the
 * midnight division; the code never did it. Now the comment tells the truth
 * and the division lives above, where a caller can actually reach it.
 *
 * @deprecated Move to attributionPortions(). This survives only until the
 * last export has (VEL-6122 / VEL-6123).
 */
export function attributionDay(shift: Shift, contract: Contract): DayKey {
  return dayKeyOf(shift.start);
}
