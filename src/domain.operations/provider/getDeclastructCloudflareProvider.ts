import Cloudflare from 'cloudflare';
import { DeclastructProvider } from 'declastruct';
import { BadRequestError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import { DeclaredCloudflareDomainDnsRecordDao } from '@src/access/daos/DeclaredCloudflareDomainDnsRecordDao';
import { DeclaredCloudflareDomainRegistrationDao } from '@src/access/daos/DeclaredCloudflareDomainRegistrationDao';
import { DeclaredCloudflareDomainZoneDao } from '@src/access/daos/DeclaredCloudflareDomainZoneDao';
import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclastructCloudflareProvider } from '@src/domain.objects/DeclastructCloudflareProvider';

/**
 * .what = creates a declastruct provider for cloudflare resources
 * .why = enables cloudflare resource management via declastruct framework
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - or explicit credentials via input
 */
export const getDeclastructCloudflareProvider = async (
  input: {
    apiToken?: string;
    accountId?: string;
  },
  context: ContextLogTrail,
): Promise<DeclastructCloudflareProvider> => {
  // derive credentials from input or env vars
  const credentials = getCredentials(input);

  // create cloudflare client
  const client = new Cloudflare({ apiToken: credentials.apiToken });

  // build context
  const providerContext: ContextCloudflareApi & ContextLogTrail = {
    ...context,
    cloudflare: {
      client,
      accountId: credentials.accountId,
    },
  };

  // assemble DAOs for all cloudflare resource types
  const daos = {
    DeclaredCloudflareDomainZone: DeclaredCloudflareDomainZoneDao,
    DeclaredCloudflareDomainDnsRecord: DeclaredCloudflareDomainDnsRecordDao,
    DeclaredCloudflareDomainRegistration:
      DeclaredCloudflareDomainRegistrationDao,
  };

  // return provider with all required properties
  return new DeclastructProvider({
    name: 'cloudflare',
    daos,
    context: providerContext,
    hooks: {
      beforeAll: async () => {
        // no setup needed - credentials derived at instantiation
      },
      afterAll: async () => {
        // no teardown needed for cloudflare provider
      },
    },
  });
};

/**
 * .what = derives cloudflare credentials from input or env vars
 * .why = enables flexible credential resolution
 */
export const getCredentials = (input: {
  apiToken?: string;
  accountId?: string;
}): { apiToken: string; accountId: string } => {
  // derive api token
  const apiToken = input.apiToken ?? process.env.CLOUDFLARE_API_TOKEN;
  if (!apiToken)
    BadRequestError.throw(
      'Cloudflare API token not specified. Set CLOUDFLARE_API_TOKEN env var or pass apiToken option.',
    );

  // derive account id
  const accountId = input.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId)
    BadRequestError.throw(
      'Cloudflare account ID not specified. Set CLOUDFLARE_ACCOUNT_ID env var or pass accountId option.',
    );

  return { apiToken, accountId };
};
