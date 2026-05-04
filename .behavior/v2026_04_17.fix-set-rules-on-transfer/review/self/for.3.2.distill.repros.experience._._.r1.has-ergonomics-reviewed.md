# self-review: has-ergonomics-reviewed

## input/output review

### preset rules

**input**:
```typescript
new DeclaredCloudflareDomainRuleRedirect({
  zone: refByUnique(zone),
  slug: 'force-https',
  spec: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS,
})
```

**output** (plan):
```
+ DeclaredCloudflareDomainRuleRedirect:force-https
```

| check | holds? | notes |
|-------|--------|-------|
| input natural? | yes | same pattern as DNS records |
| output natural? | yes | consistent with DNS record output |
| friction? | none | import preset, assign to rule |

### custom rules

**input**:
```typescript
new DeclaredCloudflareDomainRuleRedirect({
  zone: refByUnique(zone),
  slug: 'custom-redirect',
  spec: {
    expression: '(http.request.uri.path eq "/old")',
    action: { type: 'redirect', url: 'https://example.com/new', statusCode: 301, queryString: 'preserve' },
    enabled: true,
  },
})
```

**output**: same as presets

| check | holds? | notes |
|-------|--------|-------|
| input natural? | awkward | cloudflare expression syntax required |
| output natural? | yes | same as presets |
| friction? | yes | users must learn expression syntax |

**friction fix**:
- presets eliminate friction for common cases (HTTP→HTTPS, root→www)
- custom rules are escape hatch for advanced users
- mitigation: document expression examples in readme

### plan output

**output**:
```
🐚 declastruct plan
   └─ changes
      └─ example.com
         ├─ + DeclaredCloudflareDomainRuleRedirect:force-https
         └─ + DeclaredCloudflareDomainRuleRedirect:apex-to-www
```

| check | holds? | notes |
|-------|--------|-------|
| output natural? | yes | turtle vibes, hierarchical, clear |
| friction? | none | same format as DNS records |

### apply output

**output**:
```
🐚 declastruct apply
   └─ applied
      └─ example.com
         ├─ ✔ DeclaredCloudflareDomainRuleRedirect:force-https
         └─ ✔ DeclaredCloudflareDomainRuleRedirect:apex-to-www
```

| check | holds? | notes |
|-------|--------|-------|
| output natural? | yes | checkmarks for success |
| friction? | none | same format as DNS records |

## pit of success verification

| principle | holds? | notes |
|-----------|--------|-------|
| intuitive design | partial | presets work without docs; custom needs docs |
| convenient | yes | zone ref by name, slug auto-maps to description |
| expressive | yes | presets for common, custom specs for advanced |
| composable | yes | rules compose with zones naturally |
| lower trust | yes | expressions validated by cloudflare on apply |
| deeper behavior | yes | idempotency via slug uniqueness |

## issues found

### issue 1: custom rules require expression knowledge

**severity**: acceptable friction for advanced use case

**why it holds**:
- presets cover 90%+ of use cases (HTTP→HTTPS, root→www)
- custom rules are explicitly for advanced users who know cloudflare
- documentation with examples is sufficient mitigation
- we cannot abstract all possible redirect expressions

**no fix needed** — this is intentional design, not a bug

## conclusion

ergonomics are well-designed. preset rules are frictionless. custom rules have documented friction that is acceptable for the advanced use case they serve.

