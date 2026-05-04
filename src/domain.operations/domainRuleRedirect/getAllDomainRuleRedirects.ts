import { NotFoundError } from 'cloudflare/error';
import type { Rulesets } from 'cloudflare/resources/rulesets/rulesets';
import type { HasReadonly, Ref } from 'domain-objects';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
import { expandZoneRef } from '@src/domain.operations/domainZone/expandZoneRef';

import { castAllIntoDeclaredCloudflareDomainRuleRedirects } from './castIntoDeclaredCloudflareDomainRuleRedirect';

/**
 * .what = gets all redirect rules for a zone from cloudflare
 * .why = list all redirect rules for zone management
 *
 * .note
 *   - fetches from http_request_dynamic_redirect phase
 *   - filters to only redirect rules (ruleset may contain other types)
 */
export const getAllDomainRuleRedirects = async (
  input: {
    zone: Ref<typeof DeclaredCloudflareDomainZone>;
  },
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect>[]> => {
  const { client } = context.cloudflare;

  // expand zone ref to get both id and name
  const zone = await expandZoneRef(input.zone, context);

  // fetch ruleset for redirect phase
  let ruleset: Rulesets.PhaseGetResponse;
  try {
    ruleset = await client.rulesets.phases.get(
      'http_request_dynamic_redirect',
      { zone_id: zone.id },
    );
  } catch (error) {
    // ruleset doesn't exist (404) = return empty array
    if (error instanceof NotFoundError) return [];
    throw error;
  }

  // cast all redirect rules to domain objects
  return castAllIntoDeclaredCloudflareDomainRuleRedirects(ruleset, {
    name: zone.name,
  });
};
