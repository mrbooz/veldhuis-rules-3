// Contract checks.
//
// Not unit tests: these read a signed term out of the agreement and then ask
// the engine, through the same door payroll uses, whether the money honours
// it. A unit test says a function is correct. A check here says Veldhuis is
// charging what the customer signed.
//
// Each check is registered by name. A check with no fixture behind it stays
// registered and is skipped BY NAME, so the run card says out loud that it
// did not run — an unregistered gap is invisible, and invisible is how the
// 2019 night went out wrong.
//
// Nothing here pins which calendar day owns an hour: the halves are summed
// through evaluateSpan, so the checks read the same before and after the
// attribution question is settled.

import { contractFor } from "../../src/contracts/table";
import { evaluateSpan } from "../../src/rules/span";
import type { Contract } from "../../src/rules/contract";
import type { Shift } from "../../src/types";

/** Pence, so a comparison is never a float comparison. */
const pence = (pounds: number): number => Math.round(pounds * 100);

const paid = (shift: Shift, contract: Contract): number =>
  pence(evaluateSpan(shift, contract).total);

interface Check {
  /** The registry name. It prints on the run card. */
  name: string;
  /** Absent when the check is registered but has no fixture behind it. */
  run?: () => void;
}

const CHECKS: Check[] = [
  {
    // Aldervale's night starts at half past nine, not at ten. The agreement
    // has said so since 1998 and it is the term most often mis-quoted.
    name: "aldervale/night-boundary-2130",
    run: () => {
      const c = contractFor("aldervale", "2026-03-03");
      expect(c.nightStartsAt).toBe(21 * 60 + 30);
      const before = paid({ start: "2026-03-03T19:00", end: "2026-03-03T21:30" }, c);
      const across = paid({ start: "2026-03-03T21:30", end: "2026-03-03T23:59" }, c);
      // Same contract, comparable lengths, one side of the boundary each:
      // the later hours must carry the premium the earlier ones do not.
      expect(before).toBeGreaterThan(0);
      expect(across / 149).toBeGreaterThan(before / 150);
    },
  },
  {
    // A month that closes hard is never reopened. The engine cannot enforce
    // that on its own, but the term must be readable where the export is
    // written, and it is the flag rota.ts reads at the month edge.
    name: "aldervale/month-closes-hard",
    run: () => {
      expect(contractFor("aldervale", "2026-03-03").closes).toBe("hard");
      expect(contractFor("veenhof", "2026-03-03").closes).toBe("hard");
    },
  },
  {
    // Registered in the 2026 review, no fixture written yet: the night
    // premium under the re-quoted aldervale terms. Skipped by name so the
    // gap is on the card instead of in somebody's memory.
    name: "aldervale/night-premium-2026",
  },
  {
    // Drivers' hours. The 48-hour cap is law, not preference, and it is the
    // one term in the table that exists to be refused rather than paid.
    name: "nordkant/weekly-cap-48h",
    run: () => {
      expect(contractFor("nordkant", "2026-03-03").weeklyCapMinutes).toBe(48 * 60);
    },
  },
  {
    // Tachograph rounding: nordkant signed for worked minutes to round UP
    // to the next six. Two minutes over the hour is paid as six.
    name: "nordkant/rounds-up-to-six",
    run: () => {
      const c = contractFor("nordkant", "2026-03-03");
      expect(c.rounds).toBe("up-to-six");
      const flat = paid({ start: "2026-03-03T08:00", end: "2026-03-03T16:00" }, c);
      const over = paid({ start: "2026-03-03T08:00", end: "2026-03-03T16:02" }, c);
      const sixMinutes = Math.round((6 / 60) * c.baseRate * 100);
      expect(over - flat).toBe(sixMinutes);
    },
  },
  {
    // Brackwater signed the other way: minutes round DOWN to the last five,
    // so four minutes over the hour is paid as the hour.
    name: "brackwater/rounds-down-to-five",
    run: () => {
      const c = contractFor("brackwater", "2026-03-03");
      expect(c.rounds).toBe("down-to-five");
      const flat = paid({ start: "2026-03-04T08:00", end: "2026-03-04T16:00" }, c);
      const over = paid({ start: "2026-03-04T08:00", end: "2026-03-04T16:04" }, c);
      expect(over).toBe(flat);
    },
  },
  {
    // The 2021 re-signing moved the rates and left the boundary and the
    // rounding where they were. A day on either side of it prices under the
    // agreement that held on the day.
    name: "brackwater/re-signing-2021",
    run: () => {
      const before = contractFor("brackwater", "2021-03-31");
      const after = contractFor("brackwater", "2021-04-01");
      expect(after.baseRate).toBeGreaterThan(before.baseRate);
      expect(after.nightStartsAt).toBe(before.nightStartsAt);
      expect(after.rounds).toBe(before.rounds);
      const shift: Shift = { start: "2021-03-31T09:00", end: "2021-03-31T17:00" };
      const same: Shift = { start: "2021-04-01T09:00", end: "2021-04-01T17:00" };
      expect(paid(same, after)).toBeGreaterThan(paid(shift, before));
    },
  },
  {
    // Veenhof signed for exact minutes: nothing is rounded away in either
    // direction, which is why their month closes hard.
    name: "veenhof/exact-minutes",
    run: () => {
      const c = contractFor("veenhof", "2026-03-03");
      expect(c.rounds).toBe("exact");
      const flat = paid({ start: "2026-03-03T08:00", end: "2026-03-03T16:00" }, c);
      const over = paid({ start: "2026-03-03T08:00", end: "2026-03-03T16:03" }, c);
      const threeMinutes = Math.round((3 / 60) * c.baseRate * 100);
      expect(over - flat).toBe(threeMinutes);
    },
  },
  {
    // Every agreement, every customer: an hour worked is never worth less
    // than nothing, and a longer shift is never worth less than a shorter
    // one that starts with it. The engine has no rule that can subtract,
    // and this is the check that keeps it that way.
    name: "every-agreement/monotonic-and-non-negative",
    run: () => {
      for (const customer of ["aldervale", "nordkant", "brackwater", "veenhof"]) {
        const c = contractFor(customer, "2026-03-03");
        const short = paid({ start: "2026-03-03T09:00", end: "2026-03-03T13:00" }, c);
        const long = paid({ start: "2026-03-03T09:00", end: "2026-03-03T17:00" }, c);
        const none = paid({ start: "2026-03-03T09:00", end: "2026-03-03T09:00" }, c);
        expect(none).toBe(0);
        expect(short).toBeGreaterThan(0);
        expect(long).toBeGreaterThanOrEqual(short);
      }
    },
  },
  {
    // A premium is on top of the base rate, never instead of it: the same
    // hours on a Saturday cost the customer more than on the Tuesday
    // before, under every agreement that signed for a weekend rate.
    name: "every-agreement/premiums-are-on-top",
    run: () => {
      for (const customer of ["aldervale", "nordkant", "brackwater", "veenhof"]) {
        const c = contractFor(customer, "2026-03-03");
        if (c.weekendRate <= 0) continue;
        // 2026-03-03 is a Tuesday; 2026-03-07 is the Saturday of that week.
        const weekday = paid({ start: "2026-03-03T09:00", end: "2026-03-03T17:00" }, c);
        const weekend = paid({ start: "2026-03-07T09:00", end: "2026-03-07T17:00" }, c);
        expect(weekend).toBeGreaterThan(weekday);
      }
    },
  },
];

describe("contract checks", () => {
  for (const check of CHECKS) {
    if (!check.run) {
      // Registered, no fixture. It says so on the card.
      it.skip(check.name, () => undefined);
      continue;
    }
    it(check.name, check.run);
  }
});
