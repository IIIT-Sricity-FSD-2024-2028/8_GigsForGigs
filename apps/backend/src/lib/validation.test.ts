import { test } from "node:test";
import assert from "node:assert/strict";
import { httpUrl, line, orgName, personName, tag, text } from "./validation.js";

const ch = (cp: number) => String.fromCodePoint(cp);
const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: string) =>
  assert.equal(schema.safeParse(v).success, true, `should accept: ${JSON.stringify(v)}`);
const bad = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: string) =>
  assert.equal(schema.safeParse(v).success, false, `should reject: ${JSON.stringify(v)}`);

test("real names in many scripts are accepted", () => {
  for (const n of ["Chaitanya Anand", "O'Brien", "Jean-Luc Picard", "J. R. R. Tolkien", "Krzysztof Wójcik",
    "चैतन्य आनंद", "சுப்ரமணியம்", "José María", "Nguyễn Văn An", "Ng", `ശ്രീ${ch(0x200d)}കുമാർ`]) ok(personName(), n);
});

test("names reject digits, symbols, markup and invisible tricks", () => {
  for (const n of ["John99", "<b>Bob</b>", "Bob!!", "Robert'); DROP TABLE users;--", "   ",
    `Ad${ch(0x202e)}min`, `Ad${ch(0x200b)}min`, `Zalgo${"̴".repeat(6)}`, "aaaaaaaaa"]) bad(personName(), n);
});

test("organisation names and tags allow their real-world punctuation", () => {
  for (const n of ["AT&T", "Smith & Sons (India) Pvt. Ltd.", "3M", "Tata Consultancy Services"]) ok(orgName(), n);
  for (const t of ["C++", "C#", "Node.js", "UI/UX", "R&D", "kubectl", "Next.js 15"]) ok(tag(), t);
  for (const t of ["C++++++", "<script>", "a;b", "#!$%"]) bad(tag(), t);
});

test("titles and descriptions block code injection", () => {
  for (const v of ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "Click javascript:alert(1)",
    "<iframe src=//evil>", "data:text/html,<b>", "<a href=x onclick=steal()>hi</a>"]) {
    bad(line(255), v);
    bad(text(5000), v);
  }
  bad(line(255), "Fix the <b> tag"); // no HTML at all in single-line fields
  ok(text(5000), "The <div> wrapper overflows on mobile; use flexbox and a regular expression (regex) for parsing.");
});

test("gibberish, floods and symbol spam are rejected; real prose is not", () => {
  for (const v of ["asdfghjkl", "qwertyuiop poiuytrewq", "sdlkfjsdf kjhkjhkjh", "!!!!!!!!", "$$$ ### @@@ %%%", "aaaaaaaaaaaaa",
    "x".repeat(80)]) bad(line(255), v);
  for (const v of ["Build a React Native app for food delivery", "Logo 🎨 für Café", "Need help with PostgreSQL & Prisma migrations",
    "₹5,000 budget — 2 week deadline!", "Hindi/English bilingual copywriter (हिंदी)"]) ok(line(255), v);
  ok(text(5000), "Line one.\nLine two with a link https://example.com/some/really/long/path/that/goes/on/and/on/forever");
});

test("URLs must be plain http(s)", () => {
  ok(httpUrl(), "https://github.com/user/repo/pull/1");
  for (const u of ["javascript:alert(1)", "data:text/html,hi", "ftp://x.com", "https://user:pass@x.com", "https://exa mple.com", "not a url"]) bad(httpUrl(), u);
});
