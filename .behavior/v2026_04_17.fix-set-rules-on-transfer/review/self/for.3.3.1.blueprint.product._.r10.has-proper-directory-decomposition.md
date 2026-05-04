# self-review r10: has-proper-directory-decomposition

## extant directory structure

via `tree -d src`:

```
src/
├── access/
│   ├── daos/
│   └── sdks/
├── contract/
│   └── sdks/
├── domain.objects/
└── domain.operations/
    ├── domainDnsRecord/
    ├── domainRegistration/
    ├── domainWhoisRecord/
    ├── domainZone/
    └── provider/
```

---

## layer check: each blueprint file

### domain.objects layer

| blueprint file | layer correct? | evidence |
|----------------|----------------|----------|
| DeclaredCloudflareDomainRuleRedirect.ts | yes | extant: DeclaredCloudflareDomainDnsRecord.ts at same level |
| DeclaredCloudflareDomainRuleRedirectSpec.ts | yes | extant: DeclaredCloudflareDomainDnsRecordSettings.ts at same level |
| DeclaredCloudflareDomainRuleRedirectPresets.ts | yes | constants belong with domain objects |

domain.objects is flat (no subdirectories for entities). blueprint matches.

### domain.operations layer

| blueprint file | layer correct? | evidence |
|----------------|----------------|----------|
| domainRuleRedirect/ | yes | extant: domainDnsRecord/, domainZone/, etc. |
| castIntoDeclaredCloudflareDomainRuleRedirect.ts | yes | extant: castIntoDeclaredCloudflareDomainDnsRecord.ts in domainDnsRecord/ |
| getAllDomainRuleRedirects.ts | yes | extant: getAllDomainDnsRecords.ts in domainDnsRecord/ |
| setDomainRuleRedirect.ts | yes | extant: setDomainDnsRecord.ts in domainDnsRecord/ |
| delDomainRuleRedirect.ts | yes | extant: delDomainDnsRecord.ts in domainDnsRecord/ |
| domainRuleRedirect.integration.test.ts | yes | extant: domainDnsRecord.integration.test.ts in domainDnsRecord/ |

domain.operations uses entity subdirectories. blueprint creates `domainRuleRedirect/` for the new entity. consistent.

### provider layer

| blueprint file | layer correct? | evidence |
|----------------|----------------|----------|
| getDeclastructCloudflareProvider.ts (modify) | yes | already in domain.operations/provider/ |

### contract layer

| blueprint file | layer correct? | evidence |
|----------------|----------------|----------|
| resources.acceptance.ts (modify) | yes | already in contract/sdks/.test/assets/ |
| domainRuleRedirect.journey.acceptance.test.ts | yes | same level as declastruct.acceptance.test.ts |

---

## subdomain namespace check

### question: are related operations grouped together?

**extant pattern**: each entity has its own subdirectory under domain.operations/

```
domain.operations/
├── domainDnsRecord/     # all DNS record ops
├── domainZone/          # all zone ops
├── domainRegistration/  # all registration ops
└── domainWhoisRecord/   # all whois ops
```

**blueprint**: creates `domainRuleRedirect/` subdirectory

```
domain.operations/
└── domainRuleRedirect/  # all rule redirect ops
    ├── castInto...
    ├── getAllDomainRuleRedirects.ts
    ├── setDomainRuleRedirect.ts
    ├── delDomainRuleRedirect.ts
    └── integration.test.ts
```

all redirect rule operations are grouped in one subdirectory. matches extant pattern.

### question: are we flat at the layer root?

**no** — operations are in `domainRuleRedirect/`, not directly in `domain.operations/`.

---

## consistency with extant structure

| aspect | extant | blueprint | match? |
|--------|--------|-----------|--------|
| domain.objects flat | yes | yes | yes |
| domain.operations has entity subdirs | yes | yes | yes |
| operations grouped by entity | yes | yes | yes |
| tests collocated with operations | yes | yes | yes |
| contract tests in contract/sdks/ | yes | yes | yes |

---

## summary

| layer | files placed correctly? |
|-------|------------------------|
| domain.objects | yes (flat, matches extant) |
| domain.operations | yes (subdirectory per entity) |
| provider | yes (modify extant file) |
| contract | yes (tests in contract/sdks/) |

---

## why it holds

the codebase uses:
1. flat structure for domain.objects (all entities at root)
2. entity subdirectories for domain.operations
3. tests collocated with operations

the blueprint follows all three patterns:
- domain objects at `src/domain.objects/` (flat)
- operations in `src/domain.operations/domainRuleRedirect/` (namespaced)
- tests collocated in same directory

no directory placement issues found.
