import type { HasReadonly } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainRegistration } from '@src/domain.objects/DeclaredCloudflareDomainRegistration';

import { castIntoDeclaredCloudflareDomainRegistration } from './castIntoDeclaredCloudflareDomainRegistration';

/**
 * .what = gets all domain registrations from cloudflare account
 * .why = enables list of all domains for account management
 */
export const getAllDomainRegistrations = async (
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainRegistration>[]> => {
  const { client, accountId } = context.cloudflare;

  // fetch all domains via async iterator
  const domains: HasReadonly<typeof DeclaredCloudflareDomainRegistration>[] =
    [];

  for await (const d of client.registrar.domains.list({
    account_id: accountId,
  })) {
    // .note = sdk types Domain without `name`, but api returns it
    const domain = d as typeof d & { name?: string };

    // fail fast if domain name absent
    if (!domain.name)
      throw new UnexpectedCodePathError(
        'cloudflare registrar.domains.list returned domain without name',
        { domain },
      );

    const domainName = domain.name;
    domains.push(
      castIntoDeclaredCloudflareDomainRegistration(d, domainName, {
        name: domainName,
      }),
    );
  }

  return domains;
};
