# self-review r6: has-pruned-backcompat — line-by-line audit

## r5 said "no backwards compat" — but did we look hard enough?

r5 scanned for obvious concerns. r6 audits the blueprint line-by-line for hidden compat language.

---

## method

1. read every line of blueprint
2. flag phrases that imply compat ("for compat", "to maintain", "legacy", "preserve", "backward")
3. flag design choices that smell like compat (re-exports, aliases, deprecation shims)
4. verify each flag is truly compat vs. legitimate design

---

## line-by-line audit of blueprint

### summary section

> add declarative control over cloudflare domain redirect rules

- no compat language
- states new feature

### filediff tree

```
src/domain.objects/
├── [+] DeclaredCloudflareDomainRuleRedirect.ts
├── [+] DeclaredCloudflareDomainRuleRedirect.test.ts
...
```

- all files marked `[+]` (new)
- no files marked `[~]` except provider integration (required)
- no "preserve" or "legacy" markers

### codepath tree

```
DeclaredCloudflareDomainRuleRedirect
├── [+] interface DeclaredCloudflareDomainRuleRedirect
```

- all components `[+]` (new)
- no aliases or re-exports
- no deprecated markers

### domain.operations layer

```
├── [+] getAllDomainRuleRedirects (communicator)
├── [+] setDomainRuleRedirect (orchestrator)
└── [+] delDomainRuleRedirect (communicator)
```

- standard get/set/del pattern
- no "wrapper for old API" language
- no shims

### provider layer

```
getDeclastructCloudflareProvider
└── [~] daos
    └── [+] domainRuleRedirect
```

- provider modification is architectural (add new DAO)
- not compat — just integration point

### test coverage

- all tests marked `[+]`
- no "regression test for old behavior" language
- tests verify new functionality only

### key decisions

scanned for compat phrases:

| phrase searched | found? |
|-----------------|--------|
| "for backwards compat" | no |
| "to maintain compat" | no |
| "legacy" | no |
| "preserve" | yes — "queryString: 'preserve'" |
| "backward" | no |
| "deprecated" | no |
| "alias" | no |
| "re-export" | no |

**one hit**: `queryString: 'preserve'`

is this backwards compat? **no** — this is a cloudflare API field value, not a compat shim. "preserve" means "preserve query string in redirect" — domain semantics, not code compat.

### exports

```
- `DeclaredCloudflareDomainRuleRedirect`
- `DeclaredCloudflareDomainRuleRedirectSpec`
- `RULE_REDIRECT_SPEC_HTTP_TO_HTTPS`
- `RULE_REDIRECT_SPEC_ROOT_TO_WWW`
- `getAllDomainRuleRedirects`
- `setDomainRuleRedirect`
- `delDomainRuleRedirect`
```

- all new exports
- no aliases for old names
- no re-exports from other modules

### research citations

scanned citations for compat language:

| pattern | compat? |
|---------|---------|
| pattern.1-8 references | no — patterns are architectural, not compat |
| premortem risks | no — risk mitigation, not compat |
| rootcause findings | no — problem statement, not compat |

---

## hidden compat patterns audit

### type 1: optional fields for old callers

```ts
enabled?: boolean  // optional, defaults to true
```

is this compat? **no** — this is UX design. "most rules are enabled" is a sensible default, not a compat shim for old code.

### type 2: overloaded operations

```ts
setDomainRuleRedirect: PickOne<{ findsert: ...; upsert: ... }>
```

is this compat? **no** — findsert/upsert is the declastruct pattern. both are required for declarative control.

### type 3: multiple ways to reference

```ts
zone: RefByUnique<typeof Zone>
```

is this compat? **no** — RefByUnique is the standard reference pattern in this codebase.

---

## conclusion

**zero backwards compat concerns found** in line-by-line audit:

1. all files are new (`[+]`)
2. no compat phrases in blueprint
3. no aliases, re-exports, or shims
4. "preserve" is domain semantics, not code compat
5. optional `enabled` is UX default, not compat
6. findsert/upsert is required pattern, not compat

the blueprint is clean. no unnecessary compat was added.

---

## verification

can delete any component without compat concern?

| component | deletable? | why |
|-----------|------------|-----|
| entity | no | core requirement |
| spec | no | core requirement |
| presets | yes | convenience only |
| getAll | no | declastruct requires |
| set | no | declastruct requires |
| del | no | declastruct requires |
| cast | no | API translation |
| DAO | no | provider integration |

presets are deletable (not strictly required) but were explicitly requested in wish. no compat bloat.
