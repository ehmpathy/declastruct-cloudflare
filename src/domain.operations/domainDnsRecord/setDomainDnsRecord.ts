import type { HasReadonly } from 'domain-objects';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type {
  DeclaredCloudflareDomainDnsRecord,
  DeclaredCloudflareDomainDnsRecord as DeclaredCloudflareDomainDnsRecordInterface,
} from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import { expandZoneRef } from '@src/domain.operations/domainZone/expandZoneRef';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { getOneDomainDnsRecord } from './getOneDomainDnsRecord';
import {
  hasIdMismatch,
  hasRecordAttributeDiff,
} from './hasRecordAttributeDiff';

/**
 * .what = validates findsert can proceed when record exists
 * .why = findsert fails if extant record has different attributes
 */
const assertFindsertCompatible = (input: {
  recordDesired: DeclaredCloudflareDomainDnsRecordInterface;
  recordFound: HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>;
}): void => {
  const attrDiff = hasRecordAttributeDiff({
    desired: input.recordDesired,
    found: input.recordFound,
  });
  if (attrDiff.hasDiff)
    BadRequestError.throw(
      'cannot findsert record; record exists with different attributes',
      {
        recordDesired: input.recordDesired,
        recordFound: input.recordFound,
        diffs: attrDiff.diffs,
      },
    );
};

/**
 * .what = sets a DNS record in cloudflare (findsert or upsert)
 * .why = enables declarative DNS record management with idempotent operations
 *
 * .note
 *   - findsert: creates if not exists, returns extant if found
 *   - upsert: creates if not exists, updates if found
 */
export const setDomainDnsRecord = async (
  input: PickOne<{
    findsert: DeclaredCloudflareDomainDnsRecordInterface;
    upsert: DeclaredCloudflareDomainDnsRecordInterface;
  }>,
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>> => {
  const { client } = context.cloudflare;

  // determine the record to set
  const recordDesired = input.findsert ?? input.upsert;
  if (!recordDesired)
    throw new UnexpectedCodePathError('no record in input', { input });

  // expand zone ref to get both id and name
  const zone = await expandZoneRef(recordDesired.zone, context);

  // lookup extant record by unique key (zone + name + type + content)
  const recordFound = await getOneDomainDnsRecord(
    {
      by: {
        unique: {
          zone: { name: zone.name },
          name: recordDesired.name,
          type: recordDesired.type,
          content: recordDesired.content,
        },
      },
    },
    context,
  );

  // sanity check: if record exists and has different id than expected
  if (hasIdMismatch({ desired: recordDesired, found: recordFound }))
    throw new UnexpectedCodePathError(
      'record found with different id than expected',
      { recordFoundId: recordFound?.id, recordExpectedId: recordDesired.id },
    );

  // findsert: validate compatibility, return extant
  if (recordFound && input.findsert) {
    assertFindsertCompatible({ recordDesired, recordFound });
    return recordFound;
  }

  // upsert: update extant record
  if (recordFound && input.upsert) {
    const updated = await client.dns.records.update(recordFound.id, {
      zone_id: zone.id,
      name: recordDesired.name,
      type: recordDesired.type,
      content: recordDesired.content,
      ttl: recordDesired.ttl,
      proxied: recordDesired.proxied,
      comment: recordDesired.comment,
      tags: recordDesired.tags,
      priority: recordDesired.priority,
    });
    return castIntoDeclaredCloudflareDomainDnsRecord(updated, {
      name: zone.name,
    });
  }

  // create new record
  const created = await client.dns.records.create({
    zone_id: zone.id,
    name: recordDesired.name,
    type: recordDesired.type,
    content: recordDesired.content,
    ttl: recordDesired.ttl,
    proxied: recordDesired.proxied,
    comment: recordDesired.comment,
    tags: recordDesired.tags,
    priority: recordDesired.priority,
  });

  return castIntoDeclaredCloudflareDomainDnsRecord(created, {
    name: zone.name,
  });
};
