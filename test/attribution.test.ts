import { attributionDay } from "../src/rules/attribution";
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

  it("attributes a night shift to the day it ends", () => {
    const s = shift("2026-03-03T19:00", "2026-03-04T07:00");
    expect(attributionDay(s, ALDERVALE)).toBe("2026-03-04");
  });
});
