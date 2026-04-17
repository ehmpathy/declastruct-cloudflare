import type { Ref } from 'domain-objects';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { getOneDomainZone } from './getOneDomainZone';

/**
 * .what = deletes a domain zone from cloudflare
 * .why = enables declarative zone removal
 *
 * .note
 *   - idempotent: returns true if deleted or not found
 *   - fails if zone cannot be deleted (e.g., has active subscriptions)
 */
export const delDomainZone = async (
  input: {
    by: PickOne<{
      primary: { id: string };
      unique: { name: string };
      ref: Ref<typeof DeclaredCloudflareDomainZone>;
    }>;
  },
  context: ContextCloudflareApi,
): Promise<{ deleted: boolean }> => {
  const { client } = context.cloudflare;

  // handle by ref - check if ref contains unique key (name) or primary key (id)
  if (input.by.ref) {
    return isRefByUnique({ of: DeclaredCloudflareDomainZone })(input.by.ref)
      ? delDomainZone({ by: { unique: input.by.ref } }, context)
      : delDomainZone({ by: { primary: input.by.ref } }, context);
  }

  // determine zone id
  let zoneId: string | null = null;

  if (input.by.primary) {
    zoneId = input.by.primary.id;
  }

  if (input.by.unique) {
    const zone = await getOneDomainZone(
      { by: { unique: input.by.unique } },
      context,
    );
    if (!zone) return { deleted: true }; // already gone
    zoneId = zone.id;
  }

  if (!zoneId)
    throw new UnexpectedCodePathError('could not determine zone id', { input });

  // delete the zone
  try {
    await client.zones.delete({ zone_id: zoneId });
    return { deleted: true };
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    if (error.message.includes('not found')) return { deleted: true };
    throw error;
  }
};
