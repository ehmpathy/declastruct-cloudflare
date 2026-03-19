import type { HasReadonly, Ref } from 'domain-objects';
import { isRefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainZone } from './castIntoDeclaredCloudflareDomainZone';

/**
 * .what = gets a domain zone from cloudflare
 * .why = enables declarative zone lookups by primary or unique key
 */
export const getOneDomainZone = async (
  input: {
    by: PickOne<{
      primary: { id: string };
      unique: { name: string };
      ref: Ref<typeof DeclaredCloudflareDomainZone>;
    }>;
  },
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainZone> | null> => {
  const { client, accountId } = context.cloudflare;

  // handle by ref - check if ref contains unique key (name) or primary key (id)
  if (input.by.ref) {
    return isRefByUnique({ of: DeclaredCloudflareDomainZone })(input.by.ref)
      ? getOneDomainZone({ by: { unique: input.by.ref } }, context)
      : getOneDomainZone({ by: { primary: input.by.ref } }, context);
  }

  // handle get by id (primary)
  if (input.by.primary) {
    try {
      const zone = await client.zones.get({ zone_id: input.by.primary.id });
      return castIntoDeclaredCloudflareDomainZone(zone);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('not found')) return null;
      throw error;
    }
  }

  // handle get by name (unique)
  if (input.by.unique) {
    const response = await client.zones.list({
      account: { id: accountId },
      name: input.by.unique.name,
    });
    const zone = response.result?.[0];
    if (!zone) return null;
    return castIntoDeclaredCloudflareDomainZone(zone);
  }

  // otherwise, unexpected input
  throw new UnexpectedCodePathError('invalid input', { input });
};
