import type { HasReadonly } from 'domain-objects';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainZone } from './castIntoDeclaredCloudflareDomainZone';

/**
 * .what = gets all domain zones from cloudflare account
 * .why = enables listing all zones for account management
 */
export const getAllDomainZones = async (
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainZone>[]> => {
  const { client, accountId } = context.cloudflare;

  // fetch all zones using async iterator
  const zones: HasReadonly<typeof DeclaredCloudflareDomainZone>[] = [];
  for await (const zone of client.zones.list({ account: { id: accountId } })) {
    zones.push(castIntoDeclaredCloudflareDomainZone(zone));
  }

  return zones;
};
