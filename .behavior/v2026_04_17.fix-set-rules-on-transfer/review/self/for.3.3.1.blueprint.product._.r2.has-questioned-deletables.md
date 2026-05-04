# self-review r2: has-questioned-deletables

## review question

can any features or components be deleted? did we assume any need that wasn't explicit?

---

## features review

### feature: DeclaredCloudflareDomainRuleRedirect entity

**traceable to wish?** yes
> wish: "control domain rules via cloudflare api tokens"
> vision: "DeclaredCloudflareDomainRuleRedirect" explicitly declared

**can this be deleted?** no — core deliverable

### feature: DeclaredCloudflareDomainRuleRedirectSpec literal

**traceable to wish?** yes
> vision: "DeclaredCloudflareDomainRuleRedirectSpec" explicitly declared
> usecase: spec holds expression/parameters config

**can this be deleted?** no — rules need config, spec is the config container

### feature: RULE_REDIRECT_SPEC_HTTP_TO_HTTPS preset

**traceable to wish?** yes
> wish: "a redirect rule to redirect from http to https"
> vision: "RULE_REDIRECT_SPEC_HTTP_TO_HTTPS" explicitly declared

**can this be deleted?** no — core deliverable

### feature: RULE_REDIRECT_SPEC_ROOT_TO_WWW preset

**traceable to wish?** yes
> wish: "a redirect rule to redirect from root to www"
> vision: "RULE_REDIRECT_SPEC_ROOT_TO_WWW" explicitly declared

**can this be deleted?** no — core deliverable

### feature: getAllDomainRuleRedirects operation

**traceable to requirements?** yes
> declastruct pattern: provider needs getAll for plan/apply workflow
> internal research: pattern.4 (getOne) and DAO pattern require get operations

**can this be deleted?** no — declastruct needs to enumerate extant rules

### feature: getOneDomainRuleRedirect operation

**traceable to requirements?** yes
> internal research: pattern.4 — getOne operation for lookup by unique key

**can this be deleted?** maybe? let me think...

getOne is used by set operation to check if rule exists. without it, set would need to call getAll and filter.

**if deleted**: set calls getAll, filters by slug. adds overhead for large rulesets.
**if kept**: direct lookup by slug, more efficient.

**verdict**: keep — matches extant DNS record pattern, efficient lookup

### feature: setDomainRuleRedirect operation

**traceable to requirements?** yes
> wish: "control domain rules" implies create/update
> internal research: pattern.5 — set with findsert/upsert

**can this be deleted?** no — core mutation operation

### feature: delDomainRuleRedirect operation

**traceable to requirements?** implicit
> wish doesn't explicitly ask for delete
> but declastruct pattern requires delete for removal

**can this be deleted?** let me think...

without delete, users can't remove rules that are no longer in resources file. declastruct would show them as "to be deleted" in plan but couldn't apply.

**verdict**: keep — necessary for complete declarative control

---

## components review

### component: slug→description translation

**can this be removed?** let me think...

cloudflare's `description` field is freeform. we use `slug` as our identifier.

alternative: use description directly, no translation
- users write `description: 'Force HTTPS'` instead of `slug: 'force-https'`
- simpler internally, no translation layer

**but**: slug convention enforces consistency (kebab-case), prevents whitespace issues, aligns with other declastruct patterns (e.g., ref slugs)

**verdict**: keep — convention adds value for consistency

### component: expandZoneRef utility

**can this be removed?** no — reused from DNS records, handles zone lookup by name or id

**if deleted and had to add back, would we?** yes — zone reference expansion is needed for all zone-level resources

### component: castInto* transformer

**can this be removed?** no — transforms cloudflare snake_case to our camelCase

**simplest version?** exactly what's planned — map fields, assure readonly

### component: DAO via genDeclastructDao

**can this be removed?** no — declastruct integration requires DAO

**simplest version?** follow extant pattern exactly

---

## assumptions questioned

### assumption: presets use 301 status code

**did wisher ask for 301?** not explicitly
**is 301 the right default?** yes — SEO research confirms permanent redirects should use 301
**can this be simplified?** no — 301 is the correct choice

### assumption: presets preserve query strings

**did wisher ask for query string preservation?** not explicitly
**is this the right default?** yes — analytics requires query strings to be preserved
**can this be simplified?** no — preserve is the safe default

### assumption: presets use specific expressions

| preset | expression |
|--------|------------|
| HTTP_TO_HTTPS | `(http.request.uri.scheme eq "http")` |
| ROOT_TO_WWW | `(not starts_with(http.host, "www."))` |

**can these be simpler?** no — these are the minimal expressions that work

---

## potential deletions considered

| item | delete? | reason |
|------|---------|--------|
| getOneDomainRuleRedirect | no | efficient lookup, matches pattern |
| delDomainRuleRedirect | no | needed for removal |
| slug→description translation | no | enforces consistency |
| queryString field in spec | no | needed for analytics preservation |
| enabled field in spec | no | cloudflare requires it |

---

## conclusion

no deletable features or components found. all items trace to:
1. explicit wish requirements
2. explicit vision declarations
3. declastruct integration patterns (necessary for the tool to work)
4. research-informed defaults (301, query string preservation)

the blueprint is minimal for the stated requirements.
