# self-review r7: has-thorough-test-coverage — deeper audit

## r6 checked boxes. r7 questions assumptions.

r6 verified each codepath has declared tests. r7 asks: are these the RIGHT tests?

---

## layer coverage: question the classifications

### is castIntoDeclaredCloudflareDomainRuleRedirect a transformer?

**blueprint says**: unit test

**analysis**:
- input: cloudflare SDK response (raw API data)
- output: domain object (DeclaredCloudflareDomainRuleRedirect)
- side effects: none
- dependencies: none (pure function)

**verdict**: yes, transformer. unit test is correct.

### is getAllDomainRuleRedirects a communicator?

**blueprint says**: integration test

**analysis**:
- input: zone reference
- output: array of domain objects
- side effects: yes (API call to cloudflare)
- dependencies: cloudflare SDK

**verdict**: yes, communicator. integration test is correct.

### is setDomainRuleRedirect an orchestrator?

**blueprint says**: integration test

**analysis**:
- input: findsert/upsert payload
- calls: expandZoneRef, getAllDomainRuleRedirects, cloudflare SDK PUT
- side effects: yes (modifies ruleset)
- dependencies: multiple (transformer + communicator)

**verdict**: yes, orchestrator. integration test is correct.

### is delDomainRuleRedirect a communicator or orchestrator?

**blueprint says**: communicator, integration test

**analysis**:
- input: zone ref + slug
- calls: getAllDomainRuleRedirects (to get current ruleset), then SDK PUT
- side effects: yes (modifies ruleset)
- dependencies: getAllDomainRuleRedirects + cloudflare SDK

**wait** — this calls getAll first, then PUTs. that's composition of two operations.

**verdict**: this is actually an **orchestrator**, not a communicator. but integration test is still correct for orchestrators.

**note**: no fix needed — integration test is appropriate for both.

---

## case coverage: question the edge cases

### getAllDomainRuleRedirects edge cases

declared: "rules exist | empty zone | no zones"

**question**: what about "zone has non-redirect rules"?

cloudflare rulesets can contain multiple rule types. what if the ruleset has firewall rules mixed with redirect rules?

**analysis**: the API filters by phase (`http_request_dynamic_redirect`), so only redirect rules are returned. other rule types are in different phases.

**verdict**: edge case covered by API design, not by test. documented.

### setDomainRuleRedirect edge cases

declared: "create new | update extant | findsert vs upsert"

**question**: what about "rule with same slug but different zone"?

**analysis**: slug is unique per zone, not globally. zone ref is part of the key. different zones = different rules.

**verdict**: this is not an edge case — it's expected behavior. two zones can have rules with the same slug.

### delDomainRuleRedirect edge cases

declared: "rule exists | rule absent | already deleted"

**question**: is "already deleted" different from "rule absent"?

**analysis**:
- "rule absent" = never existed
- "already deleted" = existed before, gone now

in both cases, getAll returns no match, del is a no-op.

**verdict**: these are the same case from the code's perspective. could simplify to just "rule absent" but keeping both is harmless.

---

## snapshot coverage: deeper audit

### positive snapshots

| snapshot | what it captures |
|----------|------------------|
| plan stdout with rules | shows CREATE for new rules |
| apply stdout with rules | shows SUCCESS after apply |
| re-plan stdout (0 changes) | shows KEEP for all rules |

### negative snapshots (added in r6)

| snapshot | what it captures |
|----------|------------------|
| plan stderr when zone not found | shows ERROR: zone ref unresolved |
| apply stderr when API error | shows ERROR: cloudflare API failed |

### question: are there other error paths?

| error path | snapshot needed? |
|------------|------------------|
| invalid expression syntax | maybe — but cloudflare validates, not us |
| rate limit exceeded | maybe — but transient, retry expected |
| API token revoked | yes — auth error distinct from API error |

**fix**: add one more negative snapshot for auth errors:

```
- `declastruct apply` stderr when auth error (negative)
```

---

## test tree: question the structure

### question: why separate unit tests for operations?

```
├── [+] getAllDomainRuleRedirects.test.ts         # unit: input validation
├── [+] setDomainRuleRedirect.test.ts             # unit: input validation
├── [+] delDomainRuleRedirect.test.ts             # unit: input validation
└── [+] domainRuleRedirect.integration.test.ts    # integration: API calls
```

**analysis**:
- unit tests verify input validation (refs, required fields)
- integration tests verify actual API behavior

this is correct: test input validation without API, test API behavior with API.

### question: should presets have tests?

blueprint says: `(presets have no tests — constants only)`

**analysis**:
- presets are static constants
- no logic to test
- values are verified by integration tests when applied

**verdict**: correct. constants don't need unit tests.

---

## guide compliance: contracts need integration + acceptance

the guide says:
> contracts (cli, api, sdk entry points) | integration + acceptance tests

the blueprint declared only acceptance tests for CLI.

**gap**: SDK exports need integration test row.

**fix applied**: added row to coverage by layer:
```
| SDK exports | direct calls to exported operations | integration |
```

---

## exhaustive error path audit

| error path | snapshot? |
|------------|-----------|
| zone not found | yes (r6) |
| API error (network, rate limit) | yes (r6) |
| auth error (401) | yes (r7) |
| expression syntax invalid | **added** |
| concurrent update conflict (409) | **added** |

**fix applied**: added two more error snapshots to blueprint.

---

## summary of r7 issues and fixes

| issue | action |
|-------|--------|
| del is orchestrator, not communicator | noted (no fix needed, integration test correct) |
| "already deleted" same as "rule absent" | noted (harmless) |
| auth error needs snapshot | **fix applied** |
| SDK exports need integration row | **fix applied** |
| expression invalid needs snapshot | **fix applied** |
| concurrent conflict needs snapshot | **fix applied** |

### fixes applied to blueprint

1. added SDK integration row:
```
| SDK exports | direct calls to exported operations | integration |
```

2. added error snapshots:
```
- `declastruct apply` stderr when auth error (negative)
- `declastruct apply` stderr when expression invalid (negative)
- `declastruct apply` stderr when concurrent conflict (negative)
```

---

## final verification

all four aspects complete:

| aspect | status |
|--------|--------|
| layer coverage | complete (SDK integration added) |
| case coverage | complete (positive, negative, edge for each codepath) |
| snapshot coverage | complete (positive + 5 negative paths) |
| test tree | complete (shows all files with types) |
