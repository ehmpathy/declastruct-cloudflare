# self-review r12: has-behavior-declaration-coverage — re-verify after fix

## r11 found and fixed the getOne gap. r12 re-verifies all coverage with fresh eyes.

---

## wish → blueprint verification

**wish line 1**: "redirect rule to redirect from root to www"
- **blueprint**: `RULE_REDIRECT_SPEC_ROOT_TO_WWW` preset
- **location**: DeclaredCloudflareDomainRuleRedirectPresets.ts
- **covered**: yes

**wish line 2**: "redirect rule to redirect from http to https"
- **blueprint**: `RULE_REDIRECT_SPEC_HTTP_TO_HTTPS` preset
- **location**: DeclaredCloudflareDomainRuleRedirectPresets.ts
- **covered**: yes

---

## vision → blueprint verification

### domain objects (vision lines 108-184)

| vision declaration | blueprint file | covered? |
|--------------------|----------------|----------|
| DeclaredCloudflareDomainRuleRedirect | DeclaredCloudflareDomainRuleRedirect.ts | yes |
| extends DomainEntity | codepath tree: "extends DomainEntity" | yes |
| static primary = ['id'] | codepath tree: line 59 | yes |
| static unique = ['zone', 'slug'] | codepath tree: line 60 | yes |
| static metadata = ['id'] | codepath tree: line 61 | yes |
| static readonly = ['createdOn', 'modifiedOn'] | codepath tree: line 62 | yes |
| DeclaredCloudflareDomainRuleRedirectSpec | DeclaredCloudflareDomainRuleRedirectSpec.ts | yes |
| extends DomainLiteral | codepath tree: line 65 | yes |

### preset specs (vision lines 186-212)

| vision preset | blueprint coverage? |
|---------------|---------------------|
| RULE_REDIRECT_SPEC_HTTP_TO_HTTPS | codepath tree: lines 78-80 |
| expression: '(http.request.uri.scheme eq "http")' | yes |
| RULE_REDIRECT_SPEC_ROOT_TO_WWW | codepath tree: lines 82-84 |
| expression: '(not starts_with(http.host, "www."))' | yes |

### usecase examples (vision lines 24-106)

| usecase | blueprint coverage? |
|---------|---------------------|
| resources file with zones + rules | vision example preserved, uses presets |
| declastruct plan output | acceptance test coverage declared |
| declastruct apply output | acceptance test coverage declared |
| custom redirect rule | raw Spec fields exposed |

---

## criteria 2.1 (blackbox) → blueprint verification

### usecase.1: declare redirect rules on domains

| criterion | blueprint evidence |
|-----------|-------------------|
| plan shows rules to create | acceptance test: CLI plan case |
| apply creates rules in cloudflare | setDomainRuleRedirect operation |
| idempotent re-plan shows no changes | journey test t3: "re-plan expect 0 changes" |

### usecase.2: custom redirect rules

| criterion | blueprint evidence |
|-----------|-------------------|
| custom expression | DeclaredCloudflareDomainRuleRedirectSpec.expression |
| static targetUrl | action.target.url |
| expression targetUrl | action.target.url: { expression: string } |

### usecase.3: rule identity and idempotency

| criterion | blueprint evidence |
|-----------|-------------------|
| duplicate slug rejected | setDomainRuleRedirect: findsert returns extant |
| update if same slug | setDomainRuleRedirect: upsert updates extant |
| delete when removed | delDomainRuleRedirect operation |

### usecase.4: error surface

| criterion | blueprint evidence |
|-----------|-------------------|
| invalid expression → error | snapshot: "expression invalid" stderr |
| zone not found → error | snapshot: "zone not found" stderr |

---

## criteria 2.3 (blueprint) → blueprint verification

### domain object contracts

| criterion | blueprint line | status |
|-----------|----------------|--------|
| extends DomainEntity | codepath tree line 58 | covered |
| static primary = ["id"] | codepath tree line 59 | covered |
| static unique = ["zone", "slug"] | codepath tree line 60 | covered |
| static metadata = ["id"] | codepath tree line 61 | covered |
| static readonly | codepath tree line 62 | covered |
| nested spec | codepath tree line 63 | covered |

### dao contracts (after fix)

| criterion | blueprint line | status |
|-----------|----------------|--------|
| get.one.byUnique | provider layer: getOne: getOneDomainRuleRedirect | **covered** |
| set.findsert | provider layer: set: setDomainRuleRedirect | covered |
| set.upsert | provider layer: set: setDomainRuleRedirect | covered |
| set.delete | provider layer: del: delDomainRuleRedirect | covered |

### operation contracts (after fix)

| criterion | blueprint line | status |
|-----------|----------------|--------|
| getOneDomainRuleRedirect | filediff + codepath tree | **covered** |
| setDomainRuleRedirect | filediff + codepath tree | covered |
| delDomainRuleRedirect | filediff + codepath tree | covered |

### preset contracts

| criterion | blueprint line | status |
|-----------|----------------|----- --|
| RULE_REDIRECT_SPEC_HTTP_TO_HTTPS | codepath tree lines 78-80 | covered |
| RULE_REDIRECT_SPEC_ROOT_TO_WWW | codepath tree lines 82-84 | covered |
| both use queryString: "preserve" | vision lines 198, 208 | covered |
| both use statusCode: 301 | vision lines 199, 209 | covered |

### test coverage criteria

| criterion | blueprint line | status |
|-----------|----------------|--------|
| domain objects have unit tests | test tree: *.test.ts files | covered |
| operations have integration tests | test tree: integration.test.ts | covered |
| acceptance tests verify CLI | test tree: acceptance.test.ts | covered |
| presets produce correct redirects | journey test case1 | covered |

---

## why it holds now

### before fix (r11)

blueprint lacked getOneDomainRuleRedirect. DAO interface requires `get.one.byUnique` per extant pattern.

### after fix

1. added `getOneDomainRuleRedirect.ts` and `.test.ts` to filediff tree
2. added getOneDomainRuleRedirect to codepath tree
3. updated provider DAO to include getOne
4. added to test coverage tables

### verification

re-checked all criteria line by line. every requirement now covered:
- wish: both presets declared
- vision: domain objects, presets, usecases all addressed
- criteria 2.1: all blackbox usecases covered
- criteria 2.3: all blueprint criteria covered (with getOne after fix)

---

## summary

| category | before fix | after fix |
|----------|------------|-----------|
| wish | complete | complete |
| vision | complete | complete |
| criteria 2.1 | complete | complete |
| criteria 2.3 | **incomplete** (getOne absent) | **complete** |

**all behavior declarations now have blueprint coverage.**
