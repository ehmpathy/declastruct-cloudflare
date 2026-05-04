import type { Rulesets } from 'cloudflare/resources/rulesets/rulesets';
import { type HasReadonly, hasReadonly } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import { assure, isPresent } from 'type-fns';

import { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';
import { DeclaredCloudflareDomainRuleRedirectSpec } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirectSpec';

/**
 * .what = redirect rule shape from cloudflare SDK
 * .why = cloudflare SDK uses union types; we extract the redirect-specific shape
 */
interface CloudflareRedirectRuleShape {
  id?: string;
  description?: string;
  expression?: string;
  enabled?: boolean;
  action?: string;
  action_parameters?: {
    from_value?: {
      status_code?: 301 | 302 | 303 | 307 | 308;
      preserve_query_string?: boolean;
      target_url?: {
        expression?: string;
        value?: string;
      };
    };
  };
  last_updated?: string;
}

/**
 * .what = validates that a rule is a redirect rule
 */
const isRedirectRule = (rule: unknown): rule is CloudflareRedirectRuleShape => {
  const r = rule as CloudflareRedirectRuleShape;
  return r.action === 'redirect';
};

/**
 * .what = transforms cloudflare SDK RedirectRule to DeclaredCloudflareDomainRuleRedirect
 * .why = ensures type safety and readonly field enforcement
 *
 * .note
 *   - accepts unknown to handle SDK's union types
 *   - filters to only redirect rules
 *   - casts internally to the shape we expect
 */
export const castIntoDeclaredCloudflareDomainRuleRedirect = (
  rawInput: unknown,
  zoneRef: { name: string },
): HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect> => {
  // validate this is a redirect rule
  if (!isRedirectRule(rawInput))
    throw new UnexpectedCodePathError('expected redirect rule', { rawInput });

  const input = rawInput;
  const fromValue = input.action_parameters?.from_value;

  // extract target URL
  const targetUrl = fromValue?.target_url;
  const url: string | { expression: string } = targetUrl?.expression
    ? { expression: targetUrl.expression }
    : assure(targetUrl?.value, isPresent);

  return assure(
    DeclaredCloudflareDomainRuleRedirect.as({
      id: assure(input.id, isPresent),
      zone: zoneRef,
      slug: assure(input.description, isPresent),
      spec: new DeclaredCloudflareDomainRuleRedirectSpec({
        expression: assure(input.expression, isPresent),
        enabled: input.enabled ?? true,
        action: {
          statusCode: fromValue?.status_code ?? 301,
          target: {
            url,
            queryString: fromValue?.preserve_query_string
              ? 'preserve'
              : 'ignore',
          },
        },
      }),
      modifiedOn: input.last_updated ?? null,
    }),
    hasReadonly({ of: DeclaredCloudflareDomainRuleRedirect }),
  );
};

/**
 * .what = filters and casts a ruleset's rules to redirect rules
 * .why = ruleset contains mixed rule types; we only want redirects
 */
export const castAllIntoDeclaredCloudflareDomainRuleRedirects = (
  ruleset: Rulesets.PhaseGetResponse | null,
  zoneRef: { name: string },
): HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[] => {
  if (!ruleset?.rules) return [];

  return ruleset.rules
    .filter(isRedirectRule)
    .map((rule) => castIntoDeclaredCloudflareDomainRuleRedirect(rule, zoneRef));
};
