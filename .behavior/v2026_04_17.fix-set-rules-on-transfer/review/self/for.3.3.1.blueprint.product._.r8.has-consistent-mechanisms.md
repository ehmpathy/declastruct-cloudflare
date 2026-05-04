# self-review r8: has-consistent-mechanisms

## search for extant mechanisms

searched the codebase for related patterns:

| search | found | files |
|--------|-------|-------|
| expandZoneRef | yes | 7 files in domainDnsRecord/ |
| genDeclastructDao | yes | 3 files in access/daos/ |
| castInto* | yes | 17 files across domain.operations/ |

---

## blueprint mechanisms vs extant mechanisms

### 1. expandZoneRef utility

**blueprint says**: `[←] expandZoneRef (reuse from domainDnsRecord, per pattern.3)`

**extant mechanism**: `src/domain.operations/domainDnsRecord/expandZoneRef.ts`

**verdict**: reuses extant. no duplication.

### 2. castInto* transformer

**blueprint says**: `[+] castIntoDeclaredCloudflareDomainRuleRedirect (transformer)`

**extant pattern**: `castIntoDeclaredCloudflareDomainDnsRecord.ts`, `castIntoDeclaredCloudflareDomainZone.ts`, etc.

**question**: is this a new mechanism or does it follow the pattern?

**analysis**:
- extant: `castIntoDeclaredCloudflareDomain${Entity}`
- proposed: `castIntoDeclaredCloudflareDomainRuleRedirect`
- name: consistent
- purpose: transforms cloudflare SDK response to domain object
- structure: expected to be pure transformer

**verdict**: follows extant pattern. not duplication.

### 3. genDeclastructDao for provider

**blueprint says**: DAO via genDeclastructDao (pattern.8)

**extant mechanism**: used in `DeclaredCloudflareDomainDnsRecordDao.ts`, etc.

**verdict**: reuses extant. no duplication.

### 4. DomainEntity structure

**blueprint says**: `DeclaredCloudflareDomainRuleRedirect extends DomainEntity`

**extant pattern**: `DeclaredCloudflareDomainDnsRecord`, `DeclaredCloudflareDomainZone`, etc.

**verdict**: follows extant pattern. not duplication.

### 5. RefByUnique for zone references

**blueprint says**: `zone: RefByUnique<typeof Zone>`

**extant pattern**: same in `DeclaredCloudflareDomainDnsRecord`

**verdict**: follows extant pattern. not duplication.

### 6. getAll/set/del operations

**blueprint declares**: getAllDomainRuleRedirects, setDomainRuleRedirect, delDomainRuleRedirect

**extant pattern**: getAllDomainDnsRecords, setDomainDnsRecord, delDomainDnsRecord

**question**: could we reuse these operations?

**analysis**: no — different cloudflare API endpoints:
- DNS records: `/zones/{zone_id}/dns_records`
- Redirect rules: `/zones/{zone_id}/rulesets/phases/http_request_dynamic_redirect`

**verdict**: new operations required. not duplication — different API.

---

## new mechanisms audit

| new mechanism | duplicates extant? | reuses pattern? |
|---------------|--------------------|-----------------|
| DeclaredCloudflareDomainRuleRedirect | no | yes (DomainEntity) |
| DeclaredCloudflareDomainRuleRedirectSpec | no | yes (DomainLiteral) |
| castIntoDeclaredCloudflareDomainRuleRedirect | no | yes (castInto*) |
| getAllDomainRuleRedirects | no | yes (getAll* pattern) |
| setDomainRuleRedirect | no | yes (set* pattern) |
| delDomainRuleRedirect | no | yes (del* pattern) |
| DAO | no | yes (genDeclastructDao) |
| expandZoneRef | **reused** | n/a |

---

## summary

| question | answer |
|----------|--------|
| does codebase have mechanism that does this? | no (new cloudflare API) |
| do we duplicate extant utilities? | no (reuses expandZoneRef) |
| could we reuse extant components? | yes — and we do (expandZoneRef, genDeclastructDao, castInto* pattern) |

**no issues found.**

all new mechanisms follow extant patterns. one utility (expandZoneRef) is explicitly reused.
