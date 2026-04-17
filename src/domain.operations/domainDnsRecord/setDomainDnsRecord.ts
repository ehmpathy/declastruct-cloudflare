import type { HasReadonly } from 'domain-objects';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type {
  DeclaredCloudflareDomainDnsRecord,
  DeclaredCloudflareDomainDnsRecord as DeclaredCloudflareDomainDnsRecordInterface,
} from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { expandZoneRef } from './expandZoneRef';
import { getOneDomainDnsRecord } from './getOneDomainDnsRecord';

/**
 * .what = sets a DNS record in cloudflare (findsert or upsert)
 * .why = enables declarative DNS record management with idempotent operations
 *
 * .note
 *   - findsert: creates if not exists, returns existing if found
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
  if (recordFound && recordDesired.id && recordFound.id !== recordDesired.id)
    throw new UnexpectedCodePathError(
      'record found with different id than expected',
      { recordFoundId: recordFound.id, recordExpectedId: recordDesired.id },
    );

  // if record found
  if (recordFound) {
    // findsert: check for attribute diff (content is part of unique key, so not checked here), then return extant
    if (input.findsert) {
      const hasTtlDiff = recordDesired.ttl !== recordFound.ttl;
      const hasProxiedDiff =
        recordDesired.proxied !== undefined &&
        recordDesired.proxied !== recordFound.proxied;
      const hasPriorityDiff =
        recordDesired.priority !== undefined &&
        recordDesired.priority !== recordFound.priority;

      if (hasTtlDiff || hasProxiedDiff || hasPriorityDiff)
        BadRequestError.throw(
          'cannot findsert record; record exists with different attributes',
          {
            recordDesired,
            recordFound,
            diffs: {
              ttl: hasTtlDiff,
              proxied: hasProxiedDiff,
              priority: hasPriorityDiff,
            },
          },
        );

      return recordFound;
    }

    // upsert: update the record
    if (input.upsert) {
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
