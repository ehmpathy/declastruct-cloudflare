import { DomainEntity, type Ref } from 'domain-objects';

import { DeclaredCloudflareDomainRegistrantContact } from './DeclaredCloudflareDomainRegistrantContact';
import { DeclaredCloudflareDomainTransferIn } from './DeclaredCloudflareDomainTransferIn';
import { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

/**
 * .what = a cloudflare domain registration (registrar record)
 * .why = enables declarative domain registration management
 *
 * .identity
 *   - @primary = [id] — the domain name serves as the id
 *   - @unique = [name] — domain names are globally unique
 *
 * .note
 *   - requires zone type = 'full' for registrar features
 *   - transfer_in tracks incoming transfer status
 *   - registrant_contact holds WHOIS contact info
 */
export interface DeclaredCloudflareDomainRegistration {
  /**
   * .what = the domain name (also serves as id)
   * .note = @primary @unique — domain names are globally unique
   * .example = 'example.com'
   */
  id: string;

  /**
   * .what = the domain name
   * .note = @unique — domain names are globally unique
   * .example = 'example.com'
   */
  name: string;

  /**
   * .what = the parent zone reference
   * .why = enables declaring registrations for zones that don't exist yet
   */
  zone: Ref<typeof DeclaredCloudflareDomainZone>;

  /**
   * .what = whether auto-renewal is enabled
   */
  autoRenew?: boolean;

  /**
   * .what = whether the domain is locked
   * .note = locked domains cannot be transferred
   */
  locked?: boolean;

  /**
   * .what = whether privacy protection is enabled
   * .note = hides WHOIS contact info
   */
  privacyProtection?: boolean;

  /**
   * .what = when the domain expires
   * .note = @readonly — managed by registrar
   */
  expiresAt?: string;

  /**
   * .what = when the domain was created at the registrar
   * .note = @readonly
   */
  createdAt?: string;

  /**
   * .what = when the domain was last updated
   * .note = @readonly
   */
  updatedAt?: string;

  /**
   * .what = the registrant contact information
   * .note = used for WHOIS
   */
  registrantContact?: DeclaredCloudflareDomainRegistrantContact;

  /**
   * .what = transfer-in status (for incoming transfers)
   * .note = @readonly — managed by cloudflare during transfer
   */
  transferIn?: DeclaredCloudflareDomainTransferIn;

  /**
   * .what = available nameserver options
   * .note = @readonly
   */
  availableNameservers?: string[];

  /**
   * .what = the current nameservers
   * .note = @readonly
   */
  currentNameservers?: string[];

  /**
   * .what = the current registrar name
   * .note = @readonly
   */
  currentRegistrar?: string;

  /**
   * .what = fees associated with the domain
   * .note = @readonly
   */
  fees?: {
    icannFee?: number;
    redemptionFee?: number;
    registrationFee?: number;
    renewalFee?: number;
    transferFee?: number;
  };

  /**
   * .what = whether the domain supports DNSSEC
   * .note = @readonly
   */
  supportsDnssec?: boolean;

  /**
   * .what = the registry status codes
   * .note = @readonly — EPP status codes from the registry
   */
  registryStatuses?: string[];
}

export class DeclaredCloudflareDomainRegistration
  extends DomainEntity<DeclaredCloudflareDomainRegistration>
  implements DeclaredCloudflareDomainRegistration
{
  public static primary = ['id'] as const;
  public static unique = ['name'] as const;
  public static metadata = [] as const;
  public static readonly = ['expiresAt', 'createdAt', 'updatedAt'] as const;
  public static nested = {
    zone: DeclaredCloudflareDomainZone,
    registrantContact: DeclaredCloudflareDomainRegistrantContact,
    transferIn: DeclaredCloudflareDomainTransferIn,
  };
}
