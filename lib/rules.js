// The rules. Each rule is an object with an id, a title, and an apply function that
// takes text and returns text. Order matters: rules run one after another, and
// spacing goes last so it can clean up after everything before it.
//
// The repo starts with only two working rules. The rest are in PLANNED below — they are your job.

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const rules = [
  {
    id: "digits",
    title: "Arabic-Indic digits → Western digits",
    apply(text) {
      return text.replace(/[٠-٩۰-۹]/g, (d) => {
        const i = AR_DIGITS.indexOf(d);
        return String(i >= 0 ? i : FA_DIGITS.indexOf(d));
      });
    },
  },
  {
    id: "tatweel",
    title: "Remove tatweel (كــتاب → كتاب)",
    apply(text) {
      return text.replace(/ـ+/g, "");
    },
  },
];

// The rules that haven't been written yet. Move them up one at a time and watch the eval score move.
// check.js counts them, so they are also a measure of your progress.
export const PLANNED = [
  {
    id: "diacritics",
    title: "Remove diacritics (بِسْمِ → بسم)",
    hint: "The ranges \\u064B-\\u0652, \\u0670 and \\u06D6-\\u06ED.",
  },
  {
    id: "dictionary",
    title: "Corrections from a dictionary",
    hint: "Read lib/fixes.json and replace whole words only — never part of a word.",
  },
  {
    id: "punctuation",
    title: "Latin punctuation → Arabic punctuation",
    hint: ", → ، and ; → ؛ and ? → ؟ — only next to Arabic letters, never inside a URL or an English word.",
  },
  {
    id: "repeats",
    title: "Repeated marks (؟؟؟ → ؟)",
    hint: "Can be a single replace.",
  },
  {
    id: "spaces",
    title: "Spacing",
    hint: "Two spaces → one; remove the space before ، . ؟ ! ؛ : and add one after if missing; then trim.",
  },
];

/** Every expected rule — written and missing. check.js uses this. */
export const ALL_RULE_IDS = [
  ...rules.map((r) => r.id),
  ...PLANNED.map((r) => r.id),
];
