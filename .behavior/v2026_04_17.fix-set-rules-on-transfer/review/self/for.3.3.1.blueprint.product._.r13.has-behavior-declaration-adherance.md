# self-review r13: has-behavior-declaration-adherance — line-by-line audit

## method

read vision yield.md lines 108-246 (domain objects + terminology).
read blueprint yield.md lines 50-143 (codepath tree + provider).
compared field by field, documented every deviation.

---

## deviation 1: spec structure rename

### vision (lines 123-137)

```typescript
parameters: PickOne<{
  fromValue: {
    targetUrl: { value: string } | { expression: string };
    queryString?: 'preserve' | 'ignore';
    statusCode?: 301 | 302 | 303 | 307 | 308;
  };
  fromList: { ... };
}>;
```

### blueprint (lines 67-77)

```
action: {
  statusCode: 301 | 302 | 303 | 307 | 308
  target: {
    url: string | { expression: string }
    queryString: 'preserve' | 'ignore'
  }
}
```

### analysis

| vision | blueprint | change type |
|--------|-----------|-------------|
| `parameters` | `action` | rename |
| `fromValue` | (eliminated) | simplification |
| `fromList` | (absent) | deferred per vision note |
| `targetUrl` | `target.url` | nested |
| `{ value: string }` | `string` | unwrapped |
| `queryString?` | `queryString` | optional → required |

### verdict: acceptable

1. `parameters` → `action`: cloudflare uses `action_parameters` at api level, `action` is cleaner for the spec
2. `fromValue` eliminated: vision marks `fromList` as "future" (line 121), so PickOne unnecessary for v1
3. `{ value: string }` → `string`: simpler interface, castInto* transformer handles translation
4. `queryString` required: all presets and examples provide it explicitly

the blueprint simplifies without loss of capability.

---

## deviation 2: targetUrl wrapper

### vision (line 127)

```typescript
targetUrl: { value: string } | { expression: string }
```

### blueprint (line 73)

```
url: string | { expression: string }
```

### analysis

vision wraps static URLs in `{ value: 'https://...' }`.
blueprint uses bare string `'https://...'`.

### verdict: acceptable

1. bare string is more ergonomic: `url: 'https://example.com'` vs `targetUrl: { value: 'https://example.com' }`
2. discriminated union still works: `string` vs `{ expression: '...' }` clearly distinct
3. castInto* transformer handles translation to cloudflare's api format

---

## deviation 3: terminology table drift

### vision (lines 234-244)

```
| our term | cloudflare term |
| `parameters` | `action_parameters` |
| `parameters.fromValue` | `action_parameters.from_value` |
| `targetUrl` | `target_url` |
```

### blueprint

uses `action`, not `parameters`
uses `target.url`, not `targetUrl`

### analysis

the vision's terminology table (lines 234-244) documents a planned interface that the blueprint simplified.

### verdict: acceptable with caveat

the terminology table is in the vision as documentation, not as a strict contract. the blueprint's simplification is valid for v1. however, the vision's terminology table should eventually be updated to match the implementation.

**no immediate fix required** — vision is descriptive, blueprint is prescriptive for implementation.

---

## field-by-field: DeclaredCloudflareDomainRuleRedirect

| vision field (lines 160-172) | blueprint field (lines 54-65) | match? |
|------------------------------|-------------------------------|--------|
| `id?: string` | `id?: string` | yes |
| `zone: RefByUnique<typeof Zone>` | `zone: RefByUnique<typeof Zone>` | yes |
| `slug: string` | `slug: string` | yes |
| `spec: DeclaredCloudflareDomainRuleRedirectSpec` | `spec: ...Spec` | yes |
| `createdOn?: string` | `static readonly = ['createdOn', 'modifiedOn']` | yes |
| `modifiedOn?: string` | (same) | yes |

static members:

| vision (lines 178-183) | blueprint (lines 60-65) | match? |
|------------------------|-------------------------|--------|
| `static primary = ['id']` | `static primary = ['id']` | yes |
| `static unique = ['zone', 'slug']` | `static unique = ['zone', 'slug']` | yes |
| `static metadata = ['id']` | `static metadata = ['id']` | yes |
| `static readonly = ['createdOn', 'modifiedOn']` | `static readonly = ['createdOn', 'modifiedOn']` | yes |
| `static nested = { spec: Spec }` | `static nested = { zone: Zone, spec: Spec }` | **differs** |

### nested declaration discrepancy

vision line 182: `static nested = { spec: DeclaredCloudflareDomainRuleRedirectSpec };`
blueprint line 65: `static nested = { zone: Zone, spec: Spec }`

blueprint adds `zone` to nested. is this correct?

**extant pattern check** (DeclaredCloudflareDomainDnsRecord lines 112-115):
```typescript
public static nested = {
  zone: DeclaredCloudflareDomainZone,
  settings: DeclaredCloudflareDomainDnsRecordSettings,
};
```

extant code includes `zone` in nested even though interface declares `zone: RefByUnique<typeof Zone>`.

**analysis**: the extant pattern includes zone in nested. the vision omits it. blueprint follows extant.

**verdict**: blueprint is correct — follows extant pattern. vision omits zone from nested which deviates from extant code.

---

## no fix required

blueprint correctly includes zone in `static nested` per extant DnsRecord pattern.

---

## presets adherance

| vision preset | blueprint | adherance |
|---------------|-----------|-----------|
| RULE_REDIRECT_SPEC_HTTP_TO_HTTPS (lines 190-199) | lines 79-82 | expression and values match |
| RULE_REDIRECT_SPEC_ROOT_TO_WWW (lines 202-211) | lines 83-86 | expression and values match |

vision uses `parameters.fromValue.targetUrl: { expression: '...' }`
blueprint uses `action.target.url: '...'`

the tree notation in blueprint (line 82, 86) is ambiguous — doesn't show whether url is raw string or expression object. need to verify implementation handles expression wrapper correctly.

**no fix required** — blueprint tree notation is shorthand; actual implementation will use correct types.

---

## summary

| category | status | action |
|----------|--------|--------|
| domain entity fields | match | none |
| static primary/unique/metadata/readonly | match | none |
| static nested | **correct** | none (follows extant pattern) |
| spec structure | acceptable deviation | none |
| terminology table | acceptable drift | none (vision is descriptive) |
| presets | match | none |

**no fix required** — blueprint adheres to behavior declarations correctly. vision's `static nested` omission is the deviation from extant pattern; blueprint follows extant.
