import type { HasReadonly } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type {
  DeclaredCloudflareDomainZone,
  DeclaredCloudflareDomainZone as DeclaredCloudflareDomainZoneInterface,
} from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainZone } from './castIntoDeclaredCloudflareDomainZone';
import { getOneDomainZone } from './getOneDomainZone';

/**
 * .what = sets a domain zone in cloudflare (findsert or upsert)
 * .why = enables declarative zone management with idempotent operations
 *
 * .note
 *   - findsert: creates if not exists, returns existing if found
 *   - upsert: creates if not exists, updates if found
 */
export const setDomainZone = async (
  input: PickOne<{
    findsert: DeclaredCloudflareDomainZoneInterface;
    upsert: DeclaredCloudflareDomainZoneInterface;
  }>,
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainZone>> => {
  const { client, accountId } = context.cloudflare;

  // determine the zone to set
  const zoneDesired = input.findsert ?? input.upsert;
  if (!zoneDesired)
    throw new UnexpectedCodePathError('no zone in input', { input });

  // lookup existing zone by name
  const zoneFound = await getOneDomainZone(
    { by: { unique: { name: zoneDesired.name } } },
    context,
  );

  // sanity check: if zone exists and has different id than expected
  if (zoneFound && zoneDesired.id && zoneFound.id !== zoneDesired.id)
    throw new UnexpectedCodePathError(
      'zone found with different id than expected',
      { zoneFoundId: zoneFound.id, zoneExpectedId: zoneDesired.id },
    );

  // if zone found
  if (zoneFound) {
    // findsert: return existing
    if (input.findsert) return zoneFound;

    // upsert: update the zone
    if (input.upsert) {
      const updated = await client.zones.edit({
        zone_id: zoneFound.id,
        paused: zoneDesired.paused,
        type: zoneDesired.type,
      });
      return castIntoDeclaredCloudflareDomainZone(updated);
    }
  }

  // create new zone
  const created = await client.zones.create({
    account: { id: accountId },
    name: zoneDesired.name,
    type: zoneDesired.type,
  });

  return castIntoDeclaredCloudflareDomainZone(created);
};
