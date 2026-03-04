import type { Zone } from 'cloudflare/resources/zones/zones';
import { given, then, when } from 'test-fns';

import { DeclaredCloudflareDomainZone } from '@src/domain.objects/DeclaredCloudflareDomainZone';

import { castIntoDeclaredCloudflareDomainZone } from './castIntoDeclaredCloudflareDomainZone';

describe('castIntoDeclaredCloudflareDomainZone', () => {
  given('a valid cloudflare zone response', () => {
    const mockZone: Zone = {
      id: 'zone-id-123',
      name: 'example.com',
      type: 'full',
      paused: false,
      status: 'active',
      name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      original_name_servers: ['ns1.original.com'],
      original_registrar: 'Original Registrar Inc',
      created_on: '2023-01-01T00:00:00Z',
      activated_on: '2023-01-02T00:00:00Z',
      account: { id: 'account-123', name: 'Test Account' },
      development_mode: 0,
      modified_on: '2023-06-01T00:00:00Z',
      original_dnshost: null,
      permissions: ['#zone:read'],
      owner: { id: 'owner-123', name: 'Owner', type: 'user' },
      meta: { page_rule_quota: 3, dns_only: false },
      plan: { id: 'plan-free', name: 'Free' },
    };

    when('cast is called', () => {
      then('it should return a DeclaredCloudflareDomainZone', () => {
        const result = castIntoDeclaredCloudflareDomainZone(mockZone);

        expect(result).toBeInstanceOf(DeclaredCloudflareDomainZone);
        expect(result.id).toEqual('zone-id-123');
        expect(result.name).toEqual('example.com');
        expect(result.type).toEqual('full');
        expect(result.paused).toEqual(false);
        expect(result.status).toEqual('active');
        expect(result.nameServers).toEqual([
          'ns1.cloudflare.com',
          'ns2.cloudflare.com',
        ]);
        expect(result.originalNameservers).toEqual(['ns1.original.com']);
        expect(result.originalRegistrar).toEqual('Original Registrar Inc');
        expect(result.createdOn).toEqual('2023-01-01T00:00:00Z');
        expect(result.activatedOn).toEqual('2023-01-02T00:00:00Z');
      });
    });
  });

  given('a zone with minimal required fields', () => {
    const mockZone: Zone = {
      id: 'zone-id-456',
      name: 'minimal.com',
      type: 'partial',
      paused: true,
      status: 'pending',
      name_servers: [],
      original_name_servers: null,
      original_registrar: null,
      created_on: '2023-03-01T00:00:00Z',
      activated_on: null,
      account: { id: 'account-456', name: 'Test' },
      development_mode: 0,
      modified_on: '2023-03-01T00:00:00Z',
      original_dnshost: null,
      permissions: [],
      owner: { id: 'owner-456', name: 'Owner', type: 'user' },
      meta: { page_rule_quota: 3, dns_only: false },
      plan: { id: 'plan-free', name: 'Free' },
    };

    when('cast is called', () => {
      then('it should handle null values by converting to undefined', () => {
        const result = castIntoDeclaredCloudflareDomainZone(mockZone);

        expect(result.originalNameservers).toBeUndefined();
        expect(result.originalRegistrar).toBeUndefined();
        expect(result.activatedOn).toBeUndefined();
      });
    });
  });

  given('a zone with secondary type', () => {
    const mockZone: Zone = {
      id: 'zone-id-789',
      name: 'secondary.com',
      type: 'secondary',
      paused: false,
      status: 'initializing',
      name_servers: ['ns1.cloudflare.com'],
      original_name_servers: null,
      original_registrar: null,
      created_on: '2023-05-01T00:00:00Z',
      activated_on: null,
      account: { id: 'account-789', name: 'Test' },
      development_mode: 0,
      modified_on: '2023-05-01T00:00:00Z',
      original_dnshost: null,
      permissions: [],
      owner: { id: 'owner-789', name: 'Owner', type: 'user' },
      meta: { page_rule_quota: 3, dns_only: false },
      plan: { id: 'plan-free', name: 'Free' },
    };

    when('cast is called', () => {
      then('it should preserve secondary type and initializing status', () => {
        const result = castIntoDeclaredCloudflareDomainZone(mockZone);

        expect(result.type).toEqual('secondary');
        expect(result.status).toEqual('initializing');
      });
    });
  });
});
