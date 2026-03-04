import type { HasReadonly } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type {
  DeclaredCloudflareDomainRegistration,
  DeclaredCloudflareDomainRegistration as DeclaredCloudflareDomainRegistrationInterface,
} from '@src/domain.objects/DeclaredCloudflareDomainRegistration';

import { getOneDomainRegistration } from './getOneDomainRegistration';

/**
 * .what = sets a domain registration in cloudflare (findsert or upsert)
 * .why = enables declarative registration management with idempotent operations
 *
 * .note
 *   - findsert: returns existing if found, does not create (registrations are transfers/purchases)
 *   - upsert: updates settings if found (auto_renew, locked, privacy, contact)
 *   - cannot create registrations via API (must transfer or purchase via dashboard)
 */
export const setDomainRegistration = async (
  input: PickOne<{
    findsert: DeclaredCloudflareDomainRegistrationInterface;
    upsert: DeclaredCloudflareDomainRegistrationInterface;
  }>,
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainRegistration>> => {
  const { client, accountId } = context.cloudflare;

  // determine the registration to set
  const regDesired = input.findsert ?? input.upsert;
  if (!regDesired)
    throw new UnexpectedCodePathError('no registration in input', { input });

  // lookup existing registration by name
  const regFound = await getOneDomainRegistration(
    { by: { unique: { name: regDesired.name } } },
    context,
  );

  // if not found
  if (!regFound) {
    // findsert: registration must exist for findsert to work
    if (input.findsert)
      throw new UnexpectedCodePathError(
        'registration not found for findsert; registrations must be transferred or purchased first',
        { domainName: regDesired.name },
      );

    // upsert: cannot create registrations via API
    if (input.upsert)
      throw new UnexpectedCodePathError(
        'registration not found for upsert; registrations must be transferred or purchased first',
        { domainName: regDesired.name },
      );
  }

  // registration found
  if (regFound) {
    // findsert: return existing
    if (input.findsert) return regFound;

    // upsert: update the registration settings
    if (input.upsert) {
      await client.registrar.domains.update(regDesired.name, {
        account_id: accountId,
        auto_renew: regDesired.autoRenew,
        locked: regDesired.locked,
        privacy: regDesired.privacyProtection,
      });
      // refetch to get updated state
      const updated = await getOneDomainRegistration(
        { by: { unique: { name: regDesired.name } } },
        context,
      );
      if (!updated)
        throw new UnexpectedCodePathError(
          'registration not found after update',
          {
            domainName: regDesired.name,
          },
        );
      return updated;
    }
  }

  // should not reach here
  throw new UnexpectedCodePathError('unexpected code path', { input });
};
