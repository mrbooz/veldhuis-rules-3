// src/rules/engine.ts
//
// The evaluator. It applies rules in order and returns a total, as it has
// since 2017. It knows nothing about days or midnight: a caller that needs
// a shift divided at midnight divides it first (src/rules/span.ts) and
// hands the halves in one at a time.

import { holidayPremium, nightPremium, weekendPremium } from "./premium";
import { payableMinutes } from "./rounding";
import { minutesBetween } from "../lib/instant";
import type { Contract } from "./contract";
import type { Shift } from "../types";

interface Rule {
  id: string;
  matches(shift: Shift, contract: Contract): boolean;
  amount(shift: Shift, contract: Contract): number;
}

const RULES: Rule[] = [
  {
    id: "base-hours",
    matches(shift: Shift, contract: Contract): boolean {
      return true;
    },
    amount(shift: Shift, contract: Contract): number {
      const worked = minutesBetween(shift.start, shift.end);
      return (payableMinutes(worked, contract) / 60) * contract.baseRate;
    },
  },
  {
    id: "night-premium",
    matches(shift: Shift, contract: Contract): boolean {
      return nightPremium(shift, contract) > 0;
    },
    amount(shift: Shift, contract: Contract): number {
      return nightPremium(shift, contract);
    },
  },
  {
    id: "weekend-premium",
    matches(shift: Shift, contract: Contract): boolean {
      return weekendPremium(shift, contract) > 0;
    },
    amount(shift: Shift, contract: Contract): number {
      return weekendPremium(shift, contract);
    },
  },
  {
    id: "bank-holiday-premium",
    matches(shift: Shift, contract: Contract): boolean {
      return holidayPremium(shift, contract) > 0;
    },
    amount(shift: Shift, contract: Contract): number {
      return holidayPremium(shift, contract);
    },
  },
];

export function evaluate(shift: Shift, contract: Contract): Result {
  let total = 0;
  const applied: string[] = [];

  for (const rule of RULES) {
    if (!rule.matches(shift, contract)) continue;
    total += rule.amount(shift, contract);
    applied.push(rule.id);
  }

  return { total, applied };
}

export interface Result {
  total: number;
  applied: string[];
}
