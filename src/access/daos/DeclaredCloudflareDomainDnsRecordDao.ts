import { genDeclastructDao } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import { DeclaredCloudflareDomainDnsRecord } from '@src/domain.objects/DeclaredCloudflareDomainDnsRecord';
import { delDomainDnsRecord } from '@src/domain.operations/domainDnsRecord/delDomainDnsRecord';
import { getOneDomainDnsRecord } from '@src/domain.operations/domainDnsRecord/getOneDomainDnsRecord';
import { setDomainDnsRecord } from '@src/domain.operations/domainDnsRecord/setDomainDnsRecord';

/**
 * .what = declastruct DAO for Cloudflare Domain DNS Record
 * .why = wraps DNS record operations to conform to declastruct interface
 *
 * .note
 *   - primary key lookup requires zone ref
 *   - unique key is composite: [zone, name, type]
 */
export const DeclaredCloudflareDomainDnsRecordDao = genDeclastructDao<
  typeof DeclaredCloudflareDomainDnsRecord,
  ContextCloudflareApi & ContextLogTrail
>({
  dobj: DeclaredCloudflareDomainDnsRecord,
  get: {
    one: {
      byPrimary: null, // primary lookup requires zone context not in ref
      byUnique: async (input, context) => {
        return getOneDomainDnsRecord({ by: { unique: input } }, context);
      },
    },
  },
  set: {
    findsert: async (input, context) => {
      return setDomainDnsRecord({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setDomainDnsRecord({ upsert: input }, context);
    },
    delete: async (input, context) => {
      // extract zone from the ref
      const zone = 'zone' in input ? input.zone : undefined;
      if (!zone || !('id' in input))
        throw new Error('DNS record delete requires zone and id in ref');
      await delDomainDnsRecord(
        { by: { primary: { id: input.id as string, zone } } },
        context,
      );
    },
  },
});
