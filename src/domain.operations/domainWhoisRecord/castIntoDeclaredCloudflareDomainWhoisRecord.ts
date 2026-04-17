import type { WhoisGetResponse } from 'cloudflare/resources/intel/whois';

import { DeclaredCloudflareDomainWhoisRecord } from '@src/domain.objects/DeclaredCloudflareDomainWhoisRecord';

/**
 * .what = transforms cloudflare SDK WhoisGetResponse to DeclaredCloudflareDomainWhoisRecord
 * .why = provides consistent domain object interface for WHOIS data
 */
export const castIntoDeclaredCloudflareDomainWhoisRecord = (
  input: WhoisGetResponse,
): DeclaredCloudflareDomainWhoisRecord => {
  return new DeclaredCloudflareDomainWhoisRecord({
    domain: input.domain,
    found: input.found,
    registrar: input.found ? input.registrar : null,
    registrarName: input.registrar_name ?? null,
    createdDate: input.created_date ?? null,
    expirationDate: input.expiration_date ?? null,
    nameservers: input.nameservers ?? [],
  });
};
