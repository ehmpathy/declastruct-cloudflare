import type { HasReadonly, Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import type { DeclaredCloudflareDomainDnsRecordType } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordType';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { expandZoneRef } from './expandZoneRef';

/**
 * .what = gets a DNS record from cloudflare
 * .why = enables declarative DNS record lookups by primary or unique key
 */
export const getOneDomainDnsRecord = async (
  input: {
    by: PickOne<{
      primary: { id: string; zone: Ref<typeof DeclaredCloudflareDomainZone> };
      unique: {
        zone: Ref<typeof DeclaredCloudflareDomainZone>;
        name: string;
        type: DeclaredCloudflareDomainDnsRecordType;
        content: string;
      };
    }>;
  },
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainDnsRecord> | null> => {
  const { client } = context.cloudflare;

  // handle get by id (primary)
  if (input.by.primary) {
    const zone = await expandZoneRef(input.by.primary.zone, context);
    try {
      const record = await client.dns.records.get(input.by.primary.id, {
        zone_id: zone.id,
      });
      return castIntoDeclaredCloudflareDomainDnsRecord(record, {
        name: zone.name,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('not found')) return null;
      throw error;
    }
  }

  // handle get by unique (zone + name + type + content)
  if (input.by.unique) {
    const zone = await expandZoneRef(input.by.unique.zone, context);
    for await (const r of client.dns.records.list({
      zone_id: zone.id,
      name: { exact: input.by.unique.name },
      type: input.by.unique.type,
    })) {
      // filter by content to complete unique key match
      if (r.content === input.by.unique.content) {
        return castIntoDeclaredCloudflareDomainDnsRecord(r, {
          name: zone.name,
        });
      }
    }
    return null;
  }

  // otherwise, unexpected input
  throw new UnexpectedCodePathError('invalid input', { input });
};
