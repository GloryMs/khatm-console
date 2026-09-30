# SESSION-C13 — شاشة `/clients` (عملاء الإصدار M2M) في khatm-console

> **Repo:** `khatm-console` · **Branch:** `feat/C13-issuer-clients` · **Spec:** FS-2.7a D10 (+ D2, D9, D11)
> **Platform:** KH-2.8.1-BE (PR #69) + KH-2.8.2-BE (PR #70) على `main` · **Precedents:** C10 (حوار الدوران
> بالتحذير)، C12 (`/org` والتصرف بالنيابة)، C2b (عرض مفتاح مرة واحدة لأطراف الاستهلاك)
> **الهدف:** إدارة `issuer_client` من الكونسول بصلاحية `key:manage` — فتنتفي الحاجة إلى Swagger/curl لإعداد
> أي جهة، ويصبح المحاكي (SIM-01) قابلاً للتغذية بمفتاح من واجهة حقيقية.

---

## 1. Preamble gates
- [ ] `khatm-platform` `main` ≥ PR #70 (`git log`). `npm run contract:update` ثم تأكد من وجود:
  `GET/POST /api/v1/issuer-clients`, `/{id}/rotate|suspend|resume|revoke`,
  `GET /api/v1/org/children/{id}/issuer-clients` (المسار بالـ **id** لا الـ slug — الكود هو المرجع)،
  الحقول `keyPrefix`, `apiKey`, `holderHmacSecret`, `retiringClientId`, `status` (`ACTIVE|RETIRING|SUSPENDED|REVOKED`)،
  `lastUsedAt`, `allowedSchemaIds`, `rotatedFrom`, `retireAfter`. **توقف ذاتي** عند غياب أي منها.
- [ ] `MeResponse.scopes` موجود (لإخفاء الشاشة بلا `key:manage`) — إن غاب: توقف وسجّل platform-ask.
- [ ] baseline `npm run typecheck/lint/test` أخضر (313/313).
- [ ] **تحقيق:** هل قراءة `platform:admin` عبر المستأجرين مُنفَّذة على المنصة؟ STATE المنصة يقول **غير منفَّذة**
  (out of scope في 2.8.1). إن كانت كذلك → D4 أدناه يُقلَّص إلى «قراءة مستأجر الجلسة فقط» ويُسجَّل platform-ask.

## 2. نقاط الفيتو
| # | السؤال | الافتراضي |
|---|---|---|
| V1 | موضع الشاشة: مسار `/clients` وقائمة جانبية «عملاء الإصدار» تحت Key management | نعم؛ تظهر فقط مع `key:manage` |
| V2 | عرض المفتاح مرة واحدة: حوار غير قابل للإغلاق إلا بعد النقر «نسخت المفتاح» + تحذير عربي/إنجليزي + عدم تخزينه في أي state بعد الإغلاق | نعم (نمط C2b) |
| V3 | سر الحامل (`holderHmacSecret`) يظهر في نفس الحوار مع شرح «هذا السر للـ connector فقط، لا يُستخدم في ختم، ولا يُعرض ثانيةً» | نعم؛ كتلة منفصلة بلون تحذير |
| V4 | التدوير: حقل `retireAfterHours` 0–72 (افتراضي 24) + تحذير «العميل القديم يتوقف بعد N ساعة» | نعم |
| V5 | الإبطال: `TypeToConfirmDialog` بكتابة `keyPrefix` | نعم |
| V6 | قائمة الحالة: شارات ملوّنة بنفس مفردات أطراف الاستهلاك؛ `lastUsedAt` نسبي | نعم |

## 3. التسليمات
- **D1** `features/issuerClients/`: `api.ts` (المولَّد فقط)، `ClientsPage`, `CreateClientDialog`
  (name ar/en، `allowedSchemaIds` من `GET /schemas` متعدد الاختيار، `expiresAt` اختياري)،
  `RevealSecretsDialog` (V2/V3)، `RotateDialog` (V4)، أزرار suspend/resume/revoke (V5).
- **D2** i18n `clients.*` EN/AR + `errors.icl.*` لأكواد `KH-ICL-*` عبر آلية `errors.<messageKey>` القائمة
  (بما فيها `KH-ICL-0503` = «Vault غير متاح — لم يُنشأ العميل»).
- **D3** تبويب «عملاء الإصدار» في صفحة الابن داخل `/org` (C12) يستهلك `GET /org/children/{id}/issuer-clients`
  بنفس شريط «تتصرف بالنيابة عن» — قراءة + الأفعال إن وفّرتها المنصة (التحقيق يحسم).
- **D4** قراءة `platform:admin` عبر المستأجرين إن كانت متاحة (انظر البوابة الأخيرة).
- **D5** README الميزة + `docs/STATE.md`.

## 4. الاختبارات
الشاشة مخفية بلا `key:manage`؛ إنشاء → الحوار يعرض المفتاح والسر مرة واحدة ولا يبقيان في DOM/state بعد الإغلاق؛
تدوير يعرض `retiringClientId`؛ إبطال يتطلب `keyPrefix` الصحيح؛ `KH-ICL-0503` يُعرض بـ code/traceId؛
`no-secret-egress`: لا `khi_` في أي لوغ/تصدير؛ اختبار RTL grep المعتاد.

## 5. الجولة الحية **[MAJD]**
إنشاء عميل جديد للمستأجر الافتراضي → نسخ المفتاح إلى `.env` المحاكي (SIM-01) → إصدار من المحاكي ينجح
→ تعليق العميل → المحاكي يتلقى 401 معروضاً بـ code → استئناف → ينجح → تدوير بـ 0 ساعة → المفتاح القديم
يفشل فوراً والجديد ينجح → إبطال. إن كان SIM-01 غير مدموج بعد: نفس التسلسل بـ curl من مجد. مرور AR/EN/RTL.

## 6. DoD / خارج النطاق
DoD: الاختبارات + الجولة + مراجعة العربية + STATE + PR مفتوح.
خارج النطاق: أي تعديل على المنصة؛ إنشاء عملاء من داخل `/org` إن لم توفّره المنصة (يُسجَّل)؛ عرض/تدوير سر
الحامل بعد الإنشاء (لا endpoint له — سلوك مقصود P1).

---

## نتيجة الجلسة (ملخص — السرد الكامل في `docs/STATE.md`)

**الحالة: DONE.** تسليم D1–D3 وD5 كاملاً؛ **D4 لم يُبنَ** — التحقيق أكّد أن قراءة `platform:admin` العابرة
للمستأجرين غير موجودة في العقد المطابَق (لا `/admin/issuer-clients` ولا أي مسار مشابه)، فسُجِّل platform-ask
بدل بناء شيء بلا عقد. التبويب في `/org/children/:id` (D3) تبيّن أنه أوسع من الافتراض: المنصة توفّر دورة حياة
كاملة (إنشاء/تدوير/تعليق/استئناف/إبطال) للأب على عملاء ابنه، لا قراءة فقط.

**فجوة حقيقية بين البريف والكود:** D2 افترض `errors.icl.*`؛ القراءة المباشرة لـ `ErrorCode.java` في
`khatm-platform` أظهرت أن الـ `messageKey` الفعلي هو `issuer-client.*` (`validation-failed`, `not-found`,
`invalid-transition`, `holder-secret-unavailable`) — بُني ضد القيم الحقيقية لا افتراض البريف.

**بروفة حية (2026-09-29/30، Docker Desktop محلي)** — أجراها مجد بعد إعادة بناء حاوية `khatm-console` من
الفرع: مرّت. **PR مفتوح ومدموج** إلى `main` بعد الموافقة. السجل الكامل — بما فيه الاختبارات (333/333)،
الأخطاء المكتشفة والمُصلَحة أثناء الكتابة، وإجابات الـ veto — في `docs/STATE.md` تحت هذه الجلسة، وفي رسالة
الـ PR.
