# self-review r9: has-journey-acceptance-test — does the journey match the wish?

## r8 verified the journey is complete. r9 asks: does it match the original wish?

---

## the original wish

from 0.wish.md:
1. redirect from http to https (RULE_REDIRECT_SPEC_HTTP_TO_HTTPS)
2. redirect from root to www (RULE_REDIRECT_SPEC_ROOT_TO_WWW)

---

## does the journey use the presets?

### case1 analysis

| timestep | what it tests | uses presets? |
|----------|---------------|---------------|
| t0 | zone has no rules | n/a |
| t1 | add HTTP→HTTPS | should use RULE_REDIRECT_SPEC_HTTP_TO_HTTPS |
| t2 | add root→www | should use RULE_REDIRECT_SPEC_ROOT_TO_WWW |
| t3 | idempotency | n/a |
| t4 | update to 308 | should modify preset |
| t5 | remove | n/a |
| t6 | verify | n/a |

### gap found

**the journey declaration does not explicitly mention the presets.**

t1 says "apply HTTP→HTTPS redirect rule" but does not say "via RULE_REDIRECT_SPEC_HTTP_TO_HTTPS".

---

## why this matters

the presets are the **core deliverable** of the wish:
- users want to apply common redirect patterns
- presets encode best practices (301, queryString preserve)
- the journey should prove presets work

---

## fix applied

updated journey to explicitly reference presets:

```
├── [case1] redirect rule lifecycle
│   ├── [t0] zone has no redirect rules
│   ├── [t1] apply RULE_REDIRECT_SPEC_HTTP_TO_HTTPS preset
│   │   └── expect rule created with expression '(http.request.uri.scheme eq "http")'
│   ├── [t2] apply RULE_REDIRECT_SPEC_ROOT_TO_WWW preset
│   │   └── expect rule created with expression '(not starts_with(http.host, "www."))'
│   ├── [t3] re-plan (idempotency)
│   ├── [t4] update HTTP→HTTPS to use 308 instead of 301
│   │   └── expect statusCode changed from 301 to 308
│   ├── [t5] remove root→www rule
│   └── [t6] verify final state
```

---

## another gap: error recovery uses generic errors

case2 says "invalid zone ref" and "invalid expression" but these are generic.

for the wish, the relevant error is:
- **preset applied to zone that does not exist**

### fix applied

updated error recovery to test wish-specific scenario:

```
└── [case2] preset application error recovery
    ├── [t0] apply preset to non-existent zone (stderr snapshot)
    │   └── error: zone 'typo-zone.com' not found
    ├── [t1] fix zone name and retry
    ├── [t2] apply preset with custom expression that fails cloudflare validation
    │   └── error: expression syntax error
    └── [t3] use standard preset instead
```

---

## final verification

| question | r8 answer | r9 answer |
|----------|-----------|-----------|
| does journey match wish? | assumed | **now explicit** |
| does journey use presets? | implied | **now explicit** |
| do error cases match wish? | generic | **now preset-specific** |

---

## summary

r9 found two gaps:
1. journey did not explicitly use presets (fixed)
2. error cases were generic, not preset-specific (fixed)

the journey now directly exercises the wish:
- preset application (RULE_REDIRECT_SPEC_HTTP_TO_HTTPS, RULE_REDIRECT_SPEC_ROOT_TO_WWW)
- preset modification (change statusCode)
- preset-specific error recovery
