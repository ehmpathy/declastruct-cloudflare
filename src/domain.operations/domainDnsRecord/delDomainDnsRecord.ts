import type { Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecordType } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordType';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { expandZoneRef } from './expandZoneRef';
import { getOneDomainDnsRecord } from './getOneDomainDnsRecord';

/**
 * .what = deletes a DNS record from cloudflare
 * .why = enables declarative DNS record removal
 *
 * .note
 *   - idempotent: returns true if deleted or not found
 */
export const delDomainDnsRecord = async (
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
): Promise<{ deleted: boolean }> => {
  const { client } = context.cloudflare;

  // expand zone ref to get id
  const zoneRef = input.by.primary?.zone ?? input.by.unique?.zone;
  if (!zoneRef)
    throw new UnexpectedCodePathError('no zone ref in input', { input });
  const zone = await expandZoneRef(zoneRef, context);

  // determine record id
  let recordId: string | null = null;

  if (input.by.primary) {
    recordId = input.by.primary.id;
  }

  if (input.by.unique) {
    const record = await getOneDomainDnsRecord(
      { by: { unique: input.by.unique } },
      context,
    );
    if (!record) return { deleted: true }; // already gone
    recordId = record.id;
  }

  if (!recordId)
    throw new UnexpectedCodePathError('could not determine record id', {
      input,
    });

  // delete the record
  try {
    await client.dns.records.delete(recordId, { zone_id: zone.id });
    return { deleted: true };
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    if (error.message.includes('not found')) return { deleted: true };
    throw error;
  }
};
