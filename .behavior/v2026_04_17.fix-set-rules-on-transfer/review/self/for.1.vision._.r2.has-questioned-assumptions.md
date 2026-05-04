# self-review: has-questioned-assumptions (r2)

## deep review - line by line through vision

### hidden assumption: domains are transferred (line 6)

**vision says:** "transfer a domain to Cloudflare, then manually log into dashboard"
**what was assumed:** this feature is for domain transfer scenarios
**what if:** domain is already on Cloudflare? what if Cloudflare is DNS-only (not registrar)?

**analysis:** redirect rules apply to zones, not registrations. a zone exists whether domain was transferred or just DNS-pointed. the "before" scenario describes one path but the solution applies broader.

**verdict:** no issue - vision's "before" scenario is illustrative, not exclusive

### hidden assumption: all domains want same rules (line 14)

**vision says:** "ensures all domains have consistent redirect policies"
**what was assumed:** consistency is the goal
**what if:** different domains need different rules? (api.example.com shouldn't redirect root->www)

**analysis:** the contract allows per-domain rule declarations. users choose which rules to apply to which domains. "consistent" means "what you declared matches what exists", not "all domains identical".

**verdict:** no issue - contract is flexible, vision phrasing is slightly imprecise but not wrong

### hidden assumption: drift detection exists (line 17)

**vision says:** "drift detection alerts if someone manually changes rules"
**what was assumed:** declastruct provides drift detection for rulesets
**evidence:** none shown - this is a claim about future capability

**issue found:** drift detection is assumed but not part of v1 scope
**analysis:** declastruct's general model does detect drift on `plan` but vision presents this as a feature without proof it works for rulesets

**verdict:** should clarify - drift detection is declastruct core behavior, not ruleset-specific work

### hidden assumption: domain string suffices (line 33-43)

**vision says:** `declareCloudflareDomainRedirectRule({ domain: 'example.com', ... })`
**what was assumed:** domain is a string
**what if:** need zone_id? what about subdomains? does rule apply to all subdomains?

**analysis:** http->https should apply zone-wide (with subdomains). root->www is apex-specific by definition. the contract hides zone lookup complexity.

**verdict:** holds - string domain is ergonomic; we lookup zone internally

### hidden assumption: time estimates (line 67)

**vision says:** "~30 sec per domain"
**what was assumed:** we know how long API calls take
**evidence:** none - pulled from thin air

**issue found:** time estimate is guesswork
**analysis:** this is fine for vision doc. estimates help users plan. acceptable.

**verdict:** acceptable for vision - estimates are directional

### hidden assumption: TypeScript literal types (line 106)

**vision says:** "invalid rule names caught at compile time via TypeScript literals"
**what was assumed:** implementation uses `rule: 'redirect-http-to-https' | 'redirect-root-to-www'`
**what if:** we use string enum or don't constrain?

**analysis:** TypeScript literal union is standard pattern. this is an implementation intent, not assumption.

**verdict:** holds - this is a design choice documented in pit-of-success section

### hidden assumption: "confirmed" SDK support (line 113)

**vision says:** "Cloudflare SDK v5.2.0 supports zone rulesets (confirmed)"
**what was assumed:** research agent's result = confirmed
**reality:** research found method names exist in SDK; no actual API call tested

**analysis:** "confirmed" means research found the methods exist. integration test validates they work. acceptable for vision stage.

**verdict:** holds - vision captures research result; build validates with test

### hidden assumption: managed rulesets exist (line 128)

**vision says:** "whether Cloudflare has 'managed rulesets' for these common redirects"
**what was assumed:** this is just a research item
**reality:** this is a critical architecture question

**analysis:** if Cloudflare has built-in templates, we enable them. if not, we create custom rules with expressions. the API contract differs significantly.

**verdict:** correctly flagged as research needed - no change required

## issues found and fixed

1. **301 status code not specified** - added to validated requirements

## issues deferred (acceptable for v1 vision)

1. drift detection - is core declastruct behavior, not ruleset-specific
2. time estimates - directional, users understand these are approximate
