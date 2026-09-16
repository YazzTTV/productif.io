import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chartData } = require("../../mobile-app-new/lib/analyticsChart.ts") as typeof import("../../mobile-app-new/lib/analyticsChart");
const { habitDateKey } = require("../../mobile-app-new/lib/habitDate.ts") as typeof import("../../mobile-app-new/lib/habitDate");

test("chart preserves full periods, total duration and final day", () => {
  for (const days of [7, 14, 30, 90]) {
    const daily = Array.from({ length: days }, (_, index) => ({
      date: new Date(Date.UTC(2026, 5, 19 + index)).toISOString().slice(0, 10),
      seconds: index === days - 1 ? 3600 : index * 60,
      checkins: [],
    }));
    const result = chartData(daily, days);
    assert.equal(result.length, days >= 30 ? Math.ceil(days / 7) : days);
    assert.equal(result[0].date, daily[0].date);
    assert.equal(result.at(-1)?.endDate, daily.at(-1)?.date);
    assert.equal(result.reduce((sum, day) => sum + day.seconds, 0), daily.reduce((sum, day) => sum + day.seconds, 0));
  }
  assert.deepEqual(chartData([], 90), []);
});

test("habit API dates match the selected local day in Toronto and east of UTC", () => {
  const previousTZ = process.env.TZ;
  try {
    for (const timezone of ["America/Toronto", "Europe/Paris", "Pacific/Auckland"]) {
      process.env.TZ = timezone;
      const pickedDay = new Date(2026, 8, 16, 0, 0);
      assert.equal(habitDateKey(pickedDay), "2026-09-16");
      assert.equal(habitDateKey("2026-09-16T00:00:00.000Z"), habitDateKey(pickedDay));
      assert.equal(habitDateKey("2026-09-16"), habitDateKey(pickedDay));
    }
    assert.equal(habitDateKey("invalid"), "");
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});
