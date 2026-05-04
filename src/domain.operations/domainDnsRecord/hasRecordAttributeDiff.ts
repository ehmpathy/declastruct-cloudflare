import type { HasReadonly } from 'domain-objects';

import type { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';

/**
 * .what = checks if found item has different id than desired expects
 * .why = pure transformer to detect id mismatches in findsert/upsert operations
 */
export const hasIdMismatch = (input: {
  desired: { id?: string };
  found: { id: string } | null;
}): boolean => {
  if (!input.found) return false;
  if (!input.desired.id) return false;
  return input.found.id !== input.desired.id;
};

/**
 * .what = checks if DNS record has attribute differences (ttl, proxied, priority)
 * .why = pure transformer for findsert conflict detection
 */
export const hasRecordAttributeDiff = (input: {
  desired: DeclaredCloudflareDomainDnsRecord;
  found: HasReadonly<typeof DeclaredCloudflareDomainDnsRecord>;
}): {
  hasDiff: boolean;
  diffs: { ttl: boolean; proxied: boolean; priority: boolean };
} => {
  const ttl = input.desired.ttl !== input.found.ttl;
  const proxied =
    input.desired.proxied !== undefined &&
    input.desired.proxied !== input.found.proxied;
  const priority =
    input.desired.priority !== undefined &&
    input.desired.priority !== input.found.priority;

  return {
    hasDiff: ttl || proxied || priority,
    diffs: { ttl, proxied, priority },
  };
};
