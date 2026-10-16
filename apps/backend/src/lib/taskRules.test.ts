import { test } from "node:test";
import assert from "node:assert/strict";
import { SERVICE_HIRE_SKILL, computeProgress, isServiceHireTask, stripReservedSkills } from "./taskRules.js";

const def = (...latestFirst: string[]) => ({ submissions: latestFirst.map((status) => ({ submission: { status } })) });

test("progress counts a definition only by its latest submission", () => {
  // Latest is revision_requested even though an older one was approved -> not done.
  assert.equal(computeProgress([def("revision_requested", "approved"), def("approved")], []), 50);
  assert.equal(computeProgress([def("approved"), def("closed")], []), 100);
  assert.equal(computeProgress([def(), def("submitted")], []), 0);
});

test("progress falls back to raw deliverables when no definitions exist", () => {
  assert.equal(computeProgress([], []), 0);
  assert.equal(computeProgress([], [{ status: "approved" }, { status: "revision_requested" }]), 50);
  assert.equal(computeProgress([], [{ status: "closed" }]), 100);
});

test("definitions take precedence over raw deliverables", () => {
  assert.equal(computeProgress([def("submitted")], [{ status: "approved" }]), 0);
});

test("clients cannot tag their own tasks as service hires", () => {
  assert.deepEqual(stripReservedSkills(["React", SERVICE_HIRE_SKILL]), ["React"]);
  assert.equal(isServiceHireTask({ skills: [SERVICE_HIRE_SKILL] }), true);
  assert.equal(isServiceHireTask({ skills: ["React"] }), false);
});
