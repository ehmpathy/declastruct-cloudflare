import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { delDomainDnsRecord } from './delDomainDnsRecord';

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

describe('delDomainDnsRecord', () => {
  given('a delete by primary key (id)', () => {
    when('the record exists', () => {
      then('it should delete the record and return deleted: true', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn(),
            delete: jest.fn().mockResolvedValue({ id: 'record-123' }),
          },
        } as any;

        const result = await delDomainDnsRecord(
          {
            by: {
              primary: { id: 'record-123', zone: { name: 'example.com' } },
            },
          },
          context,
        );

        expect(result).toEqual({ deleted: true });
        expect(
          context.cloudflare.client.dns.records.delete,
        ).toHaveBeenCalledWith('record-123', { zone_id: 'zone-123' });
      });
    });

    when('the record does not exist (not found error)', () => {
      then('it should return deleted: true (idempotent)', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn(),
            delete: jest.fn().mockRejectedValue(new Error('Record not found')),
          },
        } as any;

        const result = await delDomainDnsRecord(
          {
            by: {
              primary: { id: 'nonexistent', zone: { name: 'example.com' } },
            },
          },
          context,
        );

        expect(result).toEqual({ deleted: true });
      });
    });

    when('delete fails with unexpected error', () => {
      then('it should throw the error', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn(),
            delete: jest.fn().mockRejectedValue(new Error('Permission denied')),
          },
        } as any;

        await expect(
          delDomainDnsRecord(
            {
              by: {
                primary: { id: 'record-123', zone: { name: 'example.com' } },
              },
            },
            context,
          ),
        ).rejects.toThrow('Permission denied');
      });
    });
  });

  given('a delete by unique key (zone, name, type, content)', () => {
    when('the record exists', () => {
      then('it should lookup and delete the record', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();
        const recordFound = createMockRecord();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        // mock async iterator for list (used by getOneDomainDnsRecord)
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                yield recordFound;
              },
            }),
            delete: jest.fn().mockResolvedValue({ id: 'record-123' }),
          },
        } as any;

        const result = await delDomainDnsRecord(
          {
            by: {
              unique: {
                zone: { name: 'example.com' },
                name: 'www.example.com',
                type: 'A',
                content: '192.168.1.1',
              },
            },
          },
          context,
        );

        expect(result).toEqual({ deleted: true });
        expect(context.cloudflare.client.dns.records.list).toHaveBeenCalled();
        expect(
          context.cloudflare.client.dns.records.delete,
        ).toHaveBeenCalledWith('record-123', { zone_id: 'zone-123' });
      });
    });

    when('the record does not exist', () => {
      then(
        'it should return deleted: true (no delete call needed)',
        async () => {
          const context = getMockedCloudflareApiContext();
          const mockZone = createMockZone();

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
              delete: jest.fn(),
            },
          } as any;

          const result = await delDomainDnsRecord(
            {
              by: {
                unique: {
                  zone: { name: 'example.com' },
                  name: 'nonexistent.example.com',
                  type: 'A',
                  content: '192.168.1.1',
                },
              },
            },
            context,
          );

          expect(result).toEqual({ deleted: true });
          expect(
            context.cloudflare.client.dns.records.delete,
          ).not.toHaveBeenCalled();
        },
      );
    });
  });

  given('a delete with zone ref by name', () => {
    when('delete is called', () => {
      then('it should expand zone id first', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone({ id: 'expanded-zone-id' });

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn(),
            delete: jest.fn().mockResolvedValue({ id: 'record-123' }),
          },
        } as any;

        const result = await delDomainDnsRecord(
          {
            by: {
              primary: { id: 'record-123', zone: { name: 'example.com' } },
            },
          },
          context,
        );

        expect(result).toEqual({ deleted: true });
        expect(context.cloudflare.client.zones.list).toHaveBeenCalled();
        expect(
          context.cloudflare.client.dns.records.delete,
        ).toHaveBeenCalledWith('record-123', { zone_id: 'expanded-zone-id' });
      });
    });
  });
});
