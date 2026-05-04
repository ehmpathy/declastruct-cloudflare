import { NotFoundError } from 'cloudflare/error';
import type { Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainDnsRecordType } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordType';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
import { expandZoneRef } from '@src/domain.operations/domainZone/expandZoneRef';

import { getOneDomainDnsRecord } from './getOneDomainDnsRecord';

type DeleteInput = {
  by: PickOne<{
    primary: { id: string; zone: Ref<typeof DeclaredCloudflareDomainZone> };
    unique: {
      zone: Ref<typeof DeclaredCloudflareDomainZone>;
      name: string;
      type: DeclaredCloudflareDomainDnsRecordType;
      content: string;
    };
  }>;
};

/**
 * .what = determines record id from primary or unique key input
 * .why = extracts record id determination logic for clarity
 */
const getRecordIdForDeletion = async (
  input: DeleteInput,
  context: ContextCloudflareApi,
): Promise<{ recordId: string } | { alreadyGone: true }> => {
  // direct id from primary key
  if (input.by.primary) return { recordId: input.by.primary.id };

  // lookup by unique key
  if (input.by.unique) {
    const record = await getOneDomainDnsRecord(
      { by: { unique: input.by.unique } },
      context,
    );
    if (!record) return { alreadyGone: true };
    return { recordId: record.id };
  }

  throw new UnexpectedCodePathError('could not determine record id', { input });
};

/**
 * .what = deletes a DNS record from cloudflare
 * .why = enables declarative DNS record removal
 *
 * .note
 *   - idempotent: returns true if deleted or not found
 */
export const delDomainDnsRecord = async (
  input: DeleteInput,
  context: ContextCloudflareApi,
): Promise<{ deleted: boolean }> => {
  const { client } = context.cloudflare;

  // expand zone ref to get id
  const zoneRef = input.by.primary?.zone ?? input.by.unique?.zone;
  if (!zoneRef)
    throw new UnexpectedCodePathError('no zone ref in input', { input });
  const zone = await expandZoneRef(zoneRef, context);

  // determine record id
  const resolution = await getRecordIdForDeletion(input, context);
  if ('alreadyGone' in resolution) return { deleted: true };

  // delete the record
  try {
    await client.dns.records.delete(resolution.recordId, { zone_id: zone.id });
    return { deleted: true };
  } catch (error) {
    // allowlist: NotFoundError is expected for idempotent delete
    if (error instanceof NotFoundError) return { deleted: true };
    throw error;
  }
};
