import type { Ref } from 'domain-objects';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
import { expandZoneRef } from '@src/domain.operations/domainZone/expandZoneRef';

import { castAllIntoCloudflareRedirectRuleParams } from './castIntoCloudflareRedirectRuleParam';
import { filterOutRuleById, findRuleByKey } from './findRuleByKey';
import { getAllDomainRuleRedirects } from './getAllDomainRuleRedirects';

/**
 * .what = deletes a redirect rule from cloudflare
 * .why = enables declarative redirect rule removal
 *
 * .note
 *   - operates on entire ruleset (cloudflare requires PUT of full ruleset)
 *   - returns true if deleted, false if not found
 */
export const delDomainRuleRedirect = async (
  input: {
    zone: Ref<typeof DeclaredCloudflareDomainZone>;
    by: PickOne<{
      primary: { id: string };
      unique: { slug: string };
    }>;
  },
  context: ContextCloudflareApi,
): Promise<{ deleted: boolean }> => {
  const { client } = context.cloudflare;

  // expand zone ref to get both id and name
  const zone = await expandZoneRef(input.zone, context);

  // get all rules for this zone
  const rulesFound = await getAllDomainRuleRedirects(
    { zone: { name: zone.name } },
    context,
  );

  // find the rule to delete
  const ruleToDelete = findRuleByKey({ rules: rulesFound, by: input.by });
  if (!ruleToDelete) return { deleted: false };

  // filter out the rule to delete
  const rulesLeft = filterOutRuleById({
    rules: rulesFound,
    id: ruleToDelete.id,
  });

  // update the ruleset without the deleted rule
  await client.rulesets.phases.update('http_request_dynamic_redirect', {
    zone_id: zone.id,
    rules: castAllIntoCloudflareRedirectRuleParams(rulesLeft),
  });

  return { deleted: true };
};
