// src/rules/attribution.ts
//
// Which calendar day a shift's hours are counted against. The rota a ward
// manager reads, the staffing count on a ward view and the fortnightly
// Pay-Ready export all consume the one answer this file gives, so a change
// here lands in three products at once.
//
// Contracts became data in 2017. That is why the function below takes a
// contract and not a clock: where one day ends and the next begins is part
// of what a customer signed, not something the wall clock knows.

import type { Contract } from "./contract";
import type { DayKey, Shift } from "../types";

// The day key comes from the window helper and nowhere else, so every
// consumer agrees on what a day is.
import { dayKeyOf } from "../lib/shiftWindow";

/**
 * Which calendar day owns the hours of a shift.
 *
 * A shift that crosses midnight is divided at midnight and each day owns
 * the hours worked inside it (see src/contracts/aldervale.ts).
 */
export function attributionDay(shift: Shift, contract: Contract): DayKey {
  // SUP-2291: nights were counted against the day the shift starts, which
  // put 14 people on Beeches on the Tuesday and 2 on the Wednesday.
  return dayKeyOf(shift.end);
}

