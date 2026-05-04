# self-review r10: has-consistent-conventions — deep audit

## method

examined extant code files directly. compared each blueprint name to specific extant examples with line references.

---

## 1. entity class structure

### extant: DeclaredCloudflareDomainDnsRecord.ts:104-116

```ts
export class DeclaredCloudflareDomainDnsRecord
  extends DomainEntity<DeclaredCloudflareDomainDnsRecord>
  implements DeclaredCloudflareDomainDnsRecord
{
  public static primary = ['id'] as const;
  public static unique = ['zone', 'name', 'type', 'content'] as const;
  public static metadata = ['id'] as const;
  public static readonly = ['createdOn', 'modifiedOn', 'proxiable'] as const;
  public static nested = {
    zone: DeclaredCloudflareDomainZone,
    settings: DeclaredCloudflareDomainDnsRecordSettings,
  };
}
```

### blueprint: DeclaredCloudflareDomainRuleRedirect

```ts
class DeclaredCloudflareDomainRuleRedirect
  extends DomainEntity<DeclaredCloudflareDomainRuleRedirect>
├── static primary = ['id']
├── static unique = ['zone', 'slug']
├── static metadata = ['id']
├── static readonly = ['createdOn', 'modifiedOn']
└── static nested = { zone: Zone, spec: Spec }
```

### comparison

| aspect | extant | blueprint | match? |
|--------|--------|-----------|--------|
| extends DomainEntity | yes | yes | yes |
| implements interface | yes | yes | yes |
| static primary = ['id'] | yes | yes | yes |
| static unique = [...] | yes | yes | yes |
| static metadata = ['id'] | yes | yes | yes |
| static readonly | yes | yes | yes |
| static nested | yes | yes | yes |

**verdict**: structure matches exactly

---

## 2. literal class structure

### extant: DeclaredCloudflareDomainDnsRecordSettings.ts:24-26

```ts
export class DeclaredCloudflareDomainDnsRecordSettings
  extends DomainLiteral<DeclaredCloudflareDomainDnsRecordSettings>
  implements DeclaredCloudflareDomainDnsRecordSettings {}
```

### blueprint: DeclaredCloudflareDomainRuleRedirectSpec

```ts
class DeclaredCloudflareDomainRuleRedirectSpec
  extends DomainLiteral<DeclaredCloudflareDomainRuleRedirectSpec>
  implements DeclaredCloudflareDomainRuleRedirectSpec {}
```

### comparison

| aspect | extant | blueprint | match? |
|--------|--------|-----------|--------|
| extends DomainLiteral | yes | yes | yes |
| implements interface | yes | yes | yes |

### name distinction: Settings vs Spec

- **Settings** = configuration for behavior (ipv4Only, flattenCname)
- **Spec** = rule definition (expression, action, statusCode)

these are semantically different. Settings configures "how to behave." Spec defines "what to do." the term "Spec" is appropriate for rule specifications. no conflict with extant "Settings" pattern — they describe different concepts.

**verdict**: structure matches; name reflects different concept

---

## 3. operation signature pattern

### extant: setDomainDnsRecord.ts:23-29

```ts
export const setDomainDnsRecord = async (
  input: PickOne<{
    findsert: DeclaredCloudflareDomainDnsRecordInterface;
    upsert: DeclaredCloudflareDomainDnsRecordInterface;
  }>,
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>> => {
```

### blueprint: setDomainRuleRedirect

```ts
setDomainRuleRedirect
├── input: PickOne<{ findsert: ...; upsert: ... }>
├── context: ContextCloudflareApi
└── output: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>
```

### comparison

| aspect | extant | blueprint | match? |
|--------|--------|-----------|--------|
| PickOne findsert/upsert | yes | yes | yes |
| context: ContextCloudflareApi | yes | yes | yes |
| return HasReadonly | yes | yes | yes |
| uses expandZoneRef | yes | yes | yes |

**verdict**: signature pattern matches exactly

---

## 4. folder and file structure

### extant

```
src/domain.operations/
├── domainDnsRecord/
│   ├── castIntoDeclaredCloudflareDomainDnsRecord.ts
│   ├── getAllDomainDnsRecords.ts
│   ├── setDomainDnsRecord.ts
│   ├── delDomainDnsRecord.ts
│   └── domainDnsRecord.integration.test.ts
├── domainZone/
│   └── (same pattern)
└── domainRegistration/
    └── (same pattern)
```

### blueprint

```
src/domain.operations/
└── domainRuleRedirect/
    ├── castIntoDeclaredCloudflareDomainRuleRedirect.ts
    ├── getAllDomainRuleRedirects.ts
    ├── setDomainRuleRedirect.ts
    ├── delDomainRuleRedirect.ts
    └── domainRuleRedirect.integration.test.ts
```

### comparison

| aspect | extant pattern | blueprint | match? |
|--------|----------------|-----------|--------|
| folder: domain{Entity} | domainDnsRecord | domainRuleRedirect | yes |
| cast file | castInto...DnsRecord | castInto...RuleRedirect | yes |
| getAll file | getAllDomain...s | getAllDomain...s | yes |
| set file | setDomain... | setDomain... | yes |
| del file | delDomain... | delDomain... | yes |
| integration test | {entity}.integration.test | {entity}.integration.test | yes |

**verdict**: structure matches exactly

---

## 5. presets — new pattern

### extant: no preset constants found

searched `grep -r "PRESET\|_SPEC_" src/` — no results.

### blueprint

```ts
export const RULE_REDIRECT_SPEC_HTTP_TO_HTTPS = ...;
export const RULE_REDIRECT_SPEC_ROOT_TO_WWW = ...;
```

### analysis

presets introduce a new pattern. since no extant preset conventions exist, no divergence is possible.

the name structure follows:
- SCREAMING_SNAKE_CASE: standard for constants
- prefix: `RULE_REDIRECT_SPEC_` identifies the entity and type
- suffix: describes the preset purpose

**verdict**: new pattern, no conflict with extant conventions

---

## 6. term introduction check

### question: do we introduce new terms when extant terms exist?

| term | extant? | blueprint use | issue? |
|------|---------|---------------|--------|
| Zone | yes | yes (ref) | no |
| Spec | no (Settings exists) | yes | no — different concept |
| slug | yes (in tests) | yes | no |
| expression | no | yes (cloudflare API term) | no — API term |
| action | no | yes (cloudflare API term) | no — API term |

no term collisions. "Spec" does not conflict with "Settings" — they describe different things.

---

## summary

| convention | extant pattern | blueprint | consistent? |
|------------|----------------|-----------|-------------|
| DomainEntity structure | DeclaredCloudflareDomainDnsRecord | DeclaredCloudflareDomainRuleRedirect | yes |
| DomainLiteral structure | DeclaredCloudflareDomainDnsRecordSettings | DeclaredCloudflareDomainRuleRedirectSpec | yes |
| operation signature | PickOne, context, HasReadonly | same | yes |
| folder structure | domain{Entity}/ | domainRuleRedirect/ | yes |
| file structure | cast, getAll, set, del, integration | same | yes |
| presets | (none extant) | RULE_REDIRECT_SPEC_* | new pattern |

---

## why it holds

each blueprint name was compared against specific extant code with line references:
- entity structure: lines 104-116 of DeclaredCloudflareDomainDnsRecord.ts
- literal structure: lines 24-26 of DeclaredCloudflareDomainDnsRecordSettings.ts
- operation signature: lines 23-29 of setDomainDnsRecord.ts

no divergence found. all patterns match extant conventions.
