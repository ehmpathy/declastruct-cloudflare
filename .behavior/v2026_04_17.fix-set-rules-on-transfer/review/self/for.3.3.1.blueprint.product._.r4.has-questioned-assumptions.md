# self-review r4: has-questioned-assumptions — deeper questions

## r3 found 10 assumptions. but were we deep enough?

r3 questioned implementation details. r4 questions whether the implementation is needed at all.

---

## fundamental assumption 1: do we need domain objects?

**what we assume**: we need DomainEntity + DomainLiteral for redirect rules

**what wisher said**: "control domain rules via cloudflare api tokens"

**simpler approach?**:
- just expose `setRedirectRule({ zone, slug, expression, targetUrl, statusCode })`
- no domain objects, no classes, just functions

**what if we did this?**:
- less code (no entity/literal classes)
- less type safety (no nested validation)
- no integration with declastruct (requires domain objects)

**why keep domain objects**:
- declastruct requires domain objects for plan/apply workflow
- vision explicitly declares DomainEntity/DomainLiteral
- matches extant DNS record pattern

**verdict**: keep domain objects. declastruct integration is core to the wish.

---

## fundamental assumption 2: do we need declastruct pattern?

**what we assume**: redirect rules go through declastruct plan/apply workflow

**simpler approach?**: just expose SDK functions, no declarative layer

**what wisher said**: "control domain rules" — doesn't explicitly say declarative

**but context matters**:
- this is declastruct-cloudflare package
- the entire repo is about declarative control
- DNS records, zones, registrations all use declastruct

**verdict**: keep declastruct pattern. package purpose is declarative control.

---

## fundamental assumption 3: do we need presets?

**what we assume**: `RULE_REDIRECT_SPEC_HTTP_TO_HTTPS` and `ROOT_TO_WWW` presets are valuable

**what wisher said**:
- "redirect from root to www (this is a template of cloudflares)"
- "redirect from http to https (also a template)"

**wait**: wisher says these are "templates of cloudflares" — cloudflare has built-in templates?

**research check**:
- "Always Use HTTPS" is a managed toggle, not a template
- "Root to www" has no managed equivalent

**simpler approach?**:
- just expose raw spec, let users define their own constants
- or reference cloudflare's built-in features

**why keep presets**:
- wisher explicitly asked for these two redirects
- presets encode best practices (301, queryString preserve)
- consistent with vision

**verdict**: keep presets. wisher explicitly asked for them.

---

## fundamental assumption 4: do we need both findsert AND upsert?

**what we assume**: setDomainRuleRedirect supports both findsert and upsert

**simpler approach?**: just upsert (always overwrite if exists)

**analysis**:
| operation | behavior | use case |
|-----------|----------|----------|
| findsert | find, return if exists | avoid accidental overwrite |
| upsert | always overwrite | intentional update |

**declastruct pattern requires both**:
- findsert: declastruct uses this for "no changes needed"
- upsert: declastruct uses this for intentional updates

**verdict**: keep both. declastruct pattern requires it.

---

## fundamental assumption 5: do we need zone refs?

**what we assume**: rules reference zones via `RefByUnique<typeof Zone>`

**simpler approach?**: just take `zoneName: string`

**why refs**:
- enables declaration before zone exists
- declastruct resolves refs at apply time
- matches DNS record pattern

**verdict**: keep refs. enables powerful declarative patterns.

---

## fundamental assumption 6: is the DAO layer necessary?

**what we assume**: operations wrap in genDeclastructDao for provider integration

**simpler approach?**: expose operations directly without DAO wrapper

**why DAO**:
- declastruct provider pattern requires DAO with getAll/set/del
- enables plan/apply workflow
- matches extant provider structure

**verdict**: keep DAO. declastruct provider requires it.

---

## fundamental assumption 7: did we choose the right cloudflare API?

**what we assume**: `http_request_dynamic_redirect` phase is correct

**cloudflare has multiple redirect options**:
1. Single Redirects (zone rulesets) — what we chose
2. Bulk Redirects (account-level lists)
3. Page Rules (legacy, deprecated)
4. "Always Use HTTPS" toggle

**why single redirects?**:
- zone-level matches our domain model
- supports dynamic expressions
- not deprecated (unlike Page Rules)
- research confirmed this choice

**verdict**: correct API choice, evidence-based.

---

## fundamental assumption 8: expression syntax will work

**what we assume**: expressions like `(http.request.uri.scheme eq "http")` work

**evidence**:
- cloudflare docs show this syntax
- research tested expressions

**what if broken in production?**:
- premortem identified this risk
- v1 relies on cloudflare API validation
- deferred syntax validation is acceptable

**verdict**: valid assumption, risk documented.

---

## fundamental assumption 9: we understand cloudflare's actual API response

**what we assume**: castInto* can transform cloudflare response to our shape

**evidence**:
- research documented API response structure
- access research has endpoint examples

**risk**: if cloudflare response differs, cast will fail

**mitigation**: integration tests verify actual API responses

**verdict**: valid assumption, test coverage protects us.

---

## fundamental assumption 10: users want consistent redirect policies

**what we assume**: the value is "consistent redirect policies across domains"

**evidence**:
- vision states "12 domains with consistent redirect rules"
- audience research confirms 5+ domains is typical

**what if users have 1 domain?**: still works, just less value

**verdict**: valid assumption, matches target audience.

---

## summary: fundamental assumptions hold

| assumption | verdict |
|------------|---------|
| need domain objects | yes — declastruct requires them |
| need declastruct pattern | yes — package purpose |
| need presets | yes — wisher asked for them |
| need findsert + upsert | yes — declastruct pattern |
| need zone refs | yes — enables declaration before zone exists |
| need DAO layer | yes — provider integration |
| correct cloudflare API | yes — research confirmed |
| expression syntax works | yes — documented, risk mitigated |
| understand API response | yes — integration tests verify |
| users want consistency | yes — target audience confirmed |

---

## conclusion

questioned 10 fundamental assumptions. all are evidence-based or required by package architecture. no changes needed.

r3 found implementation details to question. r4 confirmed the implementation itself is needed.
