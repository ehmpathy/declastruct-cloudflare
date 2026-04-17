import { DomainLiteral } from 'domain-objects';

/**
 * .what = a WHOIS lookup result for a domain
 * .why = enables detection of transfer vs purchase guidance
 *
 * .note
 *   - this is a lookup result, not a managed resource
 *   - used internally by setDomainRegistration for guidance
 */
export interface DeclaredCloudflareDomainWhoisRecord {
  /**
   * .what = the domain name that was looked up
   */
  domain: string;

  /**
   * .what = whether WHOIS found registration data
   * .note = false means domain may be available for purchase
   */
  found: boolean;

  /**
   * .what = the current registrar (raw WHOIS value)
   * .note = null if domain is not registered
   */
  registrar: string | null;

  /**
   * .what = the registrar display name (if available)
   * .note = null if domain is not registered or name unavailable
   */
  registrarName: string | null;

  /**
   * .what = when the domain was created
   * .note = null if not available
   */
  createdDate: string | null;

  /**
   * .what = when the domain expires
   * .note = null if not available
   */
  expirationDate: string | null;

  /**
   * .what = the nameservers for the domain
   */
  nameservers: string[];
}

export class DeclaredCloudflareDomainWhoisRecord
  extends DomainLiteral<DeclaredCloudflareDomainWhoisRecord>
  implements DeclaredCloudflareDomainWhoisRecord {}
