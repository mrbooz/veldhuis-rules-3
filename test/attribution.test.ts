import { attributionDay, attributionPortions } from "../src/rules/attribution";
import { ALDERVALE } from "../src/contracts/aldervale";
import type { Shift } from "../src/types";

// Fixture times are wall-clock strings, the way the schedulers write them.
function shift(start: string, end: string): Shift {
  return { start: start, end: end };
}

// The rota, the payslip and the export all stand on this one answer.
describe("attributionDay", () => {
  it("attributes a day shift to that day", () => {
    const s = shift("2026-03-03T07:00", "2026-03-03T19:00");
    expect(attributionDay(s, ALDERVALE)).toBe("2026-03-03");
  });

  // Pinned deliberately: the exports stand on the OLD answer until each
  // moves under its own ticket (VEL-6122 / VEL-6123). If this test starts
  // failing, an export moved without its reconciliation.
  it("still hands a crossing shift whole to its start day (the deprecated view)", () => {
    const s = shift("2026-03-03T19:00", "2026-03-04T07:00");
    expect(attributionDay(s, ALDERVALE)).toBe("2026-03-03");
  });
});

describe("attributionPortions", () => {
  // Ruth Adeyemi, Beeches, week ending the 12th — the shift that raised
  // SUP-2291, SUP-2304 and SUP-2312. Five hours on Tuesday, seven on
  // Wednesday. The £41.20 lives in the difference.
  it("divides a crossing shift at midnight — VEL-6121's whole point", () => {
    const s = shift("2026-03-03T19:00", "2026-03-04T07:00");
    expect(attributionPortions(s, ALDERVALE)).toEqual([
      { day: "2026-03-03", minutes: 5 * 60 },
      { day: "2026-03-04", minutes: 7 * 60 },
    ]);
  });

  it("gives a day shift a single portion", () => {
    const s = shift("2026-03-03T07:00", "2026-03-03T19:00");
    expect(attributionPortions(s, ALDERVALE)).toEqual([
      { day: "2026-03-03", minutes: 12 * 60 },
    ]);
  });

  it("does not invent a zero-minute day for a shift ending exactly at midnight", () => {
    const s = shift("2026-03-03T16:00", "2026-03-04T00:00");
    expect(attributionPortions(s, ALDERVALE)).toEqual([
      { day: "2026-03-03", minutes: 8 * 60 },
    ]);
  });

  it("agrees with the deprecated view about which day comes first", () => {
    const s = shift("2026-03-03T19:00", "2026-03-04T07:00");
    expect(attributionPortions(s, ALDERVALE)[0].day).toBe(attributionDay(s, ALDERVALE));
  });
});
