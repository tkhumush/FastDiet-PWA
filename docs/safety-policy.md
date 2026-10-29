# FastDiet safety policy

This release gates weight-loss, resting-energy previews, and fasting/accounting screens behind a shared local policy (`src/safetyPolicy.ts`). No clinician or dietitian has reviewed the app. Clinical and dietitian review is still recommended before release. Acknowledgement and BMI screening cannot prove that fasting is safe or diagnose an eating disorder.

## Scope and thresholds

Supported profiles: integer ages 18–90, heights 130–220 cm, supported sex and unit enums, finite numeric values without coercion, nonnegative finite stored accounting balances. Goal weight must be at least `18.5 * (heightCm / 100)^2` and at most 200 kg. Displayed minimums round upward to a tenth in the selected unit. Changing height revalidates the goal; goals are never silently corrected. Actual measurements must be greater than zero and at most 500 kg (an explicit product support bound, not a healthy-weight recommendation). Actual logged measurements retain raw converted precision; rounding is for display only. Underweight actual measurements remain truthful and are saved; they disable fasting and weight-loss screens. Adult BMI is not interpreted for minors. There is no universal intake floor and no BMR clamp.

The existing Harris–Benedict goal-weight resting estimate is unchanged for supported adults. It is neither TDEE nor a daily food allowance. Estimates are not instructions to skip or delay food or compensate with exercise. Existing eligible-adult accounting math is retained.

## Suitability and local storage

Suitability excludes under-18s, pregnancy/breastfeeding, current or past eating disorders, and type 1 diabetes treated with insulin. Other diabetes medications and medical conditions require clinician guidance. Acknowledgement (including a negative acknowledgement on revocation) and safety review version 1 are stored; no diagnosis or condition list is collected. An unknown version, missing acknowledgement, or revocation gates the app. Withdrawing suitability immediately restricts application state before the separate negative acknowledgement write, which works even when an active profile would fail validation. Back navigation and rerenders retain this session restriction after storage failure. The error offers a revocation retry; guidance resumes only after explicit reaffirmation and a successful validated profile save. If storage fails, the app cannot claim durable revocation: closing or reloading may load the older stored acknowledgement. Retry revocation successfully before closing or reloading to persist the restriction. No health history is rewritten or deleted by revocation. No analytics or network collection was added.

IndexedDB remains `fastdiet`, version 2, with existing stores unchanged. New optional profile fields preserve legacy readability, but actual current weight and current suitability review are required for activation. Raw legacy profiles can load into the correction screen; they never automatically migrate, convert a minor's age, acknowledge suitability, clear records, or activate calculations. Defaults apply only to fresh onboarding. Missing restored required fields remain blank/invalid until explicitly corrected; unknown balances and acknowledgement are never defaulted. Correction preserves prior records. Malformed accounting balances/dates are blocked and may require a future dedicated repair tool; they are not silently rewritten. The existing explicit, confirmed Reset app operation remains available, but is never invoked by the safety policy.

## Current-weight precedence and atomic writes

The newest logged measurement by timestamp (with an optional monotonic write sequence to resolve same-millisecond ties) determines current eligibility and workout estimates. It never falls back to a historical heavier weight or goal. The app waits for weight loading before rendering eligible screens. With no log, a supplied actual profile weight is used; the goal is never used. Malformed measurements fail closed.

A supplied changed current profile measurement (including an explicitly edited measurement timestamp) is written atomically with the profile as a new history row at save time. Existing rows are retained. The form displays the latest reading but preserves the stored profile measurement on unrelated edits, unless the user edits the actual-weight input. Bank, melt, and goal updates do not create weight rows. Successful profile saves refresh the weight hook. Truthful underweight logs are permitted independently of profile activation. Both review previews and domain profile writes validate the retained history together with any proposed explicit corrected measurement, using the same timestamp and sequence ordering as persistence. A new valid reading can supersede a latest underweight reading but cannot bypass malformed older rows; those remain fail closed without deletion or rewriting. Failed transactions roll back both profile and weight writes.

## Sources informing scope

- [NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner): adults, pregnancy/breastfeeding exclusions.
- [NHS adult BMI tool](https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults): adult screening and limitations.
- [Johns Hopkins intermittent fasting overview](https://www.hopkinsmedicine.org/health/wellness-and-prevention/intermittent-fasting-what-is-it-and-how-does-it-work): fasting suitability exclusions.

These sources inform guardrails; they do not validate the app or its accounting model.

## Verification

Dependencies must already be installed. No new dependency is needed.

- `npm test`: Node policy/calculation tests, then isolated Chromium IndexedDB/UI tests, including raw current-weight floor boundaries in metric/imperial units, missing restored age and balance, and malformed older history during previews and changed-measurement saves. The browser runner owns a loopback Vite server on port 4190 and stops it afterward.
- `npm run lint -- --format json`: compare rule/file error counts against the supplied baseline (15 pre-existing errors).
- `npm run build:native`: confirm `dist/sw.js` and `dist/registerSW.js` are absent.
- `npm run build`: restore final PWA output.
- `npm run test:sw`: use the final PWA build to test activation over an existing service worker and preserve synthetic IndexedDB data, on loopback port 4191.

Browser tools default to the environment's installed Playwright Core and `/usr/sbin/chromium`. All tests create isolated browser contexts and synthetic records. Screenshots and logs go outside the worktree under `/home/taymur/.hermes/cache/scratch/fastdiet-safety-artifacts`. No original user database, native platform file, secrets, deployment, or external account is accessed.
