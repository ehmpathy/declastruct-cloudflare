import { DomainLiteral } from 'domain-objects';

/**
 * .what = registrant contact information for domain
 * .why = enables tracking of domain ownership contact details
 *
 * .note = dashboard-writable only - can only be set via cloudflare dashboard, not via api
 */
export interface DeclaredCloudflareDomainRegistrantContact {
  /**
   * .what = cloudflare contact id
   */
  id?: string;

  /**
   * .what = first name of registrant
   */
  firstName: string;

  /**
   * .what = last name of registrant
   */
  lastName: string;

  /**
   * .what = organization name
   */
  organization: string;

  /**
   * .what = primary address line
   */
  address: string;

  /**
   * .what = secondary address line
   */
  address2?: string;

  /**
   * .what = city
   */
  city: string;

  /**
   * .what = state or province
   */
  state: string;

  /**
   * .what = postal or zip code
   */
  zip: string;

  /**
   * .what = country code
   */
  country: string;

  /**
   * .what = phone number
   */
  phone: string;

  /**
   * .what = fax number
   */
  fax?: string;

  /**
   * .what = email address
   */
  email?: string;
}

export class DeclaredCloudflareDomainRegistrantContact
  extends DomainLiteral<DeclaredCloudflareDomainRegistrantContact>
  implements DeclaredCloudflareDomainRegistrantContact {}
