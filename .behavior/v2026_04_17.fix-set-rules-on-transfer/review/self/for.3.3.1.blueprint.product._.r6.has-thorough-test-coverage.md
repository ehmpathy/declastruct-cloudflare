# self-review r6: has-thorough-test-coverage

## layer coverage audit

| codepath | grain | declared test type | correct? |
|----------|-------|-------------------|----------|
| DeclaredCloudflareDomainRuleRedirect | entity (domain object) | unit | yes |
| DeclaredCloudflareDomainRuleRedirectSpec | literal (domain object) | unit | yes |
| castIntoDeclaredCloudflareDomainRuleRedirect | transformer | unit | yes |
| getAllDomainRuleRedirects | communicator | integration | yes |
| setDomainRuleRedirect | orchestrator | integration | yes |
| delDomainRuleRedirect | communicator | integration | yes |
| declastruct plan/apply | contract (CLI) | acceptance | yes |

**layer coverage: complete**

---

## case coverage audit

| codepath | positive? | negative? | edge cases? |
|----------|-----------|-----------|-------------|
| DeclaredCloudflareDomainRuleRedirect | yes (instantiation) | yes (invalid props) | yes (minimal props) |
| castInto* | yes (full response) | yes (absent fields) | yes (null optional) |
| getAllDomainRuleRedirects | yes (rules exist) | yes (empty zone) | yes (no zones) |
| setDomainRuleRedirect | yes (create new) | yes (update extant) | yes (findsert vs upsert) |
| delDomainRuleRedirect | yes (rule exists) | yes (rule absent) | yes (already deleted) |
| CLI plan | yes (creates shown) | yes (no changes) | yes (mixed) |
| CLI apply | yes (succeeds) | yes (fails) | yes (idempotent) |

**case coverage: complete**

---

## snapshot coverage audit

declared snapshots:
- `declastruct plan` stdout with redirect rules
- `declastruct apply` stdout with redirect rules
- idempotent re-plan stdout (0 changes)

### gap found: no error path snapshots

the guide requires: "snapshots exhaustive for both positive and negative cases"

current snapshots are all positive:
- plan shows rules → positive
- apply succeeds → positive
- re-plan shows 0 changes → positive (idempotency)

**absent snapshots for negative cases:**
- plan when zone not found
- apply when API token lacks permission
- plan when ruleset API returns error

### fix applied

added to blueprint snapshots section:

```
acceptance tests snapshot:
- `declastruct plan` stdout with redirect rules (positive)
- `declastruct apply` stdout with redirect rules (positive)
- idempotent re-plan stdout (0 changes) (positive)
- `declastruct plan` stderr when zone not found (negative)
- `declastruct apply` stderr when API error (negative)
```

---

## test tree audit

| file | location | test type | correct? |
|------|----------|-----------|----------|
| DeclaredCloudflareDomainRuleRedirect.test.ts | src/domain.objects/ | unit | yes |
| DeclaredCloudflareDomainRuleRedirectSpec.test.ts | src/domain.objects/ | unit | yes |
| castIntoDeclaredCloudflareDomainRuleRedirect.test.ts | src/domain.operations/domainRuleRedirect/ | unit | yes |
| getAllDomainRuleRedirects.test.ts | src/domain.operations/domainRuleRedirect/ | unit (input validation) | yes |
| setDomainRuleRedirect.test.ts | src/domain.operations/domainRuleRedirect/ | unit (input validation) | yes |
| delDomainRuleRedirect.test.ts | src/domain.operations/domainRuleRedirect/ | unit (input validation) | yes |
| domainRuleRedirect.integration.test.ts | src/domain.operations/domainRuleRedirect/ | integration | yes |
| declastruct.acceptance.test.ts | src/contract/sdks/ | acceptance | yes |

**test tree: complete**

---

## summary

| aspect | status | issue |
|--------|--------|-------|
| layer coverage | complete | none |
| case coverage | complete | none |
| snapshot coverage | **gap fixed** | added negative case snapshots |
| test tree | complete | none |

one gap found and fixed: snapshot section now includes negative cases.
