import type { HasReadonly } from 'domain-objects';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type {
  DeclaredCloudflareDomainRegistration,
  DeclaredCloudflareDomainRegistration as DeclaredCloudflareDomainRegistrationInterface,
} from '@src/domain.objects/DeclaredCloudflareDomainRegistration';
import { HumanGuidanceError } from '@src/domain.objects/HumanGuidanceError';
import { getOneDomainWhoisRecord } from '@src/domain.operations/domainWhoisRecord/getOneDomainWhoisRecord';
import { getOneDomainZone } from '@src/domain.operations/domainZone/getOneDomainZone';

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

  // if not found, check zone status first, then use WHOIS for transfer vs purchase guidance
  if (!regFound) {
    // lookup zone to check activation status
    const zone = await getOneDomainZone(
      { by: { unique: { name: regDesired.name } } },
      context,
    );

    // zone not active -> nameserver update guidance
    if (zone && zone.status !== 'active') {
      const nameservers = zone.nameServers ?? [];
      HumanGuidanceError.throw(
        `domain "${regDesired.name}" zone awaits nameserver delegation

⚠️ nameserver update required
   │
   ├─ current status: ${zone.status}
   │
   ├─ at source registrar
   │  └─ update nameservers to:
${nameservers.map((ns) => `   │     ├─ ${ns}`).join('\n')}
   │
   └─ then
      ├─ wait for propagation (up to 24-48h)
      └─ re-run declastruct apply`,
        {
          domain: regDesired.name,
          zoneStatus: zone.status,
          nameservers,
          accountId,
        },
      );
    }

    const whoisRecord = await getOneDomainWhoisRecord(
      { domain: regDesired.name },
      context,
    );

    // domain is registered elsewhere -> check 60-day lock, then transfer guidance
    if (whoisRecord?.found && whoisRecord.registrar) {
      // check 60-day ICANN lock
      const createdDate = whoisRecord.createdDate
        ? new Date(whoisRecord.createdDate)
        : null;
      const daysSinceCreation = createdDate
        ? Math.floor(
            (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

      if (daysSinceCreation !== null && daysSinceCreation < 60) {
        const daysLeft = 60 - daysSinceCreation;
        const registrarDisplay =
          whoisRecord.registrarName ?? whoisRecord.registrar;
        HumanGuidanceError.throw(
          `domain "${regDesired.name}" cannot be transferred yet

⚠️ 60-day lock active (ICANN requirement)
   │
   ├─ current registrar: ${registrarDisplay}
   ├─ registered: ${daysSinceCreation} days ago
   ├─ transferable in: ${daysLeft} days
   │
   └─ re-run declastruct apply after ${daysLeft} days`,
          {
            domain: regDesired.name,
            registrar: whoisRecord.registrar,
            registrarName: whoisRecord.registrarName,
            createdDate: whoisRecord.createdDate,
            daysSinceCreation,
            daysLeft,
            accountId,
          },
        );
      }

      // 60-day lock passed -> transfer guidance
      const registrarDisplay =
        whoisRecord.registrarName ?? whoisRecord.registrar;
      HumanGuidanceError.throw(
        `domain "${regDesired.name}" not found in cloudflare registrar

⚠️ transfer required
   │
   ├─ at ${registrarDisplay} (current registrar)
   │  └─ steps
   │     ├─ 1. disable dnssec
   │     ├─ 2. disable whois privacy
   │     ├─ 3. unlock domain
   │     └─ 4. get auth code
   │
   ├─ at cloudflare
   │  └─ steps
   │     ├─ 5. enter domain + auth code at https://dash.cloudflare.com/${accountId}/domains/transfers
   │     ├─ 6. confirm contact
   │     └─ 7. complete transfer
   │
   └─ post-initiation
      ├─ 8. approve FOA email
      ├─ 9. wait up to 5 days
      └─ 10. re-run declastruct apply`,
        {
          domain: regDesired.name,
          registrar: whoisRecord.registrar,
          registrarName: whoisRecord.registrarName,
          accountId,
        },
      );
    }

    // domain is not registered -> purchase guidance
    HumanGuidanceError.throw(
      `domain "${regDesired.name}" not found in cloudflare registrar

⚠️ purchase required
   │
   ├─ domain is available for registration
   │
   └─ at cloudflare
      └─ steps
         ├─ 1. search for "${regDesired.name}" at https://dash.cloudflare.com/${accountId}/domains/register
         ├─ 2. add to cart
         ├─ 3. complete purchase
         └─ 4. re-run declastruct apply`,
      {
        domain: regDesired.name,
        accountId,
      },
    );
  }

  // registration found
  if (regFound) {
    // findsert: check for attribute diff, then return extant
    if (input.findsert) {
      const hasAutoRenewDiff =
        regDesired.autoRenew !== undefined &&
        regDesired.autoRenew !== regFound.autoRenew;
      const hasLockedDiff =
        regDesired.locked !== undefined &&
        regDesired.locked !== regFound.locked;
      const hasPrivacyDiff =
        regDesired.privacyProtection !== undefined &&
        regDesired.privacyProtection !== regFound.privacyProtection;

      if (hasAutoRenewDiff || hasLockedDiff || hasPrivacyDiff)
        BadRequestError.throw(
          'cannot findsert registration; registration exists with different attributes',
          {
            regDesired,
            regFound,
            diffs: {
              autoRenew: hasAutoRenewDiff,
              locked: hasLockedDiff,
              privacyProtection: hasPrivacyDiff,
            },
          },
        );

      return regFound;
    }

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
