import { NotFoundError } from 'cloudflare/error';
import type { HasReadonly, Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import type { DeclaredCloudflareDomainDnsRecordType } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordType';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
import { expandZoneRef } from '@src/domain.operations/domainZone/expandZoneRef';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { findFirstRecordByContent } from './findFirstRecordByContent';

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
      // allowlist: NotFoundError is expected for lookup by primary key
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }

  // handle get by unique (zone + name + type + content)
  if (input.by.unique) {
    const zone = await expandZoneRef(input.by.unique.zone, context);
    const recordsFromApi = client.dns.records.list({
      zone_id: zone.id,
      name: { exact: input.by.unique.name },
      type: input.by.unique.type,
    });
    const recordFound = await findFirstRecordByContent(
      recordsFromApi,
      input.by.unique.content,
    );
    if (!recordFound) return null;
    return castIntoDeclaredCloudflareDomainDnsRecord(recordFound, {
      name: zone.name,
    });
  }

  // otherwise, unexpected input
  throw new UnexpectedCodePathError('invalid input', { input });
};
