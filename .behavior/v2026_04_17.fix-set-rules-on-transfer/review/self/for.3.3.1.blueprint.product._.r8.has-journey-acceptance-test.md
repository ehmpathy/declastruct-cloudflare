# self-review r8: has-journey-acceptance-test — explicit verification

## the guide's questions answered

### 1. does the blueprint declare a journey acceptance test?

**yes** — the blueprint declares:

```
src/contract/sdks/
└── [+] domainRuleRedirect.journey.acceptance.test.ts
```

this is a dedicated journey acceptance test file.

### 2. does the journey exercise a realistic user workflow?

**yes** — case1 exercises the wish:

| timestep | action | realistic? |
|----------|--------|------------|
| t0 | zone has no rules | typical initial state |
| t1 | apply RULE_REDIRECT_SPEC_HTTP_TO_HTTPS | wisher's request #2 |
| t2 | apply RULE_REDIRECT_SPEC_ROOT_TO_WWW | wisher's request #1 |
| t3 | re-plan (idempotency) | users verify no drift |
| t4 | update statusCode | users iterate config |
| t5 | remove rule | users clean up |
| t6 | verify final state | users confirm result |

this directly exercises the two presets from the wish.

### 3. does the journey include multiple timesteps?

**yes** — 7 timesteps in case1:
- [t0], [t1], [t2], [t3], [t4], [t5], [t6]

and 4 timesteps in case2:
- [t0], [t1], [t2], [t3]

total: 11 timesteps across 2 cases.

### 4. does the journey cover blocked/error states?

**yes** — case2 covers error recovery:

| timestep | error state | recovery |
|----------|-------------|----------|
| t0 | zone not found | user sees error |
| t1 | — | user fixes zone name |
| t2 | expression invalid | user sees error |
| t3 | — | user uses preset instead |

### 5. does the journey snapshot at each checkpoint?

**yes** — each timestep declares a snapshot:

| timestep | snapshot type |
|----------|---------------|
| t0-t6 (case1) | stdout |
| t0 (case2) | stderr (error) |
| t1 (case2) | stdout (success) |
| t2 (case2) | stderr (error) |
| t3 (case2) | stdout (success) |

### 6. does the journey verify the final expected outcome?

**yes** — t6 includes explicit API verification:

```
└── [t6] verify final state (API call + assertions)
    ├── getAllDomainRuleRedirects returns 1 rule
    ├── rule.slug === 'http-to-https'
    └── rule.spec.action.statusCode === 308
```

---

## issues found and fixed

| issue | fix applied |
|-------|-------------|
| journey did not name presets | updated t1, t2 to reference RULE_REDIRECT_SPEC_* |
| t6 lacked API verification | added explicit assertions |
| error case was generic | updated to preset application scenario |

---

## final verdict

all 6 guide questions answered **yes**.

the journey test:
- is declared in blueprint
- exercises realistic workflow (the wish)
- has 11 timesteps across 2 cases
- covers error states and recovery
- snapshots at each checkpoint
- verifies final outcome via API call

journey acceptance test is complete.
