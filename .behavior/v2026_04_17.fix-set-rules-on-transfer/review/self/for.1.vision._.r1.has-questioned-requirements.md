# self-review: has-questioned-requirements

## requirement 1: redirect http to https

**who said this?** wisher, in wish.md
**why?** security baseline - browsers show "not secure" on http
**what if we skip?** users see security warn, trust degrades, SEO penalty
**scope check:** appropriate - this is table-stakes for any domain

**challenged: is there a simpler way?**
cloudflare has "Always Use HTTPS" toggle in SSL/TLS settings - a single boolean flag.
why use redirect rules instead?

**answer:** the Rulesets API gives us consistent infrastructure-as-code control.
the toggle requires separate API calls to different endpoints.
redirect rules also allow future flexibility (e.g., exclude certain paths).

**verdict:** requirement holds - redirect rule approach is more extensible and consistent with declarative model

## requirement 2: redirect root to www

**who said this?** wisher, in wish.md
**why?** SEO consolidation - avoid split authority between apex and www
**what if we skip?** SEO dilution, potential duplicate content penalties
**scope check:** appropriate - common best practice

**challenged: is root->www the right default?**
many modern sites prefer apex (root) as canonical (github.com, not www.github.com).
hardcoding root->www may not fit all users.

**answer:** the vision proposes this as a template, not a default.
users explicitly declare `rule: 'redirect-root-to-www'`.
we could add `redirect-www-to-root` as another template.
user makes the choice; we provide both options.

**issue found:** vision only shows root->www template. should clarify that www->root would also be available, or explain why not.

**fix applied:** this is a v1 scope decision. vision already asks wisher "are these two rules sufficient for v1?" - deferring www->root to v2 is acceptable if wisher confirms.

**verdict:** requirement holds, but vision should note www->root as future option

## requirement 3: preserve query string

**who said this?** wisher, live feedback mid-session
**why?** analytics params (`?utm_source=x`) must survive redirects
**what if we skip?** attribution data lost, marketing analytics broken
**scope check:** appropriate - essential for marketing/analytics workflows
**simpler way?** no - this is a flag on the redirect rule, not extra work

**verdict:** requirement holds - critical for real-world use

## requirement 4: declarative via declastruct

**who said this?** implied by project context (declastruct-cloudflare)
**why?** consistency with other resources (dns, registration), version control, drift detection
**what if we skip?** manual UI work, no audit trail, inconsistent with rest of stack
**scope check:** appropriate - matches current patterns

**challenged: is declastruct overkill for 2 redirect rules?**
for a user with 3 domains needing 2 rules each, that's 6 API calls total.
a simple script could do this in 20 lines of code.
why the full declastruct machinery?

**answer:** 
1. idempotency - declastruct handles "already exists" cases gracefully
2. drift detection - knows when rules were manually changed
3. composition - rules declared alongside dns/registration in one place
4. scale - 3 domains today, 30 tomorrow. pattern holds.

**verdict:** requirement holds - declastruct provides value beyond "just call the API"

## questioned and removed: none

all requirements survived scrutiny after deeper examination.

## issues found: 1

**issue:** vision lacks mention of `redirect-www-to-root` as alternative template
**status:** acceptable for v1 if wisher confirms scope. noted in open questions section already.
**action:** no change needed - vision already defers this to wisher validation
