import assert from "node:assert/strict";
import test from "node:test";

import { parseEcbReferenceRatesXml } from "./exchange-rate-parser";

test("parses EUR/INR observations from the ECB XML feed", () => {
  const xml = `<?xml version="1.0"?><Cube><Cube time='2026-09-04'><Cube currency='USD' rate='1.1'/><Cube currency='INR' rate='109.8165'/></Cube><Cube time="2026-09-07"><Cube currency="INR" rate="109.821"/></Cube></Cube>`;
  assert.deepEqual(parseEcbReferenceRatesXml(xml), [
    { date: "2026-09-04", rate: 109.8165 },
    { date: "2026-09-07", rate: 109.821 },
  ]);
});

test("ignores malformed observations instead of inventing rates", () => {
  const xml = `<Cube><Cube time='2026-09-04'><Cube currency='INR' rate='not-a-number'/></Cube></Cube>`;
  assert.deepEqual(parseEcbReferenceRatesXml(xml), []);
});
