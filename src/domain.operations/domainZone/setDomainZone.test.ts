import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { setDomainZone } from './setDomainZone';

const createMockZone = (overrides: Partial<any> = {}) => ({
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
  ...overrides,
});

describe('setDomainZone', () => {
  given('a findsert operation', () => {
    when('the zone already exists', () => {
      then(
        'it should return the existing zone without modification',
        async () => {
          const context = getMockedCloudflareApiContext();
          const existingZone = createMockZone();

          context.cloudflare.client.zones = {
            get: jest.fn(),
            list: jest.fn().mockResolvedValue({ result: [existingZone] }),
            create: jest.fn(),
            edit: jest.fn(),
          } as any;

          const result = await setDomainZone(
            {
              findsert: {
                name: 'example.com',
                type: 'full',
                paused: false,
                original: null,
                activatedOn: null,
              },
            },
            context,
          );

          expect(result.id).toEqual('zone-123');
          expect(result.name).toEqual('example.com');
          expect(context.cloudflare.client.zones.create).not.toHaveBeenCalled();
          expect(context.cloudflare.client.zones.edit).not.toHaveBeenCalled();
        },
      );
    });

    when('the zone does not exist', () => {
      then('it should create a new zone', async () => {
        const context = getMockedCloudflareApiContext();
        const createdZone = createMockZone({ id: 'new-zone-id' });

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [] }),
          create: jest.fn().mockResolvedValue(createdZone),
          edit: jest.fn(),
        } as any;

        const result = await setDomainZone(
          {
            findsert: {
              name: 'example.com',
              type: 'full',
              paused: false,
              original: null,
              activatedOn: null,
            },
          },
          context,
        );

        expect(result.id).toEqual('new-zone-id');
        expect(context.cloudflare.client.zones.create).toHaveBeenCalledWith({
          account: { id: 'mock-account-id-123' },
          name: 'example.com',
          type: 'full',
        });
      });
    });
  });

  given('an upsert operation', () => {
    when('the zone already exists', () => {
      then('it should update the existing zone', async () => {
        const context = getMockedCloudflareApiContext();
        const existingZone = createMockZone();
        const updatedZone = createMockZone({ paused: true });

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [existingZone] }),
          create: jest.fn(),
          edit: jest.fn().mockResolvedValue(updatedZone),
        } as any;

        const result = await setDomainZone(
          {
            upsert: {
              name: 'example.com',
              type: 'full',
              paused: true,
              original: null,
              activatedOn: null,
            },
          },
          context,
        );

        expect(result.paused).toEqual(true);
        expect(context.cloudflare.client.zones.edit).toHaveBeenCalledWith({
          zone_id: 'zone-123',
          paused: true,
          type: 'full',
        });
        expect(context.cloudflare.client.zones.create).not.toHaveBeenCalled();
      });
    });

    when('the zone does not exist', () => {
      then('it should create a new zone', async () => {
        const context = getMockedCloudflareApiContext();
        const createdZone = createMockZone({ id: 'upsert-new-zone' });

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [] }),
          create: jest.fn().mockResolvedValue(createdZone),
          edit: jest.fn(),
        } as any;

        const result = await setDomainZone(
          {
            upsert: {
              name: 'example.com',
              type: 'full',
              paused: false,
              original: null,
              activatedOn: null,
            },
          },
          context,
        );

        expect(result.id).toEqual('upsert-new-zone');
        expect(context.cloudflare.client.zones.create).toHaveBeenCalled();
        expect(context.cloudflare.client.zones.edit).not.toHaveBeenCalled();
      });
    });
  });

  given('a zone with mismatched id', () => {
    when('existing zone id differs from expected id', () => {
      then('it should throw an error', async () => {
        const context = getMockedCloudflareApiContext();
        const existingZone = createMockZone({ id: 'different-zone-id' });

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [existingZone] }),
          create: jest.fn(),
          edit: jest.fn(),
        } as any;

        await expect(
          setDomainZone(
            {
              findsert: {
                id: 'expected-zone-id',
                name: 'example.com',
                type: 'full',
                paused: false,
                original: null,
                activatedOn: null,
              },
            },
            context,
          ),
        ).rejects.toThrow('zone found with different id than expected');
      });
    });
  });
});
