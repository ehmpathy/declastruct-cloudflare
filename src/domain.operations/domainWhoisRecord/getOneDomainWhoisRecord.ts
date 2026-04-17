import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';
import type { DeclaredCloudflareDomainWhoisRecord } from '@src/domain.objects/DeclaredCloudflareDomainWhoisRecord';

import { castIntoDeclaredCloudflareDomainWhoisRecord } from './castIntoDeclaredCloudflareDomainWhoisRecord';

/**
 * .what = gets WHOIS record for a domain from cloudflare intel API
 * .why = enables detection of whether domain is registered elsewhere (for transfer guidance)
 *
 * .note
 *   - returns null if WHOIS lookup fails (e.g., unsupported TLD)
 *   - result.found = false indicates domain may be available for purchase
 *   - result.found = true with registrar indicates transfer is needed
 */
export const getOneDomainWhoisRecord = async (
  input: { domain: string },
  context: ContextCloudflareApi,
): Promise<DeclaredCloudflareDomainWhoisRecord | null> => {
  const { client, accountId } = context.cloudflare;

  try {
    const whois = await client.intel.whois.get({
      account_id: accountId,
      domain: input.domain,
    });

    return castIntoDeclaredCloudflareDomainWhoisRecord(whois);
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    // return null for unsupported TLDs or lookup failures
    if (
      error.message.includes('not found') ||
      error.message.includes('unsupported')
    )
      return null;

    throw error;
  }
};
