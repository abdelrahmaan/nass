// القواعد. كل قاعدة كائن فيه id وعنوان ودالة apply بتاخد نص وترجّع نص.
// الترتيب مهم: القواعد بتتطبّق واحدة ورا التانية، والمسافات آخر حاجة
// علشان تنضّف ورا اللي قبلها.
//
// الـ repo ده بيبدأ بقاعدتين شغالين بس. الباقي في PLANNED تحت — دي شغلك.

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const rules = [
  {
    id: "digits",
    title: "أرقام عربية-هندية ← أرقام غربية",
    apply(text) {
      return text.replace(/[٠-٩۰-۹]/g, (d) => {
        const i = AR_DIGITS.indexOf(d);
        return String(i >= 0 ? i : FA_DIGITS.indexOf(d));
      });
    },
  },
  {
    id: "tatweel",
    title: "شيل التطويل (كــتاب ← كتاب)",
    apply(text) {
      return text.replace(/ـ+/g, "");
    },
  },
];

// القواعد اللي لسه متكتبتش. ضيفها فوق واحدة واحدة وشوف رقم الـ eval بيتحرّك.
// check.js بيعدّها، فهي كمان مقياس تقدّمك.
export const PLANNED = [
  {
    id: "diacritics",
    title: "شيل التشكيل (بِسْمِ ← بسم)",
    hint: "المدى \\u064B-\\u0652 و\\u0670 و\\u06D6-\\u06ED.",
  },
  {
    id: "dictionary",
    title: "تصحيحات من قاموس",
    hint: "اقرا lib/fixes.json وبدّل الكلمة كاملة بس — مش جزء من كلمة.",
  },
  {
    id: "punctuation",
    title: "علامات ترقيم لاتينية ← عربية",
    hint: ", ← ، و ; ← ؛ و ? ← ؟ — بس لما تكون جنب حروف عربية، مش جوّه URL أو كلمة إنجليزي.",
  },
  {
    id: "repeats",
    title: "علامات مكررة (؟؟؟ ← ؟)",
    hint: "ينفع تكون سطر واحد replace.",
  },
  {
    id: "spaces",
    title: "مسافات",
    hint: "مسافتين ← مسافة، شيل المسافة قبل ، . ؟ ! ؛ :، وحطّ مسافة بعدها لو ناقصة، وtrim.",
  },
];

/** كل القواعد المتوقعة — المكتوبة والناقصة. check.js بيستخدمها. */
export const ALL_RULE_IDS = [
  ...rules.map((r) => r.id),
  ...PLANNED.map((r) => r.id),
];
