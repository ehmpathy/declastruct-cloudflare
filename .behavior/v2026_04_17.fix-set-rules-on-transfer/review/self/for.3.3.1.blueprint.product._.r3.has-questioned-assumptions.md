# self-review r3: has-questioned-assumptions

## methodology

surface all technical assumptions in the blueprint. for each:
1. what do we assume without evidence?
2. what if the opposite were true?
3. evidence or habit?
4. exceptions or counterexamples?
5. simpler approach?

---

## assumption 1: slug→description map is stable

**what we assume**: cloudflare's `description` field can reliably serve as our unique key

**evidence**:
- vision states "Cloudflare doesn't use description as unique key, we enforce uniqueness ourselves"
- research confirms description is freeform text, not indexed

**what if opposite?**: if cloudflare changed description to be unique per rule, our approach still works — we'd just get extra enforcement

**verdict**: valid assumption, evidence-based

---

## assumption 2: PUT entire ruleset is required

**what we assume**: cloudflare requires PUT of full ruleset, no per-rule operations

**evidence**:
- research [5]: "update the entire ruleset in a single operation"
- research on API endpoints shows GET ruleset and PUT ruleset, no PATCH rule

**what if opposite?**: if cloudflare added per-rule CRUD, we could simplify set/del operations

**can we verify?**: checked cloudflare SDK docs — only `phases.get()` and `rulesets.update()` exist, no individual rule operations

**verdict**: valid assumption, evidence-based

---

## assumption 3: http.host works for hostname match

**what we assume**: expressions must use `http.host`, not `cf.zone.name`

**evidence**:
- research [6][7]: "`cf.zone.name` is NOT available"
- tested in flagged research

**what if opposite?**: if zone.name worked, presets would be simpler (no hostname parse needed)

**verdict**: valid assumption, verified in research

---

## assumption 4: 301 is correct default for presets

**what we assume**: permanent 301 redirect is the right default

**evidence**:
- research on SEO signals: "301 redirects transfer SEO signals"
- standard practice for canonical redirects

**what if opposite?**: 302 in test, 301 for production. but presets are for production use.

**exceptions**: user wants 302 for test → use raw spec, not preset

**verdict**: valid assumption, evidence-based

---

## assumption 5: single redirects (zone-level) not bulk redirects (account-level)

**what we assume**: we implement Single Redirects in `http_request_dynamic_redirect` phase

**evidence**:
- research [11][12]: "Single Redirects operate at zone level, Bulk at account level"
- our usecase is per-zone rules

**what if opposite?**: bulk redirects would need account-level DAO, different architecture

**simpler approach?**: no — zone-level matches our domain model (zone refs in rules)

**verdict**: valid assumption, matches our domain model

---

## assumption 6: flat spec structure is simpler than vision structure

**what we assume**: `action.target.url` is clearer than `parameters.fromValue.targetUrl`

**evidence**: none — this is a design choice made in blueprint

**what if opposite?**: vision structure mirrors cloudflare's actual API (`action_parameters.from_value.target_url`)

**question**: should we match cloudflare's structure for easier mental map?

**analysis**:
| structure | pros | cons |
|-----------|------|------|
| blueprint (flat) | simpler for users | differs from cloudflare API |
| vision (nested) | mirrors cloudflare API | more verbose |

**verdict**: blueprint structure is fine. DAO handles translation. users don't need to know cloudflare's internal structure.

---

## assumption 7: getOne is necessary

**what we assume**: getOneDomainRuleRedirect adds value

**evidence**: matches DNS record pattern, enables direct lookup

**what if we deleted it?**:
- SDK consumers call getAll + filter manually
- declastruct internals work fine (set already uses getAll + filter)

**simpler approach**: ship without getOne, add later if users ask

**verdict**: **flagged** — getOne is not strictly necessary. but pattern consistency has value. keep for now, but note it's optional.

---

## assumption 8: we need both integration and unit tests

**what we assume**: test tree shows both unit tests (input validation) and integration tests (API calls)

**evidence**: follows extant test patterns

**simpler approach?**: skip unit tests for operations, rely on integration tests only

**verdict**: keep both. unit tests catch input validation issues fast. integration tests verify API behavior.

---

## assumption 9: presets are constants, not functions

**what we assume**: `RULE_REDIRECT_SPEC_HTTP_TO_HTTPS` is a constant, not a function

**evidence**: vision shows constants

**what if opposite?**: function like `createHttpsRedirectSpec({ domain })` could customize per domain

**analysis**: our presets work for any domain (expressions use `http.host` dynamically). no need for factory functions.

**verdict**: valid assumption, constants work

---

## assumption 10: enabled defaults to true

**what we assume**: `enabled?: boolean` defaults to true in DAO

**evidence**: research shows rules need enabled flag, typical default is true

**what if opposite?**: if default were false, users would need to explicitly enable every rule

**verdict**: valid assumption, true default matches user expectations

---

## summary

| assumption | verdict |
|------------|---------|
| slug→description map | valid |
| PUT entire ruleset | valid |
| http.host for match | valid |
| 301 default | valid |
| single redirects | valid |
| flat spec structure | valid (design choice) |
| getOne necessary | **flagged** — optional but kept for pattern |
| unit + integration tests | valid |
| presets as constants | valid |
| enabled defaults true | valid |

---

## issues found

**getOne is optional**: not strictly necessary. set/del use getAll internally. kept for SDK consumer UX and pattern consistency. documented as design choice, not requirement.

---

## conclusion

all assumptions are evidence-based or clearly documented design choices. one optional component (getOne) identified but kept for consistency. no changes needed.
