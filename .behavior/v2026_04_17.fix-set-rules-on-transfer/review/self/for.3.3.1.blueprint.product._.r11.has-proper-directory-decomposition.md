# self-review r11: has-proper-directory-decomposition — deep analysis

## r10 verified layer placement. r11 examines subdomain relationships.

---

## question: should ruleRedirect be nested under zone?

the guide warns against:
```
domain.operations/
  customer/
  phone/           # should be under customer/
```

applied to our domain:
```
domain.operations/
  domainZone/
  domainRuleRedirect/   # should this be under domainZone/?
```

### extant pattern analysis

examined how extant entities relate to zone:

| entity | relationship to zone | directory placement |
|--------|---------------------|---------------------|
| DnsRecord | belongs to zone | domainDnsRecord/ (peer) |
| Registration | belongs to zone | domainRegistration/ (peer) |
| WhoisRecord | belongs to zone | domainWhoisRecord/ (peer) |

**result**: entities that belong to zone are NOT nested under domainZone/. they are peers.

### why peers, not nested?

examined the codebase's bounded context boundaries:

1. **DnsRecord** — manages DNS records (A, AAAA, CNAME, etc.)
2. **Zone** — manages zone lifecycle (create, activate, delete)
3. **Registration** — manages domain registration (transfer, purchase)
4. **RuleRedirect** — manages redirect rules

each represents a distinct API surface in cloudflare:
- zones API: `GET /zones`
- dns_records API: `GET /zones/{zone_id}/dns_records`
- registrar API: `GET /accounts/{account_id}/registrar/domains`
- rulesets API: `GET /zones/{zone_id}/rulesets/phases/http_request_dynamic_redirect`

different API surfaces = different bounded contexts = peer directories.

### conclusion

ruleRedirect belongs as a peer to dnsRecord, not nested under zone.

**extant pattern**: zone-related entities are peers, not children
**blueprint**: follows this pattern

---

## file-by-file layer verification

### domain.objects layer (flat)

extant:
```
src/domain.objects/
├── DeclaredCloudflareDomainZone.ts
├── DeclaredCloudflareDomainDnsRecord.ts
├── DeclaredCloudflareDomainDnsRecordSettings.ts
├── DeclaredCloudflareDomainRegistration.ts
└── ...
```

blueprint adds:
```
src/domain.objects/
├── [+] DeclaredCloudflareDomainRuleRedirect.ts
├── [+] DeclaredCloudflareDomainRuleRedirectSpec.ts
└── [+] DeclaredCloudflareDomainRuleRedirectPresets.ts
```

**verdict**: flat at layer root. matches extant.

### domain.operations layer (entity subdirectories)

extant:
```
src/domain.operations/
├── domainZone/
├── domainDnsRecord/
├── domainRegistration/
├── domainWhoisRecord/
└── provider/
```

blueprint adds:
```
src/domain.operations/
└── [+] domainRuleRedirect/
    ├── castIntoDeclaredCloudflareDomainRuleRedirect.ts
    ├── getAllDomainRuleRedirects.ts
    ├── setDomainRuleRedirect.ts
    ├── delDomainRuleRedirect.ts
    └── domainRuleRedirect.integration.test.ts
```

**verdict**: new entity subdirectory at peer level. matches extant.

### contract layer (test files)

extant:
```
src/contract/sdks/
├── declastruct.acceptance.test.ts
├── index.integration.test.ts
└── .test/assets/
    └── resources.acceptance.ts
```

blueprint adds:
```
src/contract/sdks/
└── [+] domainRuleRedirect.journey.acceptance.test.ts
```

**verdict**: test file at same level as extant acceptance tests. matches extant.

---

## summary table

| blueprint file | layer | correct? | why |
|----------------|-------|----------|-----|
| DeclaredCloudflareDomainRuleRedirect.ts | domain.objects | yes | flat, peer to other entities |
| DeclaredCloudflareDomainRuleRedirectSpec.ts | domain.objects | yes | flat, peer to Settings |
| DeclaredCloudflareDomainRuleRedirectPresets.ts | domain.objects | yes | flat, constants with entities |
| domainRuleRedirect/ | domain.operations | yes | entity subdir, peer to domainDnsRecord |
| castInto*.ts | domain.operations/domainRuleRedirect | yes | transformer in entity subdir |
| getAllDomainRuleRedirects.ts | domain.operations/domainRuleRedirect | yes | operation in entity subdir |
| setDomainRuleRedirect.ts | domain.operations/domainRuleRedirect | yes | operation in entity subdir |
| delDomainRuleRedirect.ts | domain.operations/domainRuleRedirect | yes | operation in entity subdir |
| integration.test.ts | domain.operations/domainRuleRedirect | yes | collocated test |
| journey.acceptance.test.ts | contract/sdks | yes | acceptance test at sdk level |
| resources.acceptance.ts (modify) | contract/sdks/.test/assets | yes | test assets |
| getDeclastructCloudflareProvider.ts (modify) | domain.operations/provider | yes | provider integration |

---

## why it holds

1. **bounded contexts**: ruleRedirect is a distinct API surface — warrants peer status
2. **extant pattern**: zone-related entities (DnsRecord, Registration) are peers, not children
3. **layer correctness**: all files placed in appropriate layers
4. **grouped correctly**: all ruleRedirect operations in one subdirectory
5. **consistency**: matches extant directory structure exactly
