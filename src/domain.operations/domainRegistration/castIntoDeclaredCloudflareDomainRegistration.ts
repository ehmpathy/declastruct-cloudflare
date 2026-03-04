import { type HasReadonly, hasReadonly } from 'domain-objects';
import { assure } from 'type-fns';

import type { DeclaredCloudflareDomainRegistrantContact } from '@src/domain.objects/DeclaredCloudflareDomainRegistrantContact';
import { DeclaredCloudflareDomainRegistration } from '@src/domain.objects/DeclaredCloudflareDomainRegistration';
import type { DeclaredCloudflareDomainTransferIn } from '@src/domain.objects/DeclaredCloudflareDomainTransferIn';

/**
 * .what = SDK domain shape with properties from registrar.domains.get
 * .why = cloudflare SDK types DomainGetResponse as unknown; we need explicit shape
 *
 * .note
 *   - domain name is passed via path param, not in response
 *   - auto_renew and privacy are only in update params, not returned
 */
interface CloudflareDomainShape {
  id?: string;
  available?: boolean;
  can_register?: boolean;
  created_at?: string;
  current_registrar?: string;
  expires_at?: string;
  locked?: boolean;
  registrant_contact?: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    organization?: string;
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string;
    fax?: string;
  };
  registry_statuses?: string;
  supported_tld?: boolean;
  transfer_in?: {
    accept_foa?: string;
    approve_transfer?: string;
    can_cancel_transfer?: boolean;
    disable_privacy?: string;
    enter_auth_code?: string;
    unlock_domain?: string;
  };
  updated_at?: string;
}

/**
 * .what = transforms cloudflare SDK Domain to DeclaredCloudflareDomainRegistration
 * .why = ensures type safety and readonly field enforcement
 *
 * .note
 *   - domainName passed separately because API uses it as path param
 */
export const castIntoDeclaredCloudflareDomainRegistration = (
  input: CloudflareDomainShape,
  domainName: string,
  zoneRef: { id: string } | { name: string },
): HasReadonly<typeof DeclaredCloudflareDomainRegistration> => {
  // map registrant contact if present
  const registrantContact:
    | DeclaredCloudflareDomainRegistrantContact
    | undefined = input.registrant_contact
    ? {
        id: input.registrant_contact.id,
        firstName: input.registrant_contact.first_name ?? '',
        lastName: input.registrant_contact.last_name ?? '',
        organization: input.registrant_contact.organization ?? '',
        address: input.registrant_contact.address ?? '',
        address2: input.registrant_contact.address2,
        city: input.registrant_contact.city ?? '',
        state: input.registrant_contact.state ?? '',
        zip: input.registrant_contact.zip ?? '',
        country: input.registrant_contact.country ?? '',
        phone: input.registrant_contact.phone ?? '',
        email: input.registrant_contact.email,
        fax: input.registrant_contact.fax,
      }
    : undefined;

  // map transfer_in if present
  const transferIn: DeclaredCloudflareDomainTransferIn | undefined =
    input.transfer_in
      ? {
          acceptFoa: input.transfer_in.accept_foa ?? 'unknown',
          approveTransfer: input.transfer_in.approve_transfer ?? 'unknown',
          canCancelTransfer: String(
            input.transfer_in.can_cancel_transfer ?? false,
          ),
          disablePrivacy: input.transfer_in.disable_privacy ?? 'unknown',
          enterAuthCode: input.transfer_in.enter_auth_code ?? 'unknown',
          unlockDomain: input.transfer_in.unlock_domain ?? 'unknown',
        }
      : undefined;

  // parse registry statuses (comma-separated string to array)
  const registryStatuses = input.registry_statuses
    ? input.registry_statuses.split(',').map((s) => s.trim())
    : undefined;

  return assure(
    DeclaredCloudflareDomainRegistration.as({
      id: domainName,
      name: domainName,
      zone: zoneRef,
      autoRenew: undefined, // not returned from API, only in update params
      locked: input.locked,
      privacyProtection: undefined, // not returned from API, only in update params
      expiresAt: input.expires_at,
      createdAt: input.created_at,
      updatedAt: input.updated_at,
      registrantContact,
      transferIn,
      availableNameservers: undefined, // not available in SDK response
      currentNameservers: undefined, // not available in SDK response
      currentRegistrar: input.current_registrar,
      fees: undefined, // not available in SDK response
      supportsDnssec: input.supported_tld,
      registryStatuses,
    }),
    hasReadonly({ of: DeclaredCloudflareDomainRegistration }),
  );
};
