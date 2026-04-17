import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { setDomainDnsRecord } from './setDomainDnsRecord';

const createMockRecord = (overrides: Partial<any> = {}) => ({
  id: 'record-123',
  name: 'www.example.com',
  type: 'A',
  content: '192.168.1.1',
  ttl: 3600,
  proxied: true,
  comment: 'Test record',
  tags: [],
  priority: undefined,
  settings: undefined,
  created_on: '2023-01-01T00:00:00Z',
  modified_on: '2023-01-01T00:00:00Z',
  proxiable: true,
  ...overrides,
});

const createMockZone = (overrides: Partial<any> = {}) => ({
  id: 'zone-123',
  name: 'example.com',
  type: 'full',
  status: 'active',
  paused: false,
  name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
  created_on: '2023-01-01T00:00:00Z',
  activated_on: '2023-01-01T00:00:00Z',
  account: { id: 'acc-123', name: 'Test' },
  development_mode: 0,
  modified_on: '2023-01-01T00:00:00Z',
  original_dnshost: null,
  original_name_servers: null,
  original_registrar: null,
  permissions: [],
  owner: { id: 'owner-123', name: 'Owner', type: 'user' },
  ...overrides,
});

describe('setDomainDnsRecord', () => {
  given('a findsert operation', () => {
    when('the record already exists', () => {
      then(
        'it should return the extant record without modification',
        async () => {
          const context = getMockedCloudflareApiContext();
          const recordFound = createMockRecord();
          const mockZone = createMockZone();

          // mock zones for expandZoneRef
          context.cloudflare.client.zones = {
            list: jest.fn().mockResolvedValue({ result: [mockZone] }),
          } as any;

          // mock dns records
          context.cloudflare.client.dns = {
            records: {
              get: jest.fn(),
              list: jest.fn().mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                  yield recordFound;
                },
              }),
              create: jest.fn(),
              update: jest.fn(),
            },
          } as any;

          const result = await setDomainDnsRecord(
            {
              findsert: {
                zone: { name: 'example.com' },
                name: 'www.example.com',
                type: 'A',
                content: '192.168.1.1',
                ttl: 3600,
                proxied: true,
              },
            },
            context,
          );

          expect(result.id).toEqual('record-123');
          expect(
            context.cloudflare.client.dns.records.create,
          ).not.toHaveBeenCalled();
          expect(
            context.cloudflare.client.dns.records.update,
          ).not.toHaveBeenCalled();
        },
      );
    });

    when('the record does not exist', () => {
      then('it should create a new record', async () => {
        const context = getMockedCloudflareApiContext();
        const createdRecord = createMockRecord({ id: 'new-record-id' });
        const mockZone = createMockZone();

        // mock zones for expandZoneRef
        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        // mock empty async iterator (record not found)
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields none
              },
            }),
            create: jest.fn().mockResolvedValue(createdRecord),
            update: jest.fn(),
          },
        } as any;

        const result = await setDomainDnsRecord(
          {
            findsert: {
              zone: { name: 'example.com' },
              name: 'www.example.com',
              type: 'A',
              content: '192.168.1.1',
              ttl: 3600,
              proxied: true,
            },
          },
          context,
        );

        expect(result.id).toEqual('new-record-id');
        expect(
          context.cloudflare.client.dns.records.create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            zone_id: 'zone-123',
            name: 'www.example.com',
            type: 'A',
            content: '192.168.1.1',
          }),
        );
      });
    });
  });

  given('an upsert operation', () => {
    when('the record already exists with same unique key', () => {
      then('it should update the extant record', async () => {
        const context = getMockedCloudflareApiContext();
        const recordFound = createMockRecord({ ttl: 3600 });
        const updatedRecord = createMockRecord({ ttl: 7200 });
        const mockZone = createMockZone();

        // mock zones for expandZoneRef
        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        // mock async iterator for list — yields record with same content
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                yield recordFound;
              },
            }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedRecord),
          },
        } as any;

        const result = await setDomainDnsRecord(
          {
            upsert: {
              zone: { name: 'example.com' },
              name: 'www.example.com',
              type: 'A',
              content: '192.168.1.1', // same content as recordFound
              ttl: 7200, // different ttl — target of update
              proxied: true,
            },
          },
          context,
        );

        expect(result.ttl).toEqual(7200);
        expect(
          context.cloudflare.client.dns.records.update,
        ).toHaveBeenCalledWith(
          'record-123',
          expect.objectContaining({
            zone_id: 'zone-123',
            ttl: 7200,
          }),
        );
        expect(
          context.cloudflare.client.dns.records.create,
        ).not.toHaveBeenCalled();
      });
    });

    when('the record does not exist', () => {
      then('it should create a new record', async () => {
        const context = getMockedCloudflareApiContext();
        const createdRecord = createMockRecord({ id: 'upsert-new-record' });
        const mockZone = createMockZone();

        // mock zones for expandZoneRef
        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        // mock empty async iterator
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields none
              },
            }),
            create: jest.fn().mockResolvedValue(createdRecord),
            update: jest.fn(),
          },
        } as any;

        const result = await setDomainDnsRecord(
          {
            upsert: {
              zone: { name: 'example.com' },
              name: 'www.example.com',
              type: 'A',
              content: '192.168.1.1',
              ttl: 3600,
              proxied: true,
            },
          },
          context,
        );

        expect(result.id).toEqual('upsert-new-record');
        expect(context.cloudflare.client.dns.records.create).toHaveBeenCalled();
        expect(
          context.cloudflare.client.dns.records.update,
        ).not.toHaveBeenCalled();
      });
    });
  });

  given('a record with mismatched id', () => {
    when('extant record id differs from expected id', () => {
      then('it should throw an error', async () => {
        const context = getMockedCloudflareApiContext();
        const recordFound = createMockRecord({ id: 'different-record-id' });
        const mockZone = createMockZone();

        // mock zones for expandZoneRef
        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                yield recordFound;
              },
            }),
            create: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        await expect(
          setDomainDnsRecord(
            {
              findsert: {
                id: 'expected-record-id',
                zone: { name: 'example.com' },
                name: 'www.example.com',
                type: 'A',
                content: '192.168.1.1',
                ttl: 3600,
                proxied: true,
              },
            },
            context,
          ),
        ).rejects.toThrow('record found with different id than expected');
      });
    });
  });
});
