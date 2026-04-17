import type { HasReadonly, Ref } from 'domain-objects';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { expandZoneRef } from './expandZoneRef';

/**
 * .what = gets all DNS records for a zone from cloudflare
 * .why = enables listing all records for zone management
 */
export const getAllDomainDnsRecords = async (
  input: {
    zone: Ref<typeof DeclaredCloudflareDomainZone>;
  },
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>[]> => {
  const { client } = context.cloudflare;

  // expand zone ref to get both id and name
  const zone = await expandZoneRef(input.zone, context);

  // fetch all records via async iterator
  const records: HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>[] = [];

  for await (const record of client.dns.records.list({ zone_id: zone.id })) {
    records.push(
      castIntoDeclaredCloudflareDomainDnsRecord(record, { name: zone.name }),
    );
  }

  return records;
};
