import type { RedirectRuleParam } from 'cloudflare/resources/rulesets/rules';
import type { HasReadonly } from 'domain-objects';

import type { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';

/**
 * .what = transforms DeclaredCloudflareDomainRuleRedirect to Cloudflare API rule param
 * .why = enables set operations to pass domain objects to cloudflare SDK
 *
 * .note
 *   - maps slug to description (cloudflare uses description as rule name)
 *   - maps spec fields to action_parameters structure
 */
export const castIntoCloudflareRedirectRuleParam = (
  rule: DeclaredCloudflareDomainRuleRedirect,
): RedirectRuleParam => {
  // build target_url shape
  const targetUrl =
    typeof rule.spec.action.target.url === 'string'
      ? { value: rule.spec.action.target.url }
      : { expression: rule.spec.action.target.url.expression };

  return {
    id: rule.id,
    action: 'redirect',
    description: rule.slug,
    expression: rule.spec.expression,
    enabled: rule.spec.enabled ?? true,
    action_parameters: {
      from_value: {
        status_code: rule.spec.action.statusCode,
        preserve_query_string:
          rule.spec.action.target.queryString === 'preserve',
        target_url: targetUrl,
      },
    },
  };
};

/**
 * .what = transforms array of rules to cloudflare api params
 * .why = extracts map operation from orchestrators
 */
export const castAllIntoCloudflareRedirectRuleParams = (
  rules: HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[],
): RedirectRuleParam[] => rules.map(castIntoCloudflareRedirectRuleParam);
