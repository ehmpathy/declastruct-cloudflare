import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { getOneDomainZone } from './getOneDomainZone';

describe('getOneDomainZone', () => {
  given('a query by primary key (id)', () => {
    when('the zone exists', () => {
      then('it should return the zone', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = {
          id: 'zone-123',
          name: 'example.com',
          type: 'full',
          paused: false,
          status: 'active',
          name_servers: ['ns1.cloudflare.com'],
          original_name_servers: null,
          original_registrar: null,
          created_on: '2023-01-01T00:00:00Z',
          activated_on: '2023-01-02T00:00:00Z',
          account: { id: 'acc-123', name: 'Test' },
          development_mode: 0,
          modified_on: '2023-01-01T00:00:00Z',
          original_dnshost: null,
          permissions: [],
          owner: { id: 'owner-123', name: 'Owner', type: 'user' },
        };

        context.cloudflare.client.zones = {
          get: jest.fn().mockResolvedValue(mockZone),
          list: jest.fn(),
        } as any;

        const result = await getOneDomainZone(
          { by: { primary: { id: 'zone-123' } } },
          context,
        );

        expect(result).not.toBeNull();
        expect(result?.id).toEqual('zone-123');
        expect(result?.name).toEqual('example.com');
        expect(context.cloudflare.client.zones.get).toHaveBeenCalledWith({
          zone_id: 'zone-123',
        });
      });
    });

    when('the zone does not exist', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.zones = {
          get: jest.fn().mockRejectedValue(new Error('Zone not found')),
          list: jest.fn(),
        } as any;

        const result = await getOneDomainZone(
          { by: { primary: { id: 'nonexistent-zone' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });
  });

  given('a query by unique key (name)', () => {
    when('the zone exists', () => {
      then('it should return the zone', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = {
          id: 'zone-456',
          name: 'found.com',
          type: 'full',
          paused: false,
          status: 'active',
          name_servers: ['ns1.cloudflare.com'],
          original_name_servers: null,
          original_registrar: null,
          created_on: '2023-01-01T00:00:00Z',
          activated_on: '2023-01-02T00:00:00Z',
          account: { id: 'acc-456', name: 'Test' },
          development_mode: 0,
          modified_on: '2023-01-01T00:00:00Z',
          original_dnshost: null,
          permissions: [],
          owner: { id: 'owner-456', name: 'Owner', type: 'user' },
        };

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        const result = await getOneDomainZone(
          { by: { unique: { name: 'found.com' } } },
          context,
        );

        expect(result).not.toBeNull();
        expect(result?.id).toEqual('zone-456');
        expect(result?.name).toEqual('found.com');
        expect(context.cloudflare.client.zones.list).toHaveBeenCalledWith({
          account: { id: 'mock-account-id-123' },
          name: 'found.com',
        });
      });
    });

    when('the zone does not exist', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [] }),
        } as any;

        const result = await getOneDomainZone(
          { by: { unique: { name: 'notfound.com' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });
  });

  given('a query by ref', () => {
    when('ref has name (unique key)', () => {
      then('it should delegate to unique key lookup', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = {
          id: 'zone-789',
          name: 'ref-by-name.com',
          type: 'full',
          paused: false,
          status: 'active',
          name_servers: [],
          original_name_servers: null,
          original_registrar: null,
          created_on: '2023-01-01T00:00:00Z',
          activated_on: null,
          account: { id: 'acc-789', name: 'Test' },
          development_mode: 0,
          modified_on: '2023-01-01T00:00:00Z',
          original_dnshost: null,
          permissions: [],
          owner: { id: 'owner-789', name: 'Owner', type: 'user' },
        };

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        const result = await getOneDomainZone(
          { by: { ref: { name: 'ref-by-name.com' } } },
          context,
        );

        expect(result?.name).toEqual('ref-by-name.com');
        expect(context.cloudflare.client.zones.list).toHaveBeenCalled();
      });
    });

    when('ref has id (primary key)', () => {
      then('it should delegate to primary key lookup', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = {
          id: 'zone-ref-id',
          name: 'ref-by-id.com',
          type: 'full',
          paused: false,
          status: 'active',
          name_servers: [],
          original_name_servers: null,
          original_registrar: null,
          created_on: '2023-01-01T00:00:00Z',
          activated_on: null,
          account: { id: 'acc-ref', name: 'Test' },
          development_mode: 0,
          modified_on: '2023-01-01T00:00:00Z',
          original_dnshost: null,
          permissions: [],
          owner: { id: 'owner-ref', name: 'Owner', type: 'user' },
        };

        context.cloudflare.client.zones = {
          get: jest.fn().mockResolvedValue(mockZone),
          list: jest.fn(),
        } as any;

        const result = await getOneDomainZone(
          { by: { ref: { id: 'zone-ref-id' } } },
          context,
        );

        expect(result?.id).toEqual('zone-ref-id');
        expect(context.cloudflare.client.zones.get).toHaveBeenCalled();
      });
    });
  });
});
