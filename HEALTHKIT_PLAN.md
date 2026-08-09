# HealthKit Integration — Plan

> Status: **plan only, nothing implemented.** Branch `feat/healthkit`.
> Written 2026-08-09. Supersedes the HealthKit bullet in [ROADMAP.md](./ROADMAP.md),
> which names two plugins that turn out not to fit (see §2).

## 1. What we're building

| Data | Direction | Source of truth | Notes |
|---|---|---|---|
| Body mass (weight) | read **and** write | HealthKit | App imports history, writes new readings back |
| Workouts | read **and** write | HealthKit | App imports watch/other-app workouts, writes its own |
| Active energy burned | read only | HealthKit | Apple Watch accrues this all day; feeds the burn |
| Sex, date of birth, height | read only | HealthKit | Prefills onboarding |
| **Target weight** | — | **local only** | HealthKit has no concept of a goal weight |
| Meals / calories eaten | — | **local only** | Out of scope for v1 |

The asymmetry in the last two rows drives most of the design below, including the
reset behaviour.

## 2. Plugin choice — the roadmap's options don't work

Both plugins named in ROADMAP.md were evaluated and rejected:

| Plugin | Verdict |
|---|---|
| `@perfood/capacitor-healthkit` | **Rejected.** Peer dep is `@capacitor/core ^4.0.0`; we run 8.4.1. Last publish Feb 2025. Its own docs say the write functions "have not been tested." |
| `capacitor-health` (mley) | **Rejected.** Read-only, and supports no weight/body-mass type at all. |

Evaluated alternatives:

| Plugin | Cap 8 | Weight R/W | Workout read | Workout **write** | Aggregated active energy | Characteristics |
|---|---|---|---|---|---|---|
| `@capgo/capacitor-health` 8.10.1 | yes | yes / yes | yes | **no** | yes | no |
| `@flomentumsolutions/capacitor-health-extended` | yes | yes / yes | yes | **yes** | yes | yes (iOS) |

**Recommendation: `@flomentumsolutions/capacitor-health-extended`.** It is the only
option covering all four requirements in one dependency, and its
`getCharacteristics()` also gives us the onboarding prefill for free.

**But it carries real supply-chain risk** and that should be a conscious decision,
not a default: it is a fork of `mley/capacitor-health` published by a small
organisation, far less established than Capgo's. Before committing, Phase 0 below
verifies it actually does what its README claims.

Fallback if Phase 0 fails: `@capgo/capacitor-health` for everything except workout
writing, plus a small custom native plugin for `HKWorkout` saving. More code, but
the dependency is better maintained and the custom surface stays tiny.

## 3. No plugin supports background delivery — and we don't need it

None of the four expose `HKObserverQuery` or `enableBackgroundDelivery`. That
sounds like a blocker for "continuously add the burn throughout the day," but it
isn't, because **the app only needs the number while it is on screen.**

So v1 reads active energy on a foreground schedule:

- on app launch
- on resume from background — this is exactly pending task **#7**, which should
  land first
- on the existing 60-second dashboard timer

Background delivery only becomes necessary if we later want notifications or a
widget to update while the app is closed. Deferred, and it will need custom native
code when it comes.

## 4. The two correctness traps

These are the parts most likely to silently produce wrong numbers. Both need to be
settled before implementation, not during.

### 4.1 Double-counting active energy

The current model in [fastingMath.ts](./src/fastingMath.ts) subtracts basal burn
continuously (`bmrPerHr * hours`) and adds discrete workout energy on top via
`activeEnergyFor()`, which sums `WorkoutEntry.caloriesBurned` from MET estimates.

HealthKit's `activeEnergyBurned` is energy **above** resting — which is a clean
conceptual match for our basal subtraction, so it slots in without changing the
model. The trap is everything that can supply that number at once:

1. Apple Watch writes active energy all day, and that **already includes** energy
   burned during workouts.
2. A workout saved to HealthKit with an energy total also produces active-energy
   samples. So writing our own workout to HealthKit and then reading aggregated
   active energy back returns our own workout's calories.
3. The local `WorkoutEntry.caloriesBurned` MET estimate is a third estimate of the
   same physical thing.

Counting any two of those together inflates the burn and tells the user they can
eat more than they can.

**Rule: once HealthKit is authorised and returning data, HealthKit is the single
source of truth for active energy.** Local workout entries become display/history
records; their `caloriesBurned` feeds the math *only* when HealthKit is
unavailable, unauthorised, or returns nothing for the window.

This makes `activeEnergyFor()` a fallback path rather than the primary one.
`summarize()` itself does not change — it already takes `activeEnergy` as a plain
number parameter, which is a clean seam. Only the *provider* in `Dashboard.buildView`
changes.

Known edge case, accepted and documented rather than solved in v1: a workout logged
while HealthKit was unauthorised counts locally; if the watch independently recorded
that same period and the user authorises later, that window can double-count.

### 4.2 Weight sync echo

We write weight to HealthKit and read weight from HealthKit. Without provenance
filtering, every reading the app writes is re-imported as a new local entry, and
each import/export cycle multiplies them.

Mitigations, in order of preference:

1. Filter on import by `HKSource` / bundle identifier, dropping samples this app
   wrote. **Requires the plugin to expose sample source — unverified.**
2. Store the returned HealthKit sample UUID on `WeightSample` and skip known UUIDs.
   **Requires the plugin to return UUIDs on write and read — unverified.**
3. Last resort: dedupe by (timestamp within tolerance, value within tolerance).
   Fragile — two genuine readings a minute apart at the same weight would collapse.

**Phase 0 must confirm whether option 1 or 2 is available.** If neither is, that is
a strong argument for the custom-native fallback, because `HKSource` filtering is
trivial in Swift and this bug class is nasty in production.

## 5. Reset behaviour

Current behaviour (shipped in #7): `clearAll()` wipes all four IndexedDB stores and
reloads into onboarding.

Required behaviour with HealthKit, per the product decision:

- Reset clears **local state only** and restarts onboarding.
- Onboarding then re-reads from HealthKit, so weight history, workouts and
  characteristics come back.
- Target weight is not in HealthKit, so the user re-enters it. This is intended.

**Non-negotiable safety rule: reset must never delete anything from HealthKit.**
HealthKit holds data the app does not own — years of weight readings, workouts
recorded by the watch and other apps. `clearAll()` must stay local, and no delete
path against HealthKit should exist in the codebase at all.

**The reset confirmation copy has to change.** Today it says it erases
*everything*, which stops being true: weight and workouts will reappear from
HealthKit, while meals and target weight are genuinely gone. A user resetting to
clear bad data and then seeing their weights return will reasonably think the reset
failed. [ResetAppModal.tsx](./src/components/ResetAppModal.tsx) needs to state the
split explicitly.

## 6. Onboarding changes

Add a "Connect Apple Health" step that:

- calls `isHealthAvailable()` first and skips the step entirely where unsupported
- requests only the types we actually use — over-requesting reads badly in the
  permission sheet and invites App Review questions
- prefills sex, age (derived from date of birth) and height from
  `getCharacteristics()`
- prefills current weight from the latest body-mass sample
- imports weight history for the trend chart
- **degrades cleanly when declined** — the existing manual onboarding stays as the
  fallback path and must remain fully functional

**Authorisation is deliberately opaque on iOS.** For *read* types, HealthKit does
not reveal whether the user granted or denied access; a denied read is
indistinguishable from no data. The UI must therefore never say "permission
denied" — it should say no data was found and offer a route to the Health app.
Write authorisation *can* be checked.

## 7. Native configuration

- `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` in
  [Info.plist](./ios/App/App/Info.plist)
- HealthKit capability and the `com.apple.developer.healthkit` entitlement on the
  App target — this is the first entitlement the project needs, so signing will
  need checking
- Do **not** add `healthkit` to `UIRequiredDeviceCapabilities`; that would exclude
  devices rather than degrade gracefully, and the target family includes iPad
- App Store: HealthKit apps require a privacy policy, and guideline 5.1.3 forbids
  using health data for advertising or data mining. There is currently no privacy
  policy URL in the project — that is a release blocker independent of code

## 8. Phasing

Each phase should be independently reviewable and leave the app working.

| Phase | Work | Risk |
|---|---|---|
| **0** | Spike the chosen plugin on a real device: does it write workouts, return sample source/UUID, aggregate active energy over a range? Decide plugin vs custom native. | Gate — everything below depends on the answer |
| **1** | Entitlement, usage strings, `isAvailable()`, permission request, graceful degradation when declined | Low |
| **2** | Read characteristics + weight history → onboarding prefill | Low |
| **3** | Write weight to HealthKit + echo prevention (§4.2) | **High** |
| **4** | Active energy read + precedence rule (§4.1) | **Highest — this is the core math** |
| **5** | Workout read/write | Medium |
| **6** | Reset semantics + confirmation copy (§5) | Low, but easy to get wrong quietly |
| **7** | Real-device verification with an Apple Watch | — |

Sequencing note: pending task **#7 (recalculate on resume)** should land before
Phase 4, since the resume hook is how fresh active-energy data reaches the
dashboard.

## 9. Testing

The simulator can hold HealthKit samples added by hand through the Health app, which
covers Phases 1–3 and 5. **Phase 4 cannot be verified in the simulator** — continuous
Apple Watch active energy needs a real paired watch.

There is currently **no test suite in this repo at all.** The precedence logic in
§4.1 is exactly the kind of pure, high-consequence rule that should not be verified
by hand-clicking. `summarize()` is already pure and takes an explicit `now`, so it
is trivially testable. Recommend standing up a test runner as part of Phase 4, which
also serves pending task **#15** (past-dated meal math).

## 10. Open questions

1. Plugin vs custom native — decided by Phase 0.
2. Does the plugin expose `HKSource` or sample UUIDs? Blocks §4.2.
3. Should manually logged workouts be written to HealthKit by default, or behind a
   setting? Writing by default is friendlier but puts MET estimates into the user's
   permanent health record.
4. Should the app also write meals as `dietaryEnergyConsumed`? Out of scope for v1,
   but it is the natural next step and would make FastDiet a fuller Health citizen.
5. Privacy policy URL — needed for App Review, does not exist yet.
