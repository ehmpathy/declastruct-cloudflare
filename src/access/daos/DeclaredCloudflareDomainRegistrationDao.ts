import { genDeclastructDao } from 'declastruct';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import { DeclaredCloudflareDomainRegistration } from '@src/domain.objects/DeclaredCloudflareDomainRegistration';
import { getOneDomainRegistration } from '@src/domain.operations/domainRegistration/getOneDomainRegistration';
import { setDomainRegistration } from '@src/domain.operations/domainRegistration/setDomainRegistration';

/**
 * .what = declastruct DAO for Cloudflare Domain Registration
 * .why = wraps registration operations to conform to declastruct interface
 *
 * .note
 *   - registrations cannot be created via API (must transfer/purchase via dashboard)
 *   - delete is not supported (domains must be transferred out)
 */
export const DeclaredCloudflareDomainRegistrationDao = genDeclastructDao<
  typeof DeclaredCloudflareDomainRegistration,
  ContextCloudflareApi & ContextLogTrail
>({
  dobj: DeclaredCloudflareDomainRegistration,
  get: {
    one: {
      byPrimary: async (input, context) => {
        return getOneDomainRegistration({ by: { primary: input } }, context);
      },
      byUnique: async (input, context) => {
        return getOneDomainRegistration({ by: { unique: input } }, context);
      },
    },
  },
  set: {
    findsert: async (input, context) => {
      return setDomainRegistration({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setDomainRegistration({ upsert: input }, context);
    },
    delete: null, // domains cannot be deleted, only transferred out
  },
});
