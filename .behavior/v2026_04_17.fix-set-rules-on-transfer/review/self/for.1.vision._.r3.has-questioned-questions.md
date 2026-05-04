# self-review: has-questioned-questions

## question 1: are these two rules sufficient for v1?

**location:** vision line 118
**current triage:** [wisher]

**can this be answered via logic now?** no - scope is a product decision, not technical
**can this be answered via docs/code now?** no - no scope docs exist
**does only wisher know?** yes - wisher defines what v1 includes

**challenged: could we answer this ourselves?**
wisher explicitly asked for these two rules in wish.md. we could interpret this as "yes, these two are sufficient" and mark [answered].

**answer:** keep as [wisher] - explicit confirmation reduces risk of scope creep or misalignment. safer to confirm than assume.

**verdict:** triage holds as [wisher]

## question 2: should we support custom redirect rules?

**location:** vision line 119
**current triage:** [wisher]

**can this be answered via logic now?** no - this is product roadmap
**can this be answered via docs/code now?** no
**does only wisher know?** yes - determines v2+ direction

**challenged: does vision already answer this?**
vision line 144 says "users who want custom rules would need to use Cloudflare directly (for now)". this is the v1 answer.

**answer:** v1 answer exists in vision. keep as [wisher] to determine if v2 should include custom rules.

**verdict:** triage holds as [wisher]

## question 3: separate resources or bundled?

**location:** vision line 120-121
**current triage:** [answered]

**was this answerable via logic?** yes
**how was it answered?** separate resources match DNS pattern, allow per-domain flexibility, more explicit

**verdict:** correctly marked [answered] - no change needed

## question 4: API token permission names

**location:** vision line 128-129
**current triage:** [answered]

**was this answerable via docs/code?** yes - found in repo brief
**how was it answered?** checked `howto.cloudflare.api-tokens-and-keys.md`, found pattern Zone - {Resource} - Edit

**issue found:** this was originally marked [research] but was answerable from repo docs
**fix applied:** updated to [answered] with answer "Zone - Rules - Edit"

**verdict:** correctly updated to [answered]

## question 5: managed vs custom rulesets?

**location:** vision line 130
**current triage:** [research]

**can this be answered via logic now?** partially - managed rulesets are typically WAF, redirects are likely custom
**can this be answered via docs/code now?** no - no Cloudflare Rulesets API docs in repo
**does only wisher know?** no - this is technical, not product

**why research is correct:** requires Cloudflare API docs or actual API call to confirm. cannot answer from repo contents.

**verdict:** triage holds as [research]

## question 6: rate limits?

**location:** vision line 131
**current triage:** [research]

**can this be answered via logic now?** no - rate limits are arbitrary Cloudflare policy
**can this be answered via docs/code now?** no - SDK doesn't encode rate limits
**does only wisher know?** no - this is Cloudflare's policy

**why research is correct:** requires external Cloudflare documentation lookup

**verdict:** triage holds as [research]

## question 7: will phase names leak into public API?

**location:** implicit from vision line 136 ("names might leak")
**current triage:** not enumerated - needs to be added

**can this be answered via logic now?** yes
**answer:** no - we control the declared type names (`DeclaredCloudflareDomainRedirectRule`), phase names (`http_request_dynamic_redirect`) are internal implementation details

**issue found:** implicit question not enumerated in vision
**fix applied:** added to vision under "questions surfaced from 'what is awkward' section" with [answered] triage

**verdict:** added and answered

## question 8: how do users who want custom rules proceed in v1?

**location:** implicit from vision line 144 ("for now")
**current triage:** not enumerated - needs to be added

**can this be answered via logic now?** yes - vision already states the answer
**answer:** use Cloudflare directly; v1 scope excludes custom rules

**issue found:** implicit question not enumerated in vision
**fix applied:** added to vision with [answered] triage

**verdict:** added and answered

## summary of triage results

| # | question | triage | why |
|---|----------|--------|-----|
| 1 | two rules sufficient? | [wisher] | product scope decision |
| 2 | custom rules support? | [wisher] | product roadmap |
| 3 | separate vs bundled? | [answered] | logic: matches DNS pattern |
| 4 | API token permissions? | [answered] | found in repo docs |
| 5 | managed vs custom? | [research] | needs Cloudflare API docs |
| 6 | rate limits? | [research] | needs Cloudflare docs |
| 7 | phase name leakage? | [answered] | logic: we control type names |
| 8 | custom rules in v1? | [answered] | vision states answer |

## issues found: 3

1. **API token permission was answerable** - changed from [research] to [answered]
2. **implicit question 7 not enumerated** - added to vision
3. **implicit question 8 not enumerated** - added to vision

## all questions now enumerated in vision

confirmed: vision "open questions & assumptions" section now contains all 8 questions with proper triage labels
