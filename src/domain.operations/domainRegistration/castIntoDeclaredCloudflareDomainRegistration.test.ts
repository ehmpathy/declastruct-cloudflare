import { given, then, when } from 'test-fns';

import { castIntoDeclaredCloudflareDomainRegistration } from './castIntoDeclaredCloudflareDomainRegistration';

describe('castIntoDeclaredCloudflareDomainRegistration', () => {
  given('a cloudflare domain response', () => {
    when('all fields are present', () => {
      const mockDomain = {
        id: 'domain-123',
        available: false,
        can_register: false,
        created_at: '2023-01-01T00:00:00Z',
        current_registrar: 'cloudflare',
        expires_at: '2025-01-01T00:00:00Z',
        locked: true,
        registrant_contact: {
          id: 'contact-123',
          first_name: 'John',
          last_name: 'Doe',
          organization: 'Acme Corp',
          address: '123 Main St',
          address2: 'Suite 100',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'US',
          phone: '+14155551234',
          email: 'john@example.com',
          fax: '+14155551235',
        },
        registry_statuses: 'clientTransferProhibited,serverTransferProhibited',
        supported_tld: true,
        transfer_in: {
          accept_foa: 'needed',
          approve_transfer: 'needed',
          can_cancel_transfer: true,
          disable_privacy: 'needed',
          enter_auth_code: 'needed',
          unlock_domain: 'needed',
        },
        updated_at: '2023-06-15T00:00:00Z',
      };

      then('it should map all fields correctly', () => {
        const result = castIntoDeclaredCloudflareDomainRegistration(
          mockDomain,
          'example.com',
          { name: 'example.com' },
        );

        expect(result.id).toEqual('example.com');
        expect(result.name).toEqual('example.com');
        expect(result.zone).toEqual({ name: 'example.com' });
        expect(result.locked).toEqual(true);
        expect(result.expiresAt).toEqual('2025-01-01T00:00:00Z');
        expect(result.createdAt).toEqual('2023-01-01T00:00:00Z');
        expect(result.updatedAt).toEqual('2023-06-15T00:00:00Z');
        expect(result.currentRegistrar).toEqual('cloudflare');
        expect(result.supportsDnssec).toEqual(true);
        expect(result.registryStatuses).toEqual([
          'clientTransferProhibited',
          'serverTransferProhibited',
        ]);
      });

      then('it should map registrant contact correctly', () => {
        const result = castIntoDeclaredCloudflareDomainRegistration(
          mockDomain,
          'example.com',
          { name: 'example.com' },
        );

        expect(result.registrantContact).toEqual({
          id: 'contact-123',
          firstName: 'John',
          lastName: 'Doe',
          organization: 'Acme Corp',
          address: '123 Main St',
          address2: 'Suite 100',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'US',
          phone: '+14155551234',
          email: 'john@example.com',
          fax: '+14155551235',
        });
      });

      then('it should map transfer_in correctly', () => {
        const result = castIntoDeclaredCloudflareDomainRegistration(
          mockDomain,
          'example.com',
          { name: 'example.com' },
        );

        expect(result.transferIn).toEqual({
          acceptFoa: 'needed',
          approveTransfer: 'needed',
          canCancelTransfer: 'true',
          disablePrivacy: 'needed',
          enterAuthCode: 'needed',
          unlockDomain: 'needed',
        });
      });
    });

    when('only minimal fields are present', () => {
      const mockDomain = {
        id: 'minimal-domain',
        expires_at: '2025-12-31T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-06-15T00:00:00Z',
      };

      then('it should handle missing fields gracefully', () => {
        const result = castIntoDeclaredCloudflareDomainRegistration(
          mockDomain,
          'minimal.com',
          { name: 'minimal.com' },
        );

        expect(result.id).toEqual('minimal.com');
        expect(result.name).toEqual('minimal.com');
        expect(result.zone).toEqual({ name: 'minimal.com' });
        expect(result.locked).toBeUndefined();
        expect(result.registrantContact).toBeUndefined();
        expect(result.transferIn).toBeUndefined();
        expect(result.registryStatuses).toBeUndefined();
      });
    });

    when('registrant contact has null values', () => {
      const mockDomain = {
        id: 'domain-with-nulls',
        expires_at: '2025-12-31T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-06-15T00:00:00Z',
        registrant_contact: {
          id: 'contact-456',
          first_name: null,
          last_name: null,
          organization: undefined,
          zip: null,
          country: null,
          phone: null,
        },
      };

      then('it should use empty strings for null values', () => {
        const result = castIntoDeclaredCloudflareDomainRegistration(
          mockDomain,
          'nulls.com',
          { name: 'nulls.com' },
        );

        expect(result.registrantContact?.firstName).toEqual('');
        expect(result.registrantContact?.lastName).toEqual('');
        expect(result.registrantContact?.organization).toEqual('');
        expect(result.registrantContact?.zip).toEqual('');
        expect(result.registrantContact?.country).toEqual('');
        expect(result.registrantContact?.phone).toEqual('');
      });
    });

    when('transfer_in has missing values', () => {
      const mockDomain = {
        id: 'transferring-domain',
        expires_at: '2025-12-31T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-06-15T00:00:00Z',
        transfer_in: {
          can_cancel_transfer: undefined,
        },
      };

      then('it should use default values', () => {
        const result = castIntoDeclaredCloudflareDomainRegistration(
          mockDomain,
          'transfer.com',
          { name: 'transfer.com' },
        );

        expect(result.transferIn?.acceptFoa).toEqual('unknown');
        expect(result.transferIn?.approveTransfer).toEqual('unknown');
        expect(result.transferIn?.canCancelTransfer).toEqual('false');
        expect(result.transferIn?.disablePrivacy).toEqual('unknown');
        expect(result.transferIn?.enterAuthCode).toEqual('unknown');
        expect(result.transferIn?.unlockDomain).toEqual('unknown');
      });
    });
  });
});
