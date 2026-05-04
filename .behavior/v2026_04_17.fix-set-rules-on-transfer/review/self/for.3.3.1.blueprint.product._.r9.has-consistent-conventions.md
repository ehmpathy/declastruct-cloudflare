# self-review r9: has-consistent-conventions

## name convention audit

searched codebase for extant patterns. compared blueprint names to each.

---

## 1. entity name pattern

**extant**: `DeclaredCloudflareDomain{EntityName}`
- DeclaredCloudflareDomainZone
- DeclaredCloudflareDomainDnsRecord
- DeclaredCloudflareDomainRegistration

**blueprint**: `DeclaredCloudflareDomainRuleRedirect`

**verdict**: consistent

---

## 2. folder pattern

**extant**: `domain{EntityName}` (camelCase)
- domainZone
- domainDnsRecord
- domainRegistration
- domainWhoisRecord

**blueprint**: `domainRuleRedirect`

**verdict**: consistent

---

## 3. operation name pattern

**extant**: `{verb}Domain{EntityName}` or `{verb}Domain{EntityName}s` (plural for getAll)
- getAllDomainZones, setDomainZone, delDomainZone, getOneDomainZone
- getAllDomainDnsRecords, setDomainDnsRecord, delDomainDnsRecord, getOneDomainDnsRecord

**blueprint**: `getAllDomainRuleRedirects`, `setDomainRuleRedirect`, `delDomainRuleRedirect`

**verdict**: consistent

---

## 4. cast function pattern

**extant**: `castIntoDeclaredCloudflareDomain{EntityName}`
- castIntoDeclaredCloudflareDomainZone
- castIntoDeclaredCloudflareDomainDnsRecord
- castIntoDeclaredCloudflareDomainRegistration

**blueprint**: `castIntoDeclaredCloudflareDomainRuleRedirect`

**verdict**: consistent

---

## 5. spec vs settings pattern

**extant**: `DeclaredCloudflareDomain{EntityName}Settings`
- DeclaredCloudflareDomainDnsRecordSettings

**blueprint**: `DeclaredCloudflareDomainRuleRedirectSpec`

**analysis**:
- Settings = configuration options for behavior (ipv4Only, flattenCname)
- Spec = rule specification itself (expression, action, enabled)

these are different concepts. the redirect rule has a "spec" (what the rule does) not "settings" (how to configure behavior). the term "Spec" is appropriate for rule specifications.

**verdict**: acceptable divergence — different concept, not inconsistent

---

## 6. presets pattern

**extant**: no extant preset patterns

**blueprint**: `RULE_REDIRECT_SPEC_HTTP_TO_HTTPS`, `RULE_REDIRECT_SPEC_ROOT_TO_WWW`

**analysis**:
- SCREAMING_SNAKE_CASE for constants: standard
- structure: `{ENTITY}_{TYPE}_{DESCRIPTION}`
- no extant pattern to diverge from

**verdict**: new pattern, no conflict

---

## 7. integration test pattern

**extant**: `{entity}.integration.test.ts`
- domainDnsRecord.integration.test.ts
- domainZone.integration.test.ts
- domainRegistration.integration.test.ts

**blueprint**: `domainRuleRedirect.integration.test.ts`

**verdict**: consistent

---

## 8. DAO pattern

**extant**: `DeclaredCloudflareDomain{EntityName}Dao`
- DeclaredCloudflareDomainDnsRecordDao
- DeclaredCloudflareDomainZoneDao
- DeclaredCloudflareDomainRegistrationDao

**blueprint**: declares DAO via `genDeclastructDao` for `domainRuleRedirect`

**verdict**: consistent

---

## summary

| convention | blueprint name | consistent? |
|------------|----------------|-------------|
| entity name | DeclaredCloudflareDomainRuleRedirect | yes |
| folder | domainRuleRedirect | yes |
| operations | getAllDomainRuleRedirects, set*, del* | yes |
| cast function | castIntoDeclaredCloudflareDomainRuleRedirect | yes |
| spec literal | DeclaredCloudflareDomainRuleRedirectSpec | yes (different concept than Settings) |
| presets | RULE_REDIRECT_SPEC_* | yes (new pattern) |
| integration test | domainRuleRedirect.integration.test.ts | yes |
| DAO | via genDeclastructDao | yes |

**no divergence from extant conventions found.**

all names follow established patterns in the codebase.
