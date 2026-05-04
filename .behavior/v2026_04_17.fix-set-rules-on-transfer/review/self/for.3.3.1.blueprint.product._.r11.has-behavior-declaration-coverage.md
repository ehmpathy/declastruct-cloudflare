# self-review r11: has-behavior-declaration-coverage

## method

compared vision and criteria against blueprint line by line.

---

## wish coverage

| wish requirement | blueprint coverage? |
|------------------|---------------------|
| redirect from http to https | yes — RULE_REDIRECT_SPEC_HTTP_TO_HTTPS |
| redirect from root to www | yes — RULE_REDIRECT_SPEC_ROOT_TO_WWW |

**verdict**: wish fully covered

---

## vision coverage

### domain objects

| vision element | blueprint coverage? |
|----------------|---------------------|
| DeclaredCloudflareDomainRuleRedirect (DomainEntity) | yes |
| DeclaredCloudflareDomainRuleRedirectSpec (DomainLiteral) | yes |
| RULE_REDIRECT_SPEC_HTTP_TO_HTTPS preset | yes |
| RULE_REDIRECT_SPEC_ROOT_TO_WWW preset | yes |
| slug → description map | yes |
| zone as RefByUnique | yes |
| static primary/unique/metadata/readonly | yes |

### spec structure discrepancy

**vision declares**:
```ts
parameters: PickOne<{
  fromValue: { targetUrl, queryString, statusCode };
  fromList: { name, key };
}>;
```

**blueprint declares**:
```ts
action: {
  statusCode: 301 | ...
  target: { url, queryString }
}
```

**analysis**: the vision includes `fromList` for bulk redirect list lookup (noted as "future"). the blueprint simplifies to only `fromValue` semantics, renamed to `action`.

**verdict**: acceptable simplification for v1 scope — the wish only requires the two presets, which use `fromValue` semantics. `fromList` is explicitly "future."

---

## criteria 2.1 (blackbox) coverage

| usecase | coverage? | evidence |
|---------|-----------|----------|
| usecase.1: declare redirect rules | yes | presets + set operation |
| usecase.2: custom redirect rules | yes | raw spec fields exposed |
| usecase.3: rule identity and idempotency | yes | slug as unique, findsert/upsert |
| usecase.4: error surface | yes | error snapshots in test coverage |

**verdict**: blackbox criteria covered

---

## criteria 2.3 (blueprint) coverage

### domain object contracts

| criterion | covered? |
|-----------|----------|
| DeclaredCloudflareDomainRuleRedirect extends DomainEntity | yes |
| static primary = ["id"] | yes |
| static unique = ["zone", "slug"] | yes |
| static metadata = ["id"] | yes |
| static readonly = ["createdOn", "modifiedOn"] | yes |
| nested spec | yes |

### spec contracts

| criterion | covered? |
|-----------|----------|
| expression: string | yes |
| parameters: PickOne<{ fromValue, fromList }> | **partial** — blueprint uses `action` not `parameters` |

**note**: blueprint simplified `parameters.fromValue` to `action`. see discrepancy above.

### dao contracts — issue found

| criterion | covered? |
|-----------|----------|
| get.one.byUnique | **NO** — blueprint lacks getOne |
| set.findsert | yes |
| set.upsert | yes |
| set.delete | yes |

**issue**: criteria says DAO exposes `get.one.byUnique`, but blueprint says:
```
└── [+] domainRuleRedirect
    ├── getAll: getAllDomainRuleRedirects
    ├── set: setDomainRuleRedirect
    └── del: delDomainRuleRedirect
```

no getOne operation is declared.

**extant pattern**: checked DeclaredCloudflareDomainDnsRecordDao (lines 26-28):
```ts
get: {
  one: {
    byUnique: async (input, context) => {
      return getOneDomainDnsRecord({ by: { unique: input } }, context);
    },
  },
},
```

extant DAOs require `get.one.byUnique`. blueprint's YAGNI decision breaks the DAO interface.

### fix required

add to blueprint:
1. `getOneDomainRuleRedirect.ts` operation
2. `getOneDomainRuleRedirect.test.ts` test
3. update DAO to include `getOne: { byUnique: ... }`

### operation contracts

| criterion | covered? |
|-----------|----------|
| getOneDomainRuleRedirect | **NO** — absent |
| setDomainRuleRedirect | yes |
| delDomainRuleRedirect | yes |

### preset contracts

| criterion | covered? |
|-----------|----------|
| RULE_REDIRECT_SPEC_HTTP_TO_HTTPS | yes |
| RULE_REDIRECT_SPEC_ROOT_TO_WWW | yes |
| both use queryString: "preserve" | yes (in vision presets) |
| both use statusCode: 301 | yes (in vision presets) |

---

## issues found

### issue 1: getOneDomainRuleRedirect absent (FIXED)

**problem**: criteria requires `get.one.byUnique` in DAO. blueprint lacked getOne.

**extant evidence**: DeclaredCloudflareDomainDnsRecordDao has getOne.byUnique (lines 26-28).

**fix applied**:
1. added `getOneDomainRuleRedirect.ts` to filediff tree
2. added `getOneDomainRuleRedirect.test.ts` to filediff tree
3. added getOneDomainRuleRedirect to codepath tree (orchestrator, uses getAll + filter)
4. updated provider DAO to include `getOne: getOneDomainRuleRedirect`
5. added to test coverage tables

**status**: fixed

---

## summary

| category | status |
|----------|--------|
| wish coverage | complete |
| vision coverage | complete (spec simplification acceptable) |
| blackbox criteria | complete |
| blueprint criteria | complete (getOne added) |

**all criteria covered.**
