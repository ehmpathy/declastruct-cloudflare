import type Cloudflare from 'cloudflare';

/**
 * .what = check if a domain is eligible for transfer
 * .why = filter out ineligible domains before resource declaration
 */
export const getDomainTransferEligibility = async (
  input: { domain: string },
  context: { client: Cloudflare; accountId: string },
): Promise<{
  eligible: boolean;
  reason: string | null;
  daysLeft: number | null;
  registrar: string | null;
}> => {
  // lookup WHOIS
  const whois = await context.client.intel.whois.get({
    account_id: context.accountId,
    domain: input.domain,
  });

  // not registered -> eligible (will show purchase guidance)
  if (!whois.found || !whois.registrar) {
    return {
      eligible: true,
      reason: null,
      daysLeft: null,
      registrar: null,
    };
  }

  // check 60-day lock
  const createdDate = whois.created_date ? new Date(whois.created_date) : null;
  if (createdDate) {
    const daysSinceCreation = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceCreation < 60) {
      const daysLeft = 60 - daysSinceCreation;
      return {
        eligible: false,
        reason: '60-day lock',
        daysLeft,
        registrar: (whois.registrar_name ?? whois.registrar) as string,
      };
    }
  }

  // eligible for transfer
  return {
    eligible: true,
    reason: null,
    daysLeft: null,
    registrar: (whois.registrar_name ?? whois.registrar) as string,
  };
};
