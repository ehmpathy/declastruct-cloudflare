# self-review: has-questioned-questions (r2)

## triage of open questions

### question 1: two rules sufficient for v1?

**original:** "are these two rules (http->https, root->www) sufficient scope for v1?"
**can answer via logic?** no - product scope decision
**can answer via code/docs?** no
**does only wisher know?** yes

**triage:** [wisher]
**action:** keep as wisher question - this defines v1 scope

### question 2: support custom redirect rules?

**original:** "should we support custom redirect rules beyond these templates?"
**can answer via logic?** partially - templates reduce complexity, custom rules add power
**can answer via code/docs?** no
**does only wisher know?** yes - this is a product direction question

**triage:** [wisher]
**action:** keep as wisher question - determines future roadmap

### question 3: separate resources or bundled?

**original:** "should rules be separate resources or bundled with domain registration?"
**can answer via logic?** yes

**analysis:**
- separate resources match DNS record pattern (each DNS record is its own resource)
- bundled hides granularity - can't add/remove individual rules
- separate allows different rules for different domains
- separate is more explicit - user declares exactly what they want

**triage:** [answered]
**action:** answered in vision - separate resources is correct design

### question 4: API token permission names

**original:** "exact API token permission names for Rulesets"
**can answer via logic?** no
**can answer via code/docs?** yes - Cloudflare API docs
**does only wisher know?** no

**triage:** [research]
**action:** keep for research phase - check Cloudflare docs/dashboard

### question 5: managed rulesets or custom rules?

**original:** "whether Cloudflare has 'managed rulesets' for these common redirects or we create custom rules"
**can answer via logic?** no
**can answer via code/docs?** yes - Cloudflare API docs
**does only wisher know?** no

**triage:** [research]
**action:** keep for research phase - critical architecture question

### question 6: rate limits

**original:** "rate limits on Rulesets API"
**can answer via logic?** no
**can answer via code/docs?** yes - Cloudflare docs
**does only wisher know?** no

**triage:** [research]
**action:** keep for research phase - affects apply performance

## summary of triage

| question | triage | action |
|----------|--------|--------|
| two rules sufficient? | [wisher] | ask wisher |
| custom rules support? | [wisher] | ask wisher |
| separate vs bundled? | [answered] | separate resources |
| token permission names | [research] | check Cloudflare docs |
| managed vs custom rulesets | [research] | check Cloudflare API |
| rate limits | [research] | check Cloudflare docs |

## issues found and fixed

1. question 3 was answerable via logic - answered it
2. added [triage] labels to all questions in vision

## no issues

all questions properly categorized for next steps
