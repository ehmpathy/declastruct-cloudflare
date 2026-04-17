import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { getAllDomainZones } from './getAllDomainZones';

describe('getAllDomainZones', () => {
  given('a cloudflare account', () => {
    when('the account has zones', () => {
      then('it should return all zones', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZones = [
          {
            id: 'zone-1',
            name: 'first.com',
            type: 'full',
            paused: false,
            status: 'active',
            name_servers: ['ns1.cloudflare.com'],
            original_name_servers: null,
            original_registrar: null,
            created_on: '2023-01-01T00:00:00Z',
            activated_on: '2023-01-02T00:00:00Z',
            account: { id: 'acc-1', name: 'Test' },
            development_mode: 0,
            modified_on: '2023-01-01T00:00:00Z',
            original_dnshost: null,
            permissions: [],
            owner: { id: 'owner-1', name: 'Owner', type: 'user' },
          },
          {
            id: 'zone-2',
            name: 'second.com',
            type: 'full',
            paused: true,
            status: 'pending',
            name_servers: ['ns1.cloudflare.com'],
            original_name_servers: null,
            original_registrar: null,
            created_on: '2023-02-01T00:00:00Z',
            activated_on: null,
            account: { id: 'acc-1', name: 'Test' },
            development_mode: 0,
            modified_on: '2023-02-01T00:00:00Z',
            original_dnshost: null,
            permissions: [],
            owner: { id: 'owner-1', name: 'Owner', type: 'user' },
          },
        ];

        // mock async iterator
        context.cloudflare.client.zones = {
          list: jest.fn().mockReturnValue({
            [Symbol.asyncIterator]: async function* () {
              for (const zone of mockZones) {
                yield zone;
              }
            },
          }),
        } as any;

        const result = await getAllDomainZones(context);

        expect(result).toHaveLength(2);
        expect(result[0]?.name).toEqual('first.com');
        expect(result[1]?.name).toEqual('second.com');
        expect(context.cloudflare.client.zones.list).toHaveBeenCalledWith({
          account: { id: 'mock-account-id-123' },
        });
      });
    });

    when('the account has no zones', () => {
      then('it should return an empty array', async () => {
        const context = getMockedCloudflareApiContext();

        // mock empty async iterator
        context.cloudflare.client.zones = {
          list: jest.fn().mockReturnValue({
            [Symbol.asyncIterator]: async function* () {
              // yields nothing
            },
          }),
        } as any;

        const result = await getAllDomainZones(context);

        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
      });
    });
  });
});
