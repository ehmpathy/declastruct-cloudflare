import type { HasReadonly, Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import type { DeclaredCloudflareDomainDnsRecordType } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordType';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { resolveZoneRef } from './resolveZoneRef';

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
      };
    }>;
  },
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainDnsRecord> | null> => {
  const { client } = context.cloudflare;

  // handle get by id (primary)
  if (input.by.primary) {
    const zoneId = await resolveZoneRef(input.by.primary.zone, context);
    try {
      const record = await client.dns.records.get(input.by.primary.id, {
        zone_id: zoneId,
      });
      return castIntoDeclaredCloudflareDomainDnsRecord(record, { id: zoneId });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message.includes('not found')) return null;
      throw error;
    }
  }

  // handle get by unique (zone + name + type)
  if (input.by.unique) {
    const zoneId = await resolveZoneRef(input.by.unique.zone, context);
    const records: HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>[] = [];
    for await (const r of client.dns.records.list({
      zone_id: zoneId,
      name: { exact: input.by.unique.name },
      type: input.by.unique.type,
    })) {
      records.push(
        castIntoDeclaredCloudflareDomainDnsRecord(r, { id: zoneId }),
      );
    }
    return records[0] ?? null;
  }

  // otherwise, unexpected input
  throw new UnexpectedCodePathError('invalid input', { input });
};
