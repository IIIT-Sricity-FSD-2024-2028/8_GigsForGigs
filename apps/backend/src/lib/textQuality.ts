/**
 * Local, deterministic checks for junk text: invisible/spoofing characters,
 * "Zalgo" stacked accents, keyboard-mash gibberish, symbol spam and character
 * floods. No external service — instant, free, testable, and user text never
 * leaves the server. Every check returns a user-facing reason, or null if OK.
 *
 * Deliberately conservative: it must never reject real names or real prose in
 * any script (Hindi, Tamil, Polish, ...). Gibberish heuristics therefore only
 * look at Latin-letter words and need a clear majority of them to be junk.
 */

// Zero-width spaces, LRM/RLM, bidi embeddings/overrides/isolates, word joiners, BOM.
// ZWNJ/ZWJ (U+200C/U+200D) are NOT here: Indic scripts and emoji sequences need them.
const INVISIBLE = /[\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD]/u;
const ZALGO = /\p{M}{4,}/u; // real scripts stack at most ~3 combining marks
const URLISH = /^(https?:\/\/|www\.)\S+$/i;
// Anything that looks like an HTML tag or comment: "<b>", "</p>", "<!--", "<img src=x>".
const HTML_TAG = /<\s*\/?\s*[a-z!][^<>]*>/i;
// Markup/scripts that are dangerous anywhere they might be rendered, and script-capable URL schemes.
const DANGEROUS_MARKUP = /<\s*\/?\s*(script|iframe|object|embed|svg|math|img|video|audio|style|link|meta|base|form|input|button|frame|frameset|applet|template)\b|<[^>]*\bon[a-z]+\s*=|(?:java|vb)script\s*:|data\s*:\s*text\/html/i;

/**
 * Common English letter pairs. A keyboard mash ("asdkjhqwe") is mostly pairs
 * that real words rarely contain; real words — even unusual ones — are mostly
 * pairs from this set.
 */
const COMMON_BIGRAMS = new Set(
  ("th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng se ha as ou io le ve co me de hi ri ro ic ne ea ra ce li ch ll be ma si om ur ca el ta la ns di fo ho pe ec pr no ct us ac ot il tr ly nc et ut ss so rs un lo wa ge ie wh ee wi em ad ol rt po we na ul ni ts mo ow pa im mi ai sh ir su id os iv ia am fi ci vi pl ig tu ev ld ry mp fe bl ab gh ty op wo sa ay ex ke fr oo av ag if ap gr od bo sp rd do uc bu ei ov by rm ep tt oc fa ef cu rn sc gi da yo cr cl du ga qu ue ff ba ey ls va um pp ua up lu go ht ru ug ds lt pi rc rr eg au ck ew mu br bi pt ak pu ui rg ib tl ny ki rk ys ob mm fu ph og ms ye ud mb ip ub oi rl gu dr hr cc tw ft wn nu af hu nn eo vo rv nf xp gn sm fl iz ok nl my gl aw sy oa ya ja ka kh nk sk dh bh gy oy ix xt yp yt ze za zi uz oz ks pp lk lm lp lv rb rf rp rh nv nj nr mn gt hn" +
    " ah eh oh uh ey iy ao eu ae aa ii uu kr yu iu yi ou").split(/\s+/),
);

const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"].flatMap((r) => [r, [...r].reverse().join("")]);

function isGibberishWord(word: string): boolean {
  const w = word.toLowerCase();
  if (w.length < 6) return false;
  // Sliding along a keyboard row ("qwerty", "poiuy") or typing the same chunk twice ("qwerqwer").
  for (let i = 0; i + 5 <= w.length; i++) {
    if (KEYBOARD_ROWS.some((row) => row.includes(w.slice(i, i + 5)))) return true;
  }
  if (/([a-z]{4,})[a-z]?\1/.test(w)) return true;
  let rare = 0;
  for (let i = 0; i < w.length - 1; i++) {
    if (!COMMON_BIGRAMS.has(w.slice(i, i + 2))) rare++;
  }
  const vowels = (w.match(/[aeiouy]/g) ?? []).length;
  return rare / (w.length - 1) > 0.5 || vowels / w.length < 0.1;
}

function latinWords(s: string): string[] {
  return s
    .split(/\s+/)
    .filter((t) => !URLISH.test(t) && !t.includes("@") && !/\d/.test(t))
    .flatMap((t) => t.split(/[^A-Za-z]+/))
    .filter((t) => t.length > 0);
}

export interface QualityOptions {
  /** Max identical characters in a row ("!!!!!!!", "aaaaaaa"). */
  maxRepeat: number;
  /** Max share of non-space characters that may be symbols/emoji/punctuation. */
  maxSymbolRatio: number;
  /** Max length of a single unbroken token (URLs exempt). */
  maxTokenLength: number;
  /** Run the keyboard-mash check. Off for person names (Krzysztof, Ng, ...). */
  gibberish: boolean;
  /** "none": no HTML-like tags at all. "safe": prose may mention tags like <div>, but never scripts/handlers. */
  markup: "none" | "safe";
}

export const LINE_RULES: QualityOptions = { maxRepeat: 4, maxSymbolRatio: 0.3, maxTokenLength: 40, gibberish: true, markup: "none" };
export const TEXT_RULES: QualityOptions = { maxRepeat: 9, maxSymbolRatio: 0.35, maxTokenLength: 60, gibberish: true, markup: "safe" };

export function textProblem(s: string, o: QualityOptions): string | null {
  if (s.length === 0) return null;
  if (INVISIBLE.test(s)) return "contains hidden or direction-changing characters";
  if (ZALGO.test(s)) return "contains too many stacked accent marks";
  if (DANGEROUS_MARKUP.test(s)) return "contains code or markup that isn't allowed";
  if (o.markup === "none" && HTML_TAG.test(s)) return "can't contain HTML tags";

  // Runs of the same character; whitespace runs are fine (newlines/indentation in prose).
  const run = new RegExp(`(\\S)\\1{${o.maxRepeat},}`, "u");
  if (run.test(s)) return "repeats the same character too many times";

  const tokens = s.split(/\s+/).filter(Boolean);
  if (tokens.some((t) => t.length > o.maxTokenLength && !URLISH.test(t))) {
    return `has a word longer than ${o.maxTokenLength} characters — add spaces`;
  }

  const visible = [...s.replace(/\s+/g, "")];
  const symbols = visible.filter((c) => !/[\p{L}\p{M}\p{N}]/u.test(c)).length;
  if (visible.length >= 4 && symbols / visible.length > o.maxSymbolRatio) {
    return "contains too many symbols or special characters";
  }
  if (visible.length > 0 && symbols === visible.length) return "must contain letters or numbers";

  if (o.gibberish) {
    const words = latinWords(s).filter((w) => w.length >= 6);
    if (words.length > 0) {
      const junk = words.filter(isGibberishWord).length;
      if (junk / words.length > 0.5) return "looks like random characters — please write real words";
    }
  }
  return null;
}
