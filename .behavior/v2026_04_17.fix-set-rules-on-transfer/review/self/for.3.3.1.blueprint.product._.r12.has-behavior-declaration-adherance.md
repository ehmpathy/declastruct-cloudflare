# self-review r12: has-behavior-declaration-adherance

## method

compared vision spec structures against blueprint declarations field by field.

---

## domain object field map

### DeclaredCloudflareDomainRuleRedirect

| vision field | blueprint field | match? |
|--------------|-----------------|--------|
| id | id | yes |
| zone: RefByUnique | zone: RefByUnique | yes |
| slug: string | slug: string | yes |
| spec: DeclaredCloudflareDomainRuleRedirectSpec | spec: nested | yes |
| static primary = ['id'] | static primary = ['id'] | yes |
| static unique = ['zone', 'slug'] | static unique = ['zone', 'slug'] | yes |
| static metadata = ['id'] | static metadata = ['id'] | yes |
| static readonly = ['createdOn', 'modifiedOn'] | static readonly = ['createdOn', 'modifiedOn'] | yes |

### DeclaredCloudflareDomainRuleRedirectSpec

| vision field | blueprint field | match? | note |
|--------------|-----------------|--------|------|
| expression: string | expression: string | yes | |
| parameters.fromValue.targetUrl | action.target.url | **renamed** | semantic equivalent |
| parameters.fromValue.queryString | action.target.queryString | **renamed** | semantic equivalent |
| parameters.fromValue.statusCode | action.statusCode | **renamed** | semantic equivalent |
| parameters.fromList | (absent) | **deferred** | vision marks as "future" |

---

## deviation analysis

### parameters → action rename

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
  statusCode: 301 | 302 | 303 | 307 | 308;
  target: {
    url: string | { expression: string };
    queryString: 'preserve' | 'discard';
  };
};
```

**analysis**:

1. `parameters` → `action`: renamed to match cloudflare api terminology
2. `fromValue` eliminated: since `fromList` is deferred, no need for discriminated union
3. `targetUrl` → `target.url`: nested for clarity
4. field semantics preserved: all fields serve same purpose

**verdict**: acceptable deviation — aligns with api terminology while preserving semantics

### fromList deferred

vision explicitly marks `fromList` as future scope:
> "future: bulk redirect list lookup"

blueprint correctly omits this. wish only requires two presets, both use `fromValue` semantics.

**verdict**: correct deferral per vision scope

---

## preset adherance

### RULE_REDIRECT_SPEC_HTTP_TO_HTTPS

| vision | blueprint |
|--------|-----------|
| expression: '(http.request.uri.scheme eq "http")' | expression: same |
| statusCode: 301 | action.statusCode: 301 |
| queryString: 'preserve' | action.target.queryString: 'preserve' |
| targetUrl: { expression: 'concat("https://", http.host, http.request.uri.path)' } | action.target.url: same |

**verdict**: full adherance

### RULE_REDIRECT_SPEC_ROOT_TO_WWW

| vision | blueprint |
|--------|-----------|
| expression: '(not starts_with(http.host, "www."))' | expression: same |
| statusCode: 301 | action.statusCode: 301 |
| queryString: 'preserve' | action.target.queryString: 'preserve' |
| targetUrl: { expression: 'concat("https://www.", http.host, http.request.uri.path)' } | action.target.url: same |

**verdict**: full adherance

---

## operation adherance

| vision operation | blueprint operation | adherance |
|------------------|---------------------|-----------|
| getOneDomainRuleRedirect | codepath tree: orchestrator | yes |
| getAllDomainRuleRedirects | codepath tree: orchestrator | yes |
| setDomainRuleRedirect | codepath tree: orchestrator | yes |
| delDomainRuleRedirect | codepath tree: orchestrator | yes |
| castIntoDeclaredCloudflareDomainRuleRedirect | codepath tree: transformer | yes |

---

## summary

| category | adherance |
|----------|-----------|
| domain object fields | full (with acceptable renames) |
| spec fields | full (fromList correctly deferred) |
| presets | full |
| operations | full |

**blueprint adheres to vision declarations.**
