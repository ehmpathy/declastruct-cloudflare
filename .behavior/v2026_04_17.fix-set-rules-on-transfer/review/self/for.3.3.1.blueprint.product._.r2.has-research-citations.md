# self-review r2: has-research-citations

## deeper review: did i cite ALL research files?

### issue found in r1

r1 only cited 3 research files:
- 3.1.1.research.external.product.flagged._
- 3.1.3.research.internal.product.code.prod._
- 3.1.3.research.internal.product.code.test._

but 7 more research yield files exist:
- 3.1.1.research.external.product.access._
- 3.1.1.research.external.product.claims._
- 3.1.5.research.reflection.product.audience._
- 3.1.5.research.reflection.product.premortem._
- 3.1.5.research.reflection.product.rootcause._
- 3.2.distill.repros.experience._

### fix applied

updated blueprint research citations section to include:

1. **claims research** — 7 claims cited:
   - 301 redirects transfer SEO signals → preset statusCode defaults
   - www vs non-www duplicate content → ROOT_TO_WWW motivation
   - query string preservation → spec.action.target.queryString
   - Single Redirects at zone level → architecture
   - Single Redirects support expressions → concat() in targets
   - concurrent updates cause rate limits → PUT semantics
   - [KHUE] zone.name in expressions → answered in flagged

2. **premortem research** — 4 risks cited:
   - PUT wipes extant rules → documented mitigation
   - expression syntax breaks → deferred to v2
   - rate limits in bulk → document as operational note
   - redirect loop → test coverage

3. **rootcause research** — root cause and fix cited

4. **audience research** — primary audience and pain points cited

5. **experience reproductions** — journeys and critical paths cited

### access research (not cited)

file: 3.1.1.research.external.product.access._.yield.md

this file confirms API token permissions for rulesets. relevant result:
- Zone > Zone Settings > Edit permission needed for rulesets

**verdict**: this is operational setup, not blueprint decision. referenced in "required setup" section but not a claim that needs traceability.

### verification

all yield files checked:
- 3.1.1.research.external.product.access._ — operational setup, not a blueprint claim
- 3.1.1.research.external.product.claims._ — 7 claims cited
- 3.1.1.research.external.product.flagged._ — 7 citations in key decisions
- 3.1.3.research.internal.product.code.prod._ — 8 patterns cited
- 3.1.3.research.internal.product.code.test._ — 8 patterns cited
- 3.1.5.research.reflection.product.audience._ — 3 results cited
- 3.1.5.research.reflection.product.premortem._ — 4 risks cited
- 3.1.5.research.reflection.product.rootcause._ — 2 results cited
- 3.2.distill.repros.experience._ — 4 elements cited

## conclusion

all research claims are now cited in blueprint with full traceability. deferred items are explicitly noted with rationale.

