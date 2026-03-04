import type { HasReadonly } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type {
  DeclaredCloudflareDomainDnsRecord,
  DeclaredCloudflareDomainDnsRecord as DeclaredCloudflareDomainDnsRecordInterface,
} from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';

import { castIntoDeclaredCloudflareDomainDnsRecord } from './castIntoDeclaredCloudflareDomainDnsRecord';
import { getOneDomainDnsRecord } from './getOneDomainDnsRecord';
import { resolveZoneRef } from './resolveZoneRef';

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

  // resolve zone id
  const zoneId = await resolveZoneRef(recordDesired.zone, context);

  // lookup existing record by unique key
  const recordFound = await getOneDomainDnsRecord(
    {
      by: {
        unique: {
          zone: { id: zoneId },
          name: recordDesired.name,
          type: recordDesired.type,
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
    // findsert: return existing
    if (input.findsert) return recordFound;

    // upsert: update the record
    if (input.upsert) {
      const updated = await client.dns.records.update(recordFound.id, {
        zone_id: zoneId,
        name: recordDesired.name,
        type: recordDesired.type,
        content: recordDesired.content,
        ttl: recordDesired.ttl,
        proxied: recordDesired.proxied,
        comment: recordDesired.comment,
        tags: recordDesired.tags,
        priority: recordDesired.priority,
      });
      return castIntoDeclaredCloudflareDomainDnsRecord(updated, { id: zoneId });
    }
  }

  // create new record
  const created = await client.dns.records.create({
    zone_id: zoneId,
    name: recordDesired.name,
    type: recordDesired.type,
    content: recordDesired.content,
    ttl: recordDesired.ttl,
    proxied: recordDesired.proxied,
    comment: recordDesired.comment,
    tags: recordDesired.tags,
    priority: recordDesired.priority,
  });

  return castIntoDeclaredCloudflareDomainDnsRecord(created, { id: zoneId });
};
