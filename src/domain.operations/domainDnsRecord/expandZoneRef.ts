import type { Ref } from 'domain-objects';
import { BadRequestError } from 'helpful-errors';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
import { getOneDomainZone } from '@src/domain.operations/domainZone/getOneDomainZone';

/**
 * .what = expands a zone reference to both id and name
 * .why = enables DNS operations to work with zone refs and produce RefByUnique outputs
 */
export const expandZoneRef = async (
  zoneRef: Ref<typeof DeclaredCloudflareDomainZone>,
  context: ContextCloudflareApi,
): Promise<{ id: string; name: string }> => {
  // if have id, lookup zone to get name
  if ('id' in zoneRef && zoneRef.id) {
    const zone = await getOneDomainZone(
      { by: { primary: { id: zoneRef.id } } },
      context,
    );
    if (!zone) BadRequestError.throw('zone not found for ref', { zoneRef });
    return { id: zone.id, name: zone.name };
  }

  // if have name, lookup zone to get id
  if ('name' in zoneRef && zoneRef.name) {
    const zone = await getOneDomainZone(
      { by: { unique: { name: zoneRef.name } } },
      context,
    );
    if (!zone) BadRequestError.throw('zone not found for ref', { zoneRef });
    return { id: zone.id, name: zone.name };
  }

  // invalid ref
  BadRequestError.throw('invalid zone ref', { zoneRef });
};
