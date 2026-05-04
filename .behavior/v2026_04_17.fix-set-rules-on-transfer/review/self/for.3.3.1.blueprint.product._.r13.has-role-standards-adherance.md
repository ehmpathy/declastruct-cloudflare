# self-review r13: has-role-standards-adherance

## method

1. enumerate relevant briefs/ subdirectories
2. check blueprint against each rule category
3. document adherance or violations

---

## briefs directories checked

| directory | relevance |
|-----------|-----------|
| code.prod/evolvable.architecture | bounded contexts, directional deps |
| code.prod/evolvable.domain.objects | domain object patterns |
| code.prod/evolvable.domain.operations | operation patterns, grains |
| code.prod/evolvable.procedures | input-context, arrow-only |
| code.prod/evolvable.repo.structure | directory structure, no barrels |
| code.prod/pitofsuccess.errors | fail-fast, error classes |
| code.prod/pitofsuccess.procedures | idempotent mutations |
| code.prod/pitofsuccess.typedefs | type safety |
| code.prod/readable.comments | what-why headers |
| code.prod/readable.narrative | narrative flow |
| code.test/frames.behavior | given-when-then |
| code.test/scope.coverage | coverage by grain |

---

## rule.require.bounded-contexts

**check**: are new files in appropriate bounded contexts?

| blueprint file | bounded context | correct? |
|----------------|-----------------|----------|
| DeclaredCloudflareDomainRuleRedirect.ts | domain.objects | yes |
| DeclaredCloudflareDomainRuleRedirectSpec.ts | domain.objects | yes |
| DeclaredCloudflareDomainRuleRedirectPresets.ts | domain.objects | yes |
| domainRuleRedirect/ | domain.operations | yes |
| getDeclastructCloudflareProvider.ts (modify) | domain.operations/provider | yes |

**verdict**: adheres

---

## rule.require.directional-deps

**check**: do deps flow top-down?

| file | imports from | direction |
|------|--------------|-----------|
| DeclaredCloudflareDomainRuleRedirect | domain-objects pkg | down (external) |
| castInto* | domain.objects, type-fns | down |
| getAllDomainRuleRedirects | domain.objects, cloudflare | down |
| setDomainRuleRedirect | domain.objects, domain.operations/utils | lateral/down |
| getDeclastructCloudflareProvider | domain.operations/* | lateral |

**verdict**: adheres — no upward imports from domain.operations to contract

---

## rule.require.domain-driven-design

**check**: are domain objects properly declared?

| object | extends | identity | verdict |
|--------|---------|----------|---------|
| DeclaredCloudflareDomainRuleRedirect | DomainEntity | primary=['id'], unique=['zone','slug'] | correct |
| DeclaredCloudflareDomainRuleRedirectSpec | DomainLiteral | n/a | correct |

**verdict**: adheres

---

## rule.require.get-set-gen-verbs

**check**: do operations use get/set/gen verbs?

| operation | verb | correct? |
|-----------|------|----------|
| getAllDomainRuleRedirects | get | yes |
| getOneDomainRuleRedirect | get | yes |
| setDomainRuleRedirect | set | yes |
| delDomainRuleRedirect | del | yes (del is allowed per rule) |
| castIntoDeclaredCloudflareDomainRuleRedirect | cast (transformer) | yes (transformer, not operation) |

**verdict**: adheres

---

## rule.require.input-context-pattern

**check**: do operations use (input, context) signature?

blueprint codepath tree (lines 99-127):

| operation | input | context | correct? |
|-----------|-------|---------|----------|
| getAllDomainRuleRedirects | `{ zone: Ref }` | implicit cloudflare context | yes |
| getOneDomainRuleRedirect | `{ by: PickOne<...> }` | implicit | yes |
| setDomainRuleRedirect | `PickOne<{ findsert; upsert }>` | implicit | yes |
| delDomainRuleRedirect | `{ zone, slug }` | implicit | yes |

**verdict**: adheres — blueprint describes inputs correctly

---

## rule.forbid.nonidempotent-mutations

**check**: do mutations use idempotent patterns?

| operation | pattern | idempotent? |
|-----------|---------|-------------|
| setDomainRuleRedirect | findsert/upsert | yes |
| delDomainRuleRedirect | delete if exists | yes |

**verdict**: adheres

---

## rule.require.proper-directory-decomposition

**check**: is directory structure correct?

blueprint filediff tree (lines 18-44):
- domain.objects/ flat ✓
- domain.operations/domainRuleRedirect/ entity subdir ✓
- tests collocated with operations ✓
- integration test in entity subdir ✓
- acceptance test in contract/sdks/ ✓

**verdict**: adheres (verified in r10, r11)

---

## rule.require.test-coverage-by-grain

**check**: does test coverage match grain requirements?

| grain | file | test type | required | blueprint |
|-------|------|-----------|----------|-----------|
| transformer | castInto* | unit | yes | ✓ (line 197) |
| communicator | getAllDomainRuleRedirects | integration | yes | ✓ (line 202) |
| orchestrator | setDomainRuleRedirect | integration | yes | ✓ (line 202) |
| contract | CLI workflow | acceptance + snapshot | yes | ✓ (lines 178-186) |

**verdict**: adheres

---

## rule.require.given-when-then

**check**: do test descriptions use given-when-then?

blueprint test tree (lines 189-233) describes journey tests with:
- `[case1]` / `[case2]` labels
- `[t0]` / `[t1]` / `[t2]` labels
- behavior-driven descriptions

**verdict**: adheres

---

## rule.require.what-why-headers

**check**: are .what/.why docstrings required?

blueprint does not specify docstrings — this is implementation detail. domain object interface comments are described in vision, which blueprint references.

**verdict**: not applicable (blueprint specifies structure, not prose)

---

## rule.forbid.barrel-exports

**check**: are there barrel exports?

blueprint does not create index.ts files. exports are listed individually (lines 288-295).

**verdict**: adheres

---

## summary

| rule category | adherance |
|---------------|-----------|
| bounded-contexts | yes |
| directional-deps | yes |
| domain-driven-design | yes |
| get-set-gen-verbs | yes |
| input-context-pattern | yes |
| nonidempotent-mutations | yes |
| proper-directory-decomposition | yes |
| test-coverage-by-grain | yes |
| given-when-then | yes |
| what-why-headers | n/a |
| forbid-barrel-exports | yes |

**no violations found.** blueprint adheres to mechanic role standards.
