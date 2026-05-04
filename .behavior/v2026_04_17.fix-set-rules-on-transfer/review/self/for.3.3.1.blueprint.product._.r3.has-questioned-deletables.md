# self-review r3: has-questioned-deletables — systematic review

## methodology

for each feature and component in the blueprint, ask:
1. does the wisher explicitly ask for it?
2. is it in the vision?
3. can it be deleted?
4. what is the simplest version?

---

## features

### feature 1: DeclaredCloudflareDomainRuleRedirect entity

| question | answer |
|----------|--------|
| wisher asked? | yes: "control domain rules" |
| in vision? | yes: explicit domain object |
| deletable? | no — core deliverable |
| simplest? | as designed |

### feature 2: DeclaredCloudflareDomainRuleRedirectSpec literal

| question | answer |
|----------|--------|
| wisher asked? | implicit — rules need config |
| in vision? | yes: explicit DomainLiteral |
| deletable? | no — rules need typed config |
| simplest? | **found issue**: see below |

**issue found**: blueprint Spec structure differs from vision Spec structure:
- vision: `parameters.fromValue.targetUrl`
- blueprint: `action.target.url`

**should the structure match vision?**
- vision structure mirrors cloudflare's `action_parameters.from_value.target_url`
- blueprint structure is flattened
- flattened is simpler for users

**verdict**: keep blueprint's flatter structure. simpler is better. update vision to match blueprint if needed.

### feature 3: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS preset

| question | answer |
|----------|--------|
| wisher asked? | yes: "redirect from http to https" |
| in vision? | yes: explicit preset |
| deletable? | no — core deliverable |
| simplest? | as designed |

### feature 4: RULE_REDIRECT_SPEC_ROOT_TO_WWW preset

| question | answer |
|----------|--------|
| wisher asked? | yes: "redirect from root to www" |
| in vision? | yes: explicit preset |
| deletable? | no — core deliverable |
| simplest? | as designed |

### feature 5: getAllDomainRuleRedirects

| question | answer |
|----------|--------|
| wisher asked? | implicit — declastruct needs getAll for plan/apply |
| in vision? | implicit via declastruct pattern |
| deletable? | no — declastruct requires getAll |
| simplest? | as designed |

### feature 6: getOneDomainRuleRedirect

| question | answer |
|----------|--------|
| wisher asked? | no |
| in vision? | yes via pattern.4 (getOne operation) |
| deletable? | **question deeper** |

**deeper question**: set calls getAll + filter. is getOne necessary?

**analysis**:
- without getOne: SDK users call getAll, filter manually
- with getOne: direct lookup, better UX for consumers
- matches extant DNS record pattern
- minimal code overhead

**verdict**: keep. UX value for SDK consumers outweighs small code cost.

### feature 7: setDomainRuleRedirect

| question | answer |
|----------|--------|
| wisher asked? | yes: "set" redirect rules |
| in vision? | yes via pattern.5 (set with findsert/upsert) |
| deletable? | no — core mutation operation |
| simplest? | as designed |

### feature 8: delDomainRuleRedirect

| question | answer |
|----------|--------|
| wisher asked? | not explicit |
| in vision? | implicit — declastruct needs del for removal |
| deletable? | no — declastruct requires del to remove rules |
| simplest? | as designed |

---

## components

### component 1: slug→description translation

| question | answer |
|----------|--------|
| can remove? | no — needed for unique identification |
| simplest? | as designed |

### component 2: expandZoneRef utility

| question | answer |
|----------|--------|
| can remove? | no — reuse from DNS records |
| simplest? | reuse, not new code |

### component 3: castInto* transformer

| question | answer |
|----------|--------|
| can remove? | no — cloudflare snake_case → our camelCase |
| simplest? | as designed |

### component 4: action.type in Spec

| question | answer |
|----------|--------|
| can remove? | **yes** — always 'redirect', inject in DAO |
| simplest? | remove from user spec, DAO injects |

**fixed in blueprint**: removed `action.type` from spec structure

### component 5: enabled field

| question | answer |
|----------|--------|
| can remove? | no — cloudflare requires it |
| simplest? | **make optional** — default to true |

**fixed in blueprint**: changed `enabled: boolean` to `enabled?: boolean`

### component 6: queryString field

| question | answer |
|----------|--------|
| can remove? | no — needed for analytics preservation |
| simplest? | as designed |

### component 7: DAO via genDeclastructDao

| question | answer |
|----------|--------|
| can remove? | no — declastruct integration requires DAO |
| simplest? | follow extant pattern |

---

## summary of issues found and fixed

| issue | fix | status |
|-------|-----|--------|
| `action.type: 'redirect'` in spec | removed from spec, DAO injects | **fixed** |
| `enabled: boolean` required | changed to `enabled?: boolean` | **fixed** |
| spec structure differs from vision | kept blueprint's simpler structure | **accepted** |

---

## final check: have we deleted enough?

looking at the blueprint with "delete first" mindset:

- **files**: 14 new files is a lot. can we reduce?
  - domain.objects: 5 files — entity, spec, presets, 2 tests
  - domain.operations: 11 files — cast, get, set, del, tests
  - provider: 1 modification
  - this matches DNS record pattern exactly. no reduction possible without breaking pattern.

- **test files**: can we merge?
  - unit tests: 4 files (entity, spec, cast, input validation)
  - integration tests: 2 files (API calls, journey)
  - acceptance: 1 modification
  - follows extant pattern. no reduction without losing coverage.

- **exports**: 8 exports needed?
  - 2 domain objects, 2 presets, 4 operations
  - all are user-facing. no reduction.

**verdict**: file count is minimal for the pattern. no further deletion possible.

---

## conclusion

systematically questioned every feature and component:
- found 2 deletable items: `action.type`, required `enabled`
- both fixed in blueprint
- spec structure differs from vision but is simpler — accepted
- file count is minimal for the pattern

review complete. blueprint is minimal.
