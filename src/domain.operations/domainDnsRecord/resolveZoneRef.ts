import type { Ref } from 'domain-objects';
import { BadRequestError } from 'helpful-errors';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
import { getOneDomainZone } from '@src/domain.operations/domainZone/getOneDomainZone';

/**
 * .what = resolves a zone reference to a zone id
 * .why = enables DNS operations to work with zone refs by name or id
 */
export const resolveZoneRef = async (
  zoneRef: Ref<typeof DeclaredCloudflareDomainZone>,
  context: ContextCloudflareApi,
): Promise<string> => {
  // if already have id, return it
  if ('id' in zoneRef && zoneRef.id) return zoneRef.id;

  // lookup by name
  if ('name' in zoneRef && zoneRef.name) {
    const zone = await getOneDomainZone(
      { by: { unique: { name: zoneRef.name } } },
      context,
    );
    if (!zone) BadRequestError.throw('zone not found for ref', { zoneRef });
    return zone.id;
  }

  // invalid ref
  BadRequestError.throw('invalid zone ref', { zoneRef });
};
