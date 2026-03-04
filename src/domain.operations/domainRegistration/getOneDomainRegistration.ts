import type { HasReadonly, Ref } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainRegistration } from '@src/domain.objects/DeclaredCloudflareDomainRegistration';
import type { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainRegistration } from './castIntoDeclaredCloudflareDomainRegistration';

/**
 * .what = gets a domain registration from cloudflare registrar
 * .why = enables declarative registration lookups by primary or unique key
 *
 * .note
 *   - domain name serves as both primary (id) and unique key
 */
export const getOneDomainRegistration = async (
  input: {
    by: PickOne<{
      primary: { id: string };
      unique: { name: string };
    }>;
    zone?: Ref<typeof DeclaredCloudflareDomainZone>;
  },
  context: ContextCloudflareApi,
): Promise<HasReadonly<typeof DeclaredCloudflareDomainRegistration> | null> => {
  const { client, accountId } = context.cloudflare;

  // resolve domain name
  const domainName = input.by.primary?.id ?? input.by.unique?.name;
  if (!domainName)
    throw new UnexpectedCodePathError('no domain name in input', { input });

  // determine zone ref
  const zoneRef = input.zone ?? { name: domainName };

  // get the domain registration
  try {
    const domain = await client.registrar.domains.get(domainName, {
      account_id: accountId,
    });

    // return null if domain not found or not registered
    if (!domain) return null;

    // cloudflare returns partial data for non-registered domains; check for required readonly fields
    const hasDomainData = (domain as { expires_at?: string }).expires_at;
    if (!hasDomainData) return null;

    return castIntoDeclaredCloudflareDomainRegistration(
      domain,
      domainName,
      zoneRef,
    );
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    if (error.message.includes('not found')) return null;
    throw error;
  }
};
