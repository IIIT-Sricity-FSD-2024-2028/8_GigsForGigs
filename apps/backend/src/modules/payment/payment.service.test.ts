import assert from "node:assert/strict";
import { test } from "node:test";
import { platformFeeFor } from "./payment.service.js";

test("platform fee is 10% of the gig amount, rounded to paise", () => {
  assert.equal(platformFeeFor(5000), 500);
  assert.equal(platformFeeFor(1234.56), 123.46);
  assert.equal(platformFeeFor(0), 0);
});
