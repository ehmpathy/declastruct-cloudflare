import { DeclaredCloudflareDomainRegistrantContact } from './DeclaredCloudflareDomainRegistrantContact';
import { DeclaredCloudflareDomainRegistration } from './DeclaredCloudflareDomainRegistration';
import { DeclaredCloudflareDomainTransferIn } from './DeclaredCloudflareDomainTransferIn';
import { DeclaredCloudflareDomainZone } from './DeclaredCloudflareDomainZone';

describe('DeclaredCloudflareDomainRegistration', () => {
  it('should be instantiable with required properties', () => {
    const registration = new DeclaredCloudflareDomainRegistration({
      id: 'example.com',
      name: 'example.com',
      zone: { name: 'example.com' },
    });
    expect(registration.id).toEqual('example.com');
    expect(registration.name).toEqual('example.com');
    expect(registration.zone).toEqual({ name: 'example.com' });
  });

  it('should be instantiable with auto-renew and lock options', () => {
    const registration = new DeclaredCloudflareDomainRegistration({
      id: 'example.com',
      name: 'example.com',
      zone: { name: 'example.com' },
      autoRenew: true,
      locked: true,
    });
    expect(registration.zone).toEqual({ name: 'example.com' });
    expect(registration.autoRenew).toEqual(true);
    expect(registration.locked).toEqual(true);
  });

  it('should be instantiable with all properties', () => {
    const registration = new DeclaredCloudflareDomainRegistration({
      id: 'example.com',
      name: 'example.com',
      zone: { name: 'example.com' },
      autoRenew: true,
      locked: false,
      privacyProtection: true,
      expiresAt: '2025-12-31T00:00:00Z',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2024-06-15T12:00:00Z',
      registrantContact: {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Example Inc',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'US',
        phone: '+1.4155551234',
        email: 'admin@example.com',
      },
      transferIn: {
        acceptFoa: 'completed',
        approveTransfer: 'completed',
        canCancelTransfer: 'false',
        disablePrivacy: 'completed',
        enterAuthCode: 'completed',
        unlockDomain: 'completed',
      },
      availableNameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      currentNameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      currentRegistrar: 'Cloudflare',
      fees: {
        icannFee: 0.18,
        renewalFee: 8.03,
        transferFee: 8.03,
      },
      supportsDnssec: true,
      registryStatuses: ['clientTransferProhibited'],
    });
    expect(registration.privacyProtection).toEqual(true);
    expect(registration.fees?.renewalFee).toEqual(8.03);
    expect(registration.supportsDnssec).toEqual(true);
  });

  it('should have correct static properties', () => {
    expect(DeclaredCloudflareDomainRegistration.primary).toEqual(['id']);
    expect(DeclaredCloudflareDomainRegistration.unique).toEqual(['name']);
    expect(DeclaredCloudflareDomainRegistration.metadata).toEqual([]);
    expect(DeclaredCloudflareDomainRegistration.readonly).toEqual([
      'expiresAt',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('should have nested definitions', () => {
    expect(DeclaredCloudflareDomainRegistration.nested.zone).toEqual(
      DeclaredCloudflareDomainZone,
    );
    expect(
      DeclaredCloudflareDomainRegistration.nested.registrantContact,
    ).toEqual(DeclaredCloudflareDomainRegistrantContact);
    expect(DeclaredCloudflareDomainRegistration.nested.transferIn).toEqual(
      DeclaredCloudflareDomainTransferIn,
    );
  });
});
