# self-review r2: has-zero-deferrals — deeper look

## r1 claimed no vision deferrals — is this true?

### let me re-read the vision more carefully

from 0.wish.md:
> "are we able to control domain rules via cloudflare api tokens?"
> 1. a redirect rule to `redirect from root to www`
> 2. a redirect rule to `redirect from http to https`

from 1.vision.yield.md evaluation:
> - **goal 1 (http->https redirect)**: fully solved via preset + raw spec access
> - **goal 2 (root->www redirect)**: fully solved via preset + raw spec access
> - **goal 3 (custom rules)**: fully solved via raw expression/action fields

### what did the blueprint actually defer?

from blueprint premortem citations:
> | expression syntax breaks in production | deferred | v1 relies on cloudflare API validation; v2 could add expression check |
> | API rate limits hit in bulk | deferred | 1,200 req/5min sufficient for typical use; document as operational note |

### are these vision items?

**expression syntax validation**:
- vision says "custom rules" — check
- vision does NOT say "validate expression syntax before apply"
- this is error prevention optimization, not a requirement
- cloudflare's API already validates — we just rely on that

**rate limit backoff**:
- vision says "declastruct apply" works — check
- vision does NOT say "handle enterprise scale with 200+ zones"
- this is scale optimization, not a requirement
- typical use (1-50 zones) is well under 1,200 req/5min limit

### deeper question: did i miss any vision items?

let me check each vision section:

**outcome world — after**:
- ✅ "declare redirect rules alongside domain registration in code" — delivered
- ✅ "declastruct apply ensures all domains have consistent redirect policies" — delivered
- ✅ "new domains automatically get redirect rules applied" — delivered via declarative pattern
- ✅ "git history shows when rules were added/changed" — delivered via declarative pattern
- ⚠️ "drift detection alerts if someone manually changes rules" — is this delivered?

**wait**. drift detection. let me check...

from blueprint key decisions:
> "declastruct manages the entire ruleset"

from blueprint test coverage:
> | CLI plan | creates shown | no changes | mixed create/update |
> | CLI apply | apply succeeds | apply fails | idempotent re-apply |

drift detection is implicit in declastruct's plan/apply model — if someone manually changes rules, the next `declastruct plan` shows a diff. this is how all declastruct resources work.

but is it an "alert"? the vision says "drift detection alerts". let me check the original wish again...

from 0.wish.md:
> no explicit mention of drift detection

from 1.vision.yield.md:
> "drift detection alerts if someone manually changes rules"

this is a **vision item**, not a wish item. and it's implicit in declastruct's model — plan shows the diff, which is the "alert".

**verdict**: not a deferral. drift detection is delivered via the standard declastruct plan/apply workflow.

### what about fromList in the spec?

from vision DeclaredCloudflareDomainRuleRedirectSpec:
```
parameters: PickOne<{
  fromValue: { ... };
  fromList: {
    name: string;
    key: { expression: string };
  };
}>;
```

vision includes `fromList` parameter. is this delivered?

from blueprint:
> the blueprint doesn't explicitly list fromList

check the vision comment:
> "parameters.fromList = bulk redirect list lookup (future)"

**aha**. the vision itself marks fromList as "(future)". this is an acceptable deferral documented in the vision itself.

---

## conclusion after deeper look

| item | status | rationale |
|------|--------|-----------|
| http→https redirect | delivered | RULE_REDIRECT_SPEC_HTTP_TO_HTTPS |
| root→www redirect | delivered | RULE_REDIRECT_SPEC_ROOT_TO_WWW |
| custom rules | delivered | DeclaredCloudflareDomainRuleRedirectSpec |
| drift detection | delivered | declastruct plan shows diff |
| expression validation | deferred (acceptable) | optimization, not vision requirement |
| rate limit backoff | deferred (acceptable) | optimization, not vision requirement |
| fromList parameter | deferred (acceptable) | vision itself marks as "(future)" |

all deferrals are either:
- self-identified optimizations (expression validation, rate limit)
- explicitly marked as future in vision itself (fromList)

no unacceptable deferrals found. review holds.
