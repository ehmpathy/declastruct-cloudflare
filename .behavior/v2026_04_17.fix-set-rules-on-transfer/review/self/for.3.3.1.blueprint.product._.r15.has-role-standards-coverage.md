# self-review r15: has-role-standards-coverage — final pass

## method

1. re-read blueprint with fresh eyes
2. checked for omitted patterns per input-context rule
3. verified all signatures include context parameter
4. fixed omission and verified fix

---

## issue found: context parameter omitted

### rule.require.input-context-pattern

per briefs, operations use (input, context) signature:
```typescript
export const operation = async (
  input: { ... },
  context: ContextCloudflareApi,
) => { ... };
```

### blueprint before fix

```
├── [+] getAllDomainRuleRedirects (orchestrator)
│   ├── input: { zone: Ref<typeof Zone> }
│   ├── calls: cloudflare...
│   └── output: ...
```

no context parameter documented.

### extant evidence

setDomainDnsRecord (lines 23-28):
```typescript
export const setDomainDnsRecord = async (
  input: PickOne<{...}>,
  context: ContextCloudflareApi,  // <-- required
): Promise<...> => {...}
```

all extant operations take context: ContextCloudflareApi.

### fix applied

added `context: ContextCloudflareApi` to all orchestrators:
- getAllDomainRuleRedirects
- getOneDomainRuleRedirect
- setDomainRuleRedirect
- delDomainRuleRedirect

### verification

re-read blueprint lines 99-130 — all operations now show context parameter.

---

## other patterns verified

| pattern | present? | evidence |
|---------|----------|----------|
| ContextCloudflareApi import | yes (implicit) | operations use context.cloudflare.client |
| error classes | not needed | blueprint describes behavior, not error impl |
| .what/.why headers | not needed | implementation detail |
| type exports | checked | ContextCloudflareApi already exported in SDK |

---

## why this matters

without context documentation:
- implementer might forget context parameter
- signatures would deviate from extant pattern
- dependency injection pattern would be inconsistent

with context documentation:
- clear that all operations need cloudflare API access
- consistent with extant DNS record operations
- input-context pattern properly followed

---

## final verification

| operation | input | context | output |
|-----------|-------|---------|--------|
| castInto* | SDK response | (none — pure transformer) | HasReadonly |
| getAllDomainRuleRedirects | { zone: Ref } | ContextCloudflareApi | array |
| getOneDomainRuleRedirect | { by: PickOne } | ContextCloudflareApi | single or null |
| setDomainRuleRedirect | PickOne<findsert, upsert> | ContextCloudflareApi | HasReadonly |
| delDomainRuleRedirect | { zone, slug } | ContextCloudflareApi | void |

all orchestrators have context. transformer is pure (no context needed).

---

## summary

**issue found**: context parameter omitted from operation signatures

**fix applied**: added `context: ContextCloudflareApi` to all orchestrators

**verification**: re-read blueprint — all operations now follow input-context pattern

**all patterns now present.**
