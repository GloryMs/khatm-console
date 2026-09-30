# SESSION-C13a-holderref-contract (نسخة نهائية) — عقد `holderRef` في مسارَي الإصدار بعد KH-2.8.2

> **المستودع:** `khatm-console` — VSCode / Claude Code · **الفرع:** `feat/C13a-holderref-contract`
> **يحل محل** مسوَّدة Claude Code (2026-09-24) بعد اعتماد veto KH-2.8.2 (2026-09-27): **V1-(ب)** — `holderRef` اختياري لجلسات البشر وتولّده المنصة عند غيابه؛ إلزامي 64-hex لعملاء M2M فقط.
> **بوابة الجدولة:** KH-2.8.2-BE **مدموج** في `khatm-platform` (يحوي `IssueResponse.holderRef` وV19). لا يبدأ قبل ذلك.
> **لماذا:** المنصة ترفض أي `holderRef` مُقدَّم ليس 64-hex (`400 KH-ISS-0400`) وأي مفتاح هوية وطنية في `claims`؛ الكونسول اليوم يرسل نصاً حراً في موضعين. بعد 2.8.2 صار الحقل اختيارياً للبشر فينكسر موضع واحد فقط إن أُدخلت قيمة غير صالحة — لكن التجربة تحتاج إعادة صياغة.
> **اللغة:** سرد عربي، كود وعقود إنجليزية.

## Preamble (بوابة)

1. `khatm-platform` `main` يحوي PR الـ KH-2.8.2؛ `npm run contract:update` يسحب `IssueResponse.holderRef`، `IssueResponse.claimCode`/`claimCodeExpiresAt`، `IssueRequest.mintClaimCode`، ومسارات `/api/v1/issuer-clients`. **إن غابت ← SELF-STOP وشخّص المصدر** (درس C11).
2. `npm run check` أخضر على `main`.
3. operationIds القائمة لم تتغير بعد الـ re-vendor؛ أي تغيّر في اسم دالة مولَّدة موجودة = بلاغ للمنصة.

## Scope

### D1 — أداة مشتركة `holderRef`
`src/lib/holderRef.ts`: `HOLDER_REF_PATTERN = /^[0-9a-f]{64}$/`، `normalizeHolderRef(input)` = `trim()` ثم `toLowerCase()`، `isValidHolderRef(input)`. TSDoc: القيمة إن وُجدت فهي مرجع مستعار (عادةً HMAC-SHA256 يحسبه نظام الجهة)؛ الكونسول يتحقق من الشكل فقط ولا يفسّر المعنى ولا يولّده.

### D2 — نموذج الإصدار المفرد المُصادَق (`features/attestedIssuance`)
- zod: `holderRef` **اختياري**؛ إن غير فارغ → refine على `isValidHolderRef(normalize(v))` برسالة `issue.holderRefInvalid`. **يُحذف `holderRefRequired`** من هذا النموذج.
- `request.ts`: إن كانت القيمة فارغة بعد التطبيع **لا يُرسَل الحقل إطلاقاً** (لا `""`, لا `null`, لا `undefined` صريح في JSON)؛ وإلا تُرسَل مُطبَّعة.
- نص المساعدة `issue.holderRefHelp` (EN/AR): «إن كان لجهتكم نظام يحسب المرجع المستعار للحامل (64 خانة hex) أدخله هنا؛ وإلا اتركه فارغاً وسيُولَّد مرجع عشوائي. **لا تُدخل الرقم الوطني أو أي بيانات شخصية هنا أبداً.**» مع مثال شكلي بلا قيمة حقيقية.
- الحقل: `dir="ltr"`، خط أحادي، `autoComplete="off"`، `spellCheck={false}`؛ `unicode-bidi: embed` أينما عُرضت القيمة.
- **شاشة النجاح/`ReviewStep`:** تعرض `IssueResponse.holderRef` (المولَّد أو المُرسَل) بخط أحادي LTR + زر نسخ + نص `issue.holderRefGenerated`: «مرجع الحامل — احفظه في سجل جهتكم إن أردتم الرجوع إلى هذه الوثيقة لاحقاً». يظهر دائماً (لا فقط عند التوليد) لتوحيد التجربة.

### D3 — الإصدار الدفعي (`features/bulkIssuance`)
- `rowValidation.ts`: `pseudoRef` **اختياري**؛ إن وُجد يُطبَّع ويُتحقَّق (خطأ صف مُترجم `issueBulk.row.pseudoRefInvalid`)؛ الصف الفارغ **صالح** ويُرسَل بلا الحقل.
- `UploadMapStep`: عمود `pseudoRef` **غير إلزامي** للمتابعة؛ نص العمود (`issueBulk.upload.pseudoRefColumn`) يذكر الشكل 64 hex وأن الفارغ يُولَّد.
- `request.ts`: لا `|| undefined`؛ الحقل يُحذف من الصف إن كان فارغاً.
- **نتائج الدفعة:** عمود جديد `holderRef` من `results[i].holderRef` (LTR أحادي) + **زر «تصدير النتائج CSV»** بأعمدة `index, ref, holderRef, status, error` — حتى تحتفظ الجهة بالربط بين صفوفها والمراجع المولَّدة. مفتاح `issueBulk.results.export`.
- سلوك الصفوف غير الصالحة: كما هو (استبعاد + تقرير) مع سبب الاستبعاد الجديد.

### D4 — معالجة `KH-ISS-0400`
- مفتاح محلي `errors.issuance.validation-failed` (EN/AR) وفق ترتيب الحل في CLAUDE.md؛ عرض `code` + `traceId`. لا تُظهر قيمة `holderRef` في رسالة الخطأ أو السجلات.

### D5 — re-vendor العقد
- `npm run contract:update` ثم `gen:api`؛ التغيّر إضافي فقط. **يُستهلك من الجديد `IssueResponse.holderRef` و`results[i].holderRef` فقط**؛ `claimCode`/`mintClaimCode`/`issuer-clients` تبقى لـ C13.

### D6 — تلميحان صغيران
- فلتر البحث `pseudoRef` يبقى نصاً حراً؛ يُضاف تلميح: «القيم الحديثة 64 خانة hex؛ الأقدم قد تكون نصاً حراً».
- `README.md:24-25` (يقول إن العقد بلا `provider`) قديم منذ 08-16 — يُصحَّح في نفس الـ PR.

## خارج النطاق
- حساب HMAC في المتصفح، أي حقل للرقم الوطني، أي توليد لـ `holderRef` في الكونسول (التوليد في المنصة حصراً — P1 + D9).
- شاشة `/clients` (C13)، `mintClaimCode`، `Idempotency-Key` (الكونسول لا يرسله — V6)، أي تغيير في المنصة.

## Veto points
- **V1** التطبيع trim + lowercase — الافتراضي نعم.
- **V2** تصدير نتائج الدفعة كـ CSV (D3) — الافتراضي نعم؛ البديل: عرض فقط.
- **V3** إظهار `holderRef` في شاشة النجاح دائماً أم عند التوليد فقط — الافتراضي دائماً.

## الاختبارات (أدنى حد)
1. `holderRef.ts`: 64 hex صغيرة ✔؛ كبيرة تُطبَّع ✔؛ 63/65 خانة، `g`، مسافات داخلية، `holder-1` ✘؛ فارغ/مسافات فقط → «غياب» لا «خطأ».
2. المفرد: فارغ → الطلب **بلا** مفتاح `holderRef`؛ `holder-att-001` → `issue.holderRefInvalid`؛ hex صالح كبير → يُرسَل صغيراً. (`AttestedIssuePage.test.tsx`, `attestation.no-file-egress.test.tsx` يُحدَّثان.)
3. شاشة النجاح تعرض `IssueResponse.holderRef` من الاستجابة الوهمية بخط أحادي LTR وزر نسخ.
4. الدفعي: صف بلا `pseudoRef` يُرسَل بلا الحقل؛ صف بقيمة غير صالحة يُستبعد بسببه؛ صف صالح يُطبَّع؛ لا `pseudoRef: undefined` في الطلب (`request.test.ts`, `rowValidation.test.ts`, `BulkIssuePage.test.tsx`).
5. نتائج الدفعة تُظهر `holderRef` لكل صف؛ التصدير ينتج CSV بالأعمدة الخمسة ويهرّب الفواصل؛ لا يحوي أي `claimCode`.
6. `KH-ISS-0400`: مفتاح محلي ar/en + `code`/`traceId`.
7. parity الـ i18n وعدم وجود نصوص حرفية (eslint)؛ اختبارات الإصدار/الدفعي القائمة تمر بلا تعديل دلالي بعد الـ re-vendor.

## بوابة مراجعة (مجد)
- **العربية إلزامية قبل الدمج:** `issue.holderRefHelp`, `issue.holderRefInvalid`, `issue.holderRefGenerated`, `issueBulk.row.pseudoRefInvalid`, `issueBulk.upload.pseudoRefColumn`, `issueBulk.results.export`, `errors.issuance.validation-failed`, تلميح فلتر البحث.
- **RTL:** حقول LTR داخل واجهة عربية؛ عمود `holderRef` في جدول النتائج.

## الترتيب مع المنصة
- **لا يُنشر إصدار المنصة الحاوي PR #69 + PR KH-2.8.2 قبل دمج هذه الجلسة**؛ يُنشران معاً، ثم خطوات KV v2 على staging (`deploy-staging.md`) قبل إنشاء أول عميل إصدار هناك.
- إن دُمجت هذه أولاً فهي متوافقة مع المنصة الجديدة فقط (تعتمد `IssueResponse.holderRef`) — لهذا بوابة الجدولة أعلاه.

## DoD
- [ ] preamble موثَّق (مصدر العقد، operationIds).
- [ ] D1–D6 منجزة؛ لا استخدام للحقول الجديدة خارج `holderRef`.
- [ ] الاختبارات 1–7 خضراء؛ `npm run check` أخضر كاملاً.
- [ ] README ميزتي `attestedIssuance`/`bulkIssuance` + README الجذر محدَّثة.
- [ ] `docs/STATE.md` للكونسول محدَّث (رابط قرار الخيار C + veto V1-(ب) من KH-2.8.2).
- [ ] مراجعة مجد للعربية وRTL موقَّعة في تعليق الـ PR.
