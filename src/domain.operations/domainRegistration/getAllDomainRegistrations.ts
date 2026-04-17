import type { HasReadonly } from 'domain-objects';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainRegistration } from '@src/domain.objects/DeclaredCloudflareDomainRegistration';

import { castIntoDeclaredCloudflareDomainRegistration } from './castIntoDeclaredCloudflareDomainRegistration';

/**
 * .what = gets all domain registrations from cloudflare account
 * .why = enables listing all registered domains for account management
 *
 * .note
 *   - SDK Domain type doesn't include domain name; it's the id field
 */
export const getAllDomainRegistrations = async (
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainRegistration>[]> => {
  const { client, accountId } = context.cloudflare;

  // fetch all domains using async iterator
  const domains: HasReadonly<typeof DeclaredCloudflareDomainRegistration>[] =
    [];

  for await (const d of client.registrar.domains.list({
    account_id: accountId,
  })) {
    // domain id is used as the domain name
    const domainName = d.id ?? '';
    domains.push(
      castIntoDeclaredCloudflareDomainRegistration(d, domainName, {
        name: domainName,
      }),
    );
  }

  return domains;
};
