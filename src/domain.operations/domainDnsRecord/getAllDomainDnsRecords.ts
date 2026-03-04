import type { HasReadonly, Ref } from 'domain-objects';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { resolveZoneRef } from './resolveZoneRef';

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

  // resolve zone id
  const zoneId = await resolveZoneRef(input.zone, context);

  // fetch all records using async iterator
  const records: HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>[] = [];

  for await (const record of client.dns.records.list({ zone_id: zoneId })) {
    records.push(
      castIntoDeclaredCloudflareDomainDnsRecord(record, { id: zoneId }),
    );
  }

  return records;
};
