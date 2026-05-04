# self-review r14: has-role-standards-adherance — comprehensive audit

## method

1. enumerated all briefs/ subdirectories for mechanic role
2. re-read blueprint yield.md line by line
3. checked each relevant rule against blueprint content
4. documented and fixed violations
5. verified fixes applied correctly

---

## rule directories enumerated

| directory | contains | applies? |
|-----------|----------|----------|
| code.prod/evolvable.architecture | bounded-contexts, directional-deps | yes |
| code.prod/evolvable.domain.objects | domain object patterns | yes |
| code.prod/evolvable.domain.operations | operation grains, verbs | yes |
| code.prod/evolvable.procedures | input-context, arrow-only | yes |
| code.prod/evolvable.repo.structure | directory structure, barrels | yes |
| code.prod/pitofsuccess.errors | fail-fast, error classes | no (impl detail) |
| code.prod/pitofsuccess.procedures | idempotent mutations | yes |
| code.prod/pitofsuccess.typedefs | type safety | no (impl detail) |
| code.prod/readable.comments | what-why headers | no (impl detail) |
| code.prod/readable.narrative | narrative flow | no (impl detail) |
| code.test/frames.behavior | given-when-then | yes |
| code.test/scope.coverage | coverage by grain | yes |

---

## issue 1: grain label violations

### define.domain-operation-grains

| grain | definition |
|-------|------------|
| transformer | pure computation, no i/o |
| communicator | raw i/o boundary, minimal translation |
| orchestrator | compose leaf operations into workflows |

### blueprint violations (lines 99, 121)

| operation | before | after | reason |
|-----------|--------|-------|--------|
| getAllDomainRuleRedirects | communicator | orchestrator | composes expandZoneRef + API + castInto |
| delDomainRuleRedirect | communicator | orchestrator | composes getAll + filter + PUT |

### extant evidence

getAllDomainDnsRecords (lines 19-34) composes:
```typescript
const zone = await expandZoneRef(input.zone, context);  // lookup
for await (const record of client.dns.records.list(...)) {  // API
  records.push(castIntoDeclaredCloudflareDomainDnsRecord(...));  // transform
}
```

this is orchestration, not raw communication.

### fix applied

changed both labels from (communicator) to (orchestrator) in blueprint.

---

## issue 2: exports list incomplete

### rule: extant pattern consistency

all entity operations export getOne per SDK index.ts:
- getOneDomainDnsRecord (line 28)
- getOneDomainRegistration (line 32)
- getOneDomainZone (line 37)

### blueprint violation (line 288-295)

exports list omitted: `getOneDomainRuleRedirect`

### fix applied

added `getOneDomainRuleRedirect` to exports list.

---

## standards verified: pass

### evolvable.architecture

| rule | status | evidence |
|------|--------|----------|
| bounded-contexts | pass | new files in domain.objects and domain.operations/domainRuleRedirect |
| directional-deps | pass | operations import from domain.objects (down), not from contract (up) |

### evolvable.domain.objects

| rule | status | evidence |
|------|--------|----------|
| domain-driven-design | pass | uses DomainEntity, DomainLiteral correctly |
| forbid-undefined-attributes | pass | id? is metadata (allowed), all others required |
| forbid-nullable-without-reason | pass | no nullable fields |
| require-immutable-refs | pass | zone is RefByUnique (immutable) |

### evolvable.domain.operations

| rule | status | evidence |
|------|--------|----------|
| define.domain-operation-grains | pass | (after fix) all grains labeled correctly |
| require-get-set-gen-verbs | pass | uses get/set/del per rule |
| require-sync-filename-opname | pass | filenames match operation names |

### evolvable.procedures

| rule | status | evidence |
|------|--------|----------|
| require-input-context-pattern | pass | all inputs use { key: value } shape |
| forbid-io-as-domain-objects | pass | inputs inline, not domain objects |
| require-single-responsibility | pass | one operation per file |

### evolvable.repo.structure

| rule | status | evidence |
|------|--------|----------|
| proper-directory-decomposition | pass | entity subdir under domain.operations |
| forbid-barrel-exports | pass | no index.ts in new directories |
| forbid-index-ts | pass | no index.ts except SDK entrypoint |

### pitofsuccess.procedures

| rule | status | evidence |
|------|--------|----------|
| forbid-nonidempotent-mutations | pass | uses findsert/upsert/delete |
| require-idempotent-procedures | pass | all operations idempotent by design |

### test frames

| rule | status | evidence |
|------|--------|----------|
| require-given-when-then | pass | journey tests use [caseN]/[tN] labels |
| require-test-coverage-by-grain | pass | unit for transformer, integration for orchestrators |

---

## line-by-line verification

| line | content | rule | status |
|------|---------|------|--------|
| 18-44 | filediff tree | proper-directory-decomposition | pass |
| 54-58 | interface fields | forbid-undefined-attributes | pass (id? is metadata) |
| 60-65 | static members | domain-driven-design | pass |
| 67-77 | spec structure | domain-driven-design | pass (DomainLiteral) |
| 79-86 | preset specs | constants | pass (no tests needed) |
| 93-127 | operations | grain labels | pass (after fix) |
| 139-142 | DAO structure | pattern consistency | pass |
| 156-159 | test coverage | test-coverage-by-grain | pass |
| 190-206 | test tree | test structure | pass |
| 213-232 | journey tests | given-when-then | pass |
| 288-296 | exports | pattern consistency | pass (after fix) |

---

## summary

**issues found**: 2
1. grain labels: getAllDomainRuleRedirects and delDomainRuleRedirect mislabeled as communicator
2. exports: getOneDomainRuleRedirect omitted

**fixes applied**: both issues corrected in blueprint

**verification**: re-read blueprint lines 99, 121, and 288-296 — all fixes in place

**all mechanic role standards verified.**
