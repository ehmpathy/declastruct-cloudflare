# self-review r16: has-role-standards-coverage — comprehensive audit

## method

1. tea first 🍵
2. enumerated all relevant briefs/ subdirectories
3. read blueprint line by line with fresh eyes
4. verified each pattern against extant code
5. documented why each pattern holds

---

## briefs directories checked

| directory | contains | applies to blueprint? |
|-----------|----------|----------------------|
| code.prod/evolvable.architecture | bounded-contexts, directional-deps | yes |
| code.prod/evolvable.domain.objects | domain object patterns, refs | yes |
| code.prod/evolvable.domain.operations | operation grains, verbs | yes |
| code.prod/evolvable.procedures | input-context, dependency injection | yes |
| code.prod/evolvable.repo.structure | directory structure, no barrels | yes |
| code.prod/pitofsuccess.errors | fail-fast, error classes | yes (via snapshots) |
| code.prod/pitofsuccess.procedures | idempotent mutations | yes |
| code.prod/pitofsuccess.typedefs | type safety | yes |
| code.prod/readable.comments | what-why headers | impl detail |
| code.prod/readable.narrative | narrative flow | impl detail |
| code.prod/readable.persistence | declastruct pattern | yes |
| code.test/frames.behavior | given-when-then | yes |
| code.test/scope.coverage | coverage by grain | yes |

---

## pattern 1: bounded-contexts

**rule**: each bounded context owns its domain objects and operations

**blueprint coverage** (lines 18-44):
```
src/domain.objects/
├── [+] DeclaredCloudflareDomainRuleRedirect.ts
├── [+] DeclaredCloudflareDomainRuleRedirectSpec.ts
└── [+] DeclaredCloudflareDomainRuleRedirectPresets.ts

src/domain.operations/domainRuleRedirect/
├── [+] castIntoDeclaredCloudflareDomainRuleRedirect.ts
├── [+] getAllDomainRuleRedirects.ts
...
```

**why it holds**: domain objects in domain.objects/, operations in entity-specific subdirectory under domain.operations/. follows extant domainDnsRecord pattern.

---

## pattern 2: directional-deps

**rule**: deps flow top-down; no upward imports from domain.operations to contract

**blueprint coverage**: operations import from domain.objects (down), reuse expandZoneRef from peer (lateral).

**evidence** (line 97):
```
├── [←] expandZoneRef (reuse from domainDnsRecord, per pattern.3)
```

**why it holds**: no contract imports in domain.operations; expandZoneRef reuse is lateral (peer entity).

---

## pattern 3: domain-driven-design

**rule**: use DomainEntity/DomainLiteral, declare identity keys

**blueprint coverage** (lines 54-65):
```
├── [+] class DeclaredCloudflareDomainRuleRedirect
│   ├── static primary = ['id']
│   ├── static unique = ['zone', 'slug']
│   ├── static metadata = ['id']
│   ├── static readonly = ['createdOn', 'modifiedOn']
│   └── static nested = { zone: Zone, spec: Spec }
```

**why it holds**: extends DomainEntity; primary=['id'] is artificial key; unique=['zone','slug'] is natural key; metadata, readonly, nested all declared.

---

## pattern 4: RefByUnique for references

**rule**: use RefByUnique<typeof T> for zone references

**blueprint coverage** (line 56):
```
│   ├── zone: RefByUnique<typeof Zone>            # zone reference
```

**why it holds**: zone is referenced by unique key (name), not primary key (id). consistent with extant DnsRecord.

---

## pattern 5: optional fields

**rule**: forbid undefined attributes unless metadata or explicitly optional

**blueprint coverage** (line 55, 69):
```
│   ├── id?: string                               # cloudflare-assigned
├── enabled?: boolean                         # optional, defaults to true
```

**extant evidence** (DeclaredCloudflareDomainDnsRecord.ts lines 62-83):
```typescript
proxied?: boolean;
comment?: string;
tags?: string[];
priority?: number;
settings?: DeclaredCloudflareDomainDnsRecordSettings;
```

**why it holds**: `id?` is metadata (cloudflare-assigned). `enabled?` follows extant pattern of optional user fields with sensible defaults.

---

## pattern 6: operation grain labels

**rule**: transformers are pure, orchestrators compose operations

**blueprint coverage** (lines 93-131):
- castIntoDeclaredCloudflareDomainRuleRedirect: (transformer) — pure, no i/o
- getAllDomainRuleRedirects: (orchestrator) — composes expandZoneRef + API + castInto
- getOneDomainRuleRedirect: (orchestrator) — composes getAll + filter
- setDomainRuleRedirect: (orchestrator) — composes expandZoneRef + getAll + API
- delDomainRuleRedirect: (orchestrator) — composes getAll + filter + PUT

**why it holds**: all grain labels match the operation's actual composition. fixed in r14.

---

## pattern 7: input-context signature

**rule**: operations use (input, context: ContextCloudflareApi) signature

**blueprint coverage** (lines 99-127):
```
├── [+] getAllDomainRuleRedirects (orchestrator)
│   ├── input: { zone: Ref<typeof Zone> }
│   ├── context: ContextCloudflareApi
```

**why it holds**: all orchestrators show context parameter. fixed in r15.

---

## pattern 8: get/set/del verbs

**rule**: use get/set/del for operations, not synonyms

**blueprint coverage** (lines 99-131):
- getAllDomainRuleRedirects: get
- getOneDomainRuleRedirect: get
- setDomainRuleRedirect: set
- delDomainRuleRedirect: del

**why it holds**: all operations use correct verbs.

---

## pattern 9: idempotent mutations

**rule**: use findsert/upsert/delete, not create/insert/update

**blueprint coverage** (lines 111-122):
```
├── [+] setDomainRuleRedirect (orchestrator)
│   ├── input: PickOne<{ findsert: ...; upsert: ... }>
```

**why it holds**: setDomainRuleRedirect uses findsert/upsert; delDomainRuleRedirect removes if exists.

---

## pattern 10: DAO integration

**rule**: genDeclastructDao requires getOne, getAll, set, del

**blueprint coverage** (lines 142-146):
```
└── [+] domainRuleRedirect
    ├── getOne: getOneDomainRuleRedirect
    ├── getAll: getAllDomainRuleRedirects
    ├── set: setDomainRuleRedirect
    └── del: delDomainRuleRedirect
```

**why it holds**: all four operations present.

---

## pattern 11: test coverage by grain

**rule**: unit for transformer, integration for orchestrator, acceptance+snapshot for contract

**blueprint coverage** (lines 156-165, 200-209):

| grain | operation | test type | file |
|-------|-----------|-----------|------|
| transformer | castInto* | unit | castIntoDeclaredCloudflareDomainRuleRedirect.test.ts |
| orchestrator | getAll*, getOne*, set*, del* | integration | domainRuleRedirect.integration.test.ts |
| contract | CLI workflow | acceptance + snapshot | declastruct.acceptance.test.ts |

**why it holds**: each grain has appropriate test coverage.

---

## pattern 12: journey tests

**rule**: given-when-then with [caseN]/[tN] labels

**blueprint coverage** (lines 213-237):
```
├── [case1] preset lifecycle (exercises the wish)
│   ├── [t0] zone has no redirect rules
│   ├── [t1] apply RULE_REDIRECT_SPEC_HTTP_TO_HTTPS preset
...
└── [case2] preset application error recovery
```

**why it holds**: labeled with [case1], [case2], [t0]-[t6].

---

## pattern 13: snapshot coverage

**rule**: acceptance tests require snapshots for visual diff

**blueprint coverage** (lines 182-190):
- positive: plan stdout, apply stdout, idempotent re-plan
- negative: zone not found, API error, auth error, expression invalid, concurrent conflict

**why it holds**: 8 snapshot scenarios cover positive and negative paths.

---

## pattern 14: fail-fast error paths

**rule**: document error scenarios and how they surface

**blueprint coverage** (lines 186-190):
```
- `declastruct plan` stderr when zone not found (negative)
- `declastruct apply` stderr when API error (negative)
- `declastruct apply` stderr when auth error (negative)
- `declastruct apply` stderr when expression invalid (negative)
- `declastruct apply` stderr when concurrent conflict (negative)
```

**why it holds**: all error scenarios documented as snapshot tests. errors surface via stderr per CLI convention.

---

## pattern 15: declastruct pattern

**rule**: follow declastruct pattern for declarative control

**blueprint coverage** (entire document):
1. domain entity with primary/unique keys
2. castInto* transformer from SDK response
3. get/set/del operations with idempotent semantics
4. DAO integration for declastruct provider

**why it holds**: follows exact pattern from rule.prefer.declastruct.[demo].md.

---

## summary

| category | patterns checked | status |
|----------|-----------------|--------|
| evolvable.architecture | bounded-contexts, directional-deps | pass |
| evolvable.domain.objects | DDD, refs, optional fields | pass |
| evolvable.domain.operations | grains, verbs | pass |
| evolvable.procedures | input-context | pass |
| evolvable.repo.structure | directories | pass |
| pitofsuccess.errors | fail-fast, snapshots | pass |
| pitofsuccess.procedures | idempotent mutations | pass |
| pitofsuccess.typedefs | type safety | pass |
| readable.persistence | declastruct pattern | pass |
| test frames | given-when-then | pass |
| test coverage | by grain, snapshots | pass |

**no omissions found.** all mechanic role standards are present in the blueprint.

