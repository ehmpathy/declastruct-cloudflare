import { genDeclastructDao } from 'declastruct';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import { DeclaredCloudflareDomainRuleRedirect } from '@src/domain.objects/DeclaredCloudflareDomainRuleRedirect';
import { delDomainRuleRedirect } from '@src/domain.operations/domainRuleRedirect/delDomainRuleRedirect';
import { getOneDomainRuleRedirect } from '@src/domain.operations/domainRuleRedirect/getOneDomainRuleRedirect';
import { setDomainRuleRedirect } from '@src/domain.operations/domainRuleRedirect/setDomainRuleRedirect';

/**
 * .what = declastruct DAO for Cloudflare Domain Redirect Rule
 * .why = wraps redirect rule operations to conform to declastruct interface
 *
 * .note
 *   - unique key is composite: [zone, slug]
 *   - operates on http_request_dynamic_redirect ruleset phase
 */
export const DeclaredCloudflareDomainRuleRedirectDao = genDeclastructDao<
  typeof DeclaredCloudflareDomainRuleRedirect,
  ContextCloudflareApi & ContextLogTrail
>({
  dobj: DeclaredCloudflareDomainRuleRedirect,
  get: {
    one: {
      byPrimary: null, // primary lookup requires zone context not in ref
      byUnique: async (input, context) => {
        return getOneDomainRuleRedirect({ by: { unique: input } }, context);
      },
    },
  },
  set: {
    findsert: async (input, context) => {
      return setDomainRuleRedirect({ findsert: input }, context);
    },
    upsert: async (input, context) => {
      return setDomainRuleRedirect({ upsert: input }, context);
    },
    delete: async (input, context) => {
      // extract zone from the ref
      const zone = 'zone' in input ? input.zone : undefined;
      if (!zone)
        throw new UnexpectedCodePathError(
          'redirect rule delete requires zone in ref',
          { input },
        );

      // prefer primary key if available
      if ('id' in input && typeof input.id === 'string') {
        await delDomainRuleRedirect(
          { zone, by: { primary: { id: input.id } } },
          context,
        );
        return;
      }

      // fall back to unique key
      if ('slug' in input && typeof input.slug === 'string') {
        await delDomainRuleRedirect(
          { zone, by: { unique: { slug: input.slug } } },
          context,
        );
        return;
      }

      throw new UnexpectedCodePathError(
        'redirect rule delete requires id or slug in ref',
        { input },
      );
    },
  },
});
