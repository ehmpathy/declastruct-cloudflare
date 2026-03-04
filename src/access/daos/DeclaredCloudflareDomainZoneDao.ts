import { genDeclastructDao } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';
import { delDomainZone } from '@src/domain.operations/domainZone/delDomainZone';
import { getOneDomainZone } from '@src/domain.operations/domainZone/getOneDomainZone';
import { setDomainZone } from '@src/domain.operations/domainZone/setDomainZone';

/**
 * .what = declastruct DAO for Cloudflare Domain Zone
 * .why = wraps zone operations to conform to declastruct interface
 */
export const DeclaredCloudflareDomainZoneDao = genDeclastructDao<
  typeof DeclaredCloudflareDomainZone,
  ContextCloudflareApi & ContextLogTrail
>({
  dobj: DeclaredCloudflareDomainZone,
  get: {
    one: {
      byPrimary: async (input, context) => {
        return getOneDomainZone({ by: { primary: input } }, context);
      },
      byUnique: async (input, context) => {
        return getOneDomainZone({ by: { unique: input } }, context);
      },
    },
  },
  set: {
    findsert: async (input, context) => {
      return setDomainZone({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setDomainZone({ upsert: input }, context);
    },
    delete: async (input, context) => {
      await delDomainZone({ by: { ref: input } }, context);
    },
  },
});
