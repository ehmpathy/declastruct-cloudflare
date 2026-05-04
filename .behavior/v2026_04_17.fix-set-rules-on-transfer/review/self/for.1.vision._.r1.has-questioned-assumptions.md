# self-review: has-questioned-assumptions

## explicit assumptions from vision

### assumption 1: Cloudflare SDK v5.2.0 supports zone rulesets

**stated as:** "confirmed"
**what if false?** we'd need to use raw HTTP API calls
**evidence:** research agent confirmed sdk has `client.zones.rulesets.*` methods

**verification needed:** actually call the SDK method in a test to confirm
**verdict:** assumption holds, but should validate with integration test before build

### assumption 2: API tokens can be scoped to Ruleset Edit permission

**stated as:** assumption
**what if false?** users would need broader token permissions than necessary
**evidence:** Cloudflare permissions are granular; similar permissions exist for DNS, Transform Rules

**verification needed:** check Cloudflare docs or dashboard for exact permission name
**verdict:** likely true, but research item remains open - acceptable risk

### assumption 3: redirect rules are zone-level, not account-level

**stated as:** assumption  
**what if false?** API calls would target account endpoint, not zone endpoint
**evidence:** DNS records are zone-level; rulesets docs show `/zones/{zone_id}/rulesets`

**verdict:** assumption holds - rulesets are zone-scoped per Cloudflare API structure

## hidden assumptions surfaced

### hidden assumption 4: users want separate redirect rule resources

**what was assumed:** each redirect rule is its own declared resource
**wisher actually said:** "set a redirect rule" (singular per type)
**what if bundled?** could have single `declareCloudflareDomainRedirectConfig({ domain, rules: ['http-to-https', 'root-to-www'] })`

**analysis:** separate resources match DNS record pattern (each record is a resource).
bundled approach hides granularity. separate is more explicit.

**verdict:** assumption is reasonable design choice, but vision should acknowledge alternative

### hidden assumption 5: 301 permanent redirects are correct

**what was assumed:** redirects use HTTP 301 status code
**wisher never specified:** status code
**what if 302?** temporary redirects have different browser/SEO behavior

**analysis:** for canonical redirects (http->https, root->www), 301 is standard.
cloudflare templates likely default to 301.

**verdict:** assumption is safe default. vision should confirm 301 is used.

### hidden assumption 6: redirects apply to all paths

**what was assumed:** root->www redirect applies to `example.com/any/path` -> `www.example.com/any/path`
**what if path-specific?** some users might want `example.com/` -> `www.example.com/` but not subpaths

**analysis:** path preservation is standard for these templates.
cloudflare's built-in templates preserve paths.

**verdict:** assumption holds - path preservation is expected behavior

### hidden assumption 7: rules should be immutable once applied

**what was assumed:** declare once, apply, done
**what if rules need update?** user changes from root->www to www->root

**analysis:** declastruct handles updates via plan/apply cycle.
a different declared rule would show as change in plan.
vision doesn't show update/delete UX.

**issue found:** vision lacks update/delete flow example

**fix:** acceptable for v1 vision - declastruct's general update model applies

## summary

| assumption | status |
|------------|--------|
| SDK supports rulesets | holds, verify in test |
| API token can scope to rulesets | likely, research queued |
| rules are zone-level | holds |
| separate resources | reasonable choice |
| 301 status code | safe default, confirm |
| all paths redirected | holds |
| immutable rules | covered by declastruct model |

## issues found: 2

1. vision should confirm 301 status code is used
2. vision lacks update/delete flow (acceptable for v1, declastruct handles this)
