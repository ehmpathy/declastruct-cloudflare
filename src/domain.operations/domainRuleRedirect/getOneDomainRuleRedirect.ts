import type { HasReadonly, Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { findRuleByKey } from './findRuleByKey';
import { getAllDomainRuleRedirects } from './getAllDomainRuleRedirects';

/**
 * .what = gets a redirect rule from cloudflare
 * .why = enables declarative redirect rule lookups by primary or unique key
 *
 * .note
 *   - uses getAll + filter since cloudflare does not expose single rule lookup
 */
export const getOneDomainRuleRedirect = async (
  input: {
    by: PickOne<{
      primary: { id: string; zone: Ref<typeof DeclaredCloudflareDomainZone> };
      unique: {
        zone: Ref<typeof DeclaredCloudflareDomainZone>;
        slug: string;
      };
    }>;
  },
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainRuleRedirect> | null> => {
  // get zone ref from either primary or unique
  const zoneRef = input.by.primary?.zone ?? input.by.unique?.zone;
  if (!zoneRef)
    throw new UnexpectedCodePathError('no zone ref in input', { input });

  // get all rules and find by key
  const rules = await getAllDomainRuleRedirects({ zone: zoneRef }, context);
  return findRuleByKey({ rules, by: input.by });
};
