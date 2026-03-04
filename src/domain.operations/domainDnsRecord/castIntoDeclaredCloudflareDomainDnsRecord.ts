import { type HasReadonly, hasReadonly } from 'domain-objects';
import { assure, isPresent } from 'type-fns';

import { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import type { DeclaredCloudflareDomainDnsRecordType } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecordType';

/**
 * .what = SDK record shape with common properties across all record types
 * .why = cloudflare SDK uses union types; we need a generic shape to work with
 */
interface CloudflareDnsRecordShape {
  id?: string;
  name?: string;
  type?: string;
  content?: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  tags?: string[];
  priority?: number;
  settings?: { ipv4_only?: boolean; ipv6_only?: boolean };
  created_on?: string;
  modified_on?: string;
  proxiable?: boolean;
}

/**
 * .what = transforms cloudflare SDK Record to DeclaredCloudflareDomainDnsRecord
 * .why = ensures type safety and readonly field enforcement
 *
 * .note
 *   - accepts unknown to handle SDK's union types (RecordResponse)
 *   - casts internally to the shape we expect
 */
export const castIntoDeclaredCloudflareDomainDnsRecord = (
  rawInput: unknown,
  zoneRef: { id: string } | { name: string },
): HasReadonly<typeof DeclaredCloudflareDomainDnsRecord> => {
  const input = rawInput as CloudflareDnsRecordShape;
  return assure(
    DeclaredCloudflareDomainDnsRecord.as({
      id: assure(input.id, isPresent),
      zone: zoneRef,
      name: assure(input.name, isPresent),
      type: assure(
        input.type,
        isPresent,
      ) as DeclaredCloudflareDomainDnsRecordType,
      content: input.content ?? '',
      ttl: input.ttl ?? 1,
      proxied: input.proxied,
      comment: input.comment ?? undefined,
      tags: input.tags,
      priority: input.priority,
      settings: input.settings
        ? {
            ipv4Only: (input.settings as { ipv4_only?: boolean }).ipv4_only,
            ipv6Only: (input.settings as { ipv6_only?: boolean }).ipv6_only,
          }
        : undefined,
      createdOn: input.created_on,
      modifiedOn: input.modified_on,
      proxiable: input.proxiable,
    }),
    hasReadonly({ of: DeclaredCloudflareDomainDnsRecord }),
  );
};
