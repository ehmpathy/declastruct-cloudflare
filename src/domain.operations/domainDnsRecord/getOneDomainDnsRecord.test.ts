import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { getOneDomainDnsRecord } from './getOneDomainDnsRecord';

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

describe('getOneDomainDnsRecord', () => {
  given('a query by primary key (id)', () => {
    when('the record exists', () => {
      then('it should return the record', async () => {
        const context = getMockedCloudflareApiContext();
        const mockRecord = createMockRecord();

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn().mockResolvedValue(mockRecord),
            list: jest.fn(),
          },
        } as any;

        const result = await getOneDomainDnsRecord(
          { by: { primary: { id: 'record-123', zone: { id: 'zone-123' } } } },
          context,
        );

        expect(result).not.toBeNull();
        expect(result?.id).toEqual('record-123');
        expect(result?.name).toEqual('www.example.com');
        expect(context.cloudflare.client.dns.records.get).toHaveBeenCalledWith(
          'record-123',
          { zone_id: 'zone-123' },
        );
      });
    });

    when('the record does not exist', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn().mockRejectedValue(new Error('Record not found')),
            list: jest.fn(),
          },
        } as any;

        const result = await getOneDomainDnsRecord(
          { by: { primary: { id: 'nonexistent', zone: { id: 'zone-123' } } } },
          context,
        );

        expect(result).toBeNull();
      });
    });
  });

  given('a query by unique key (zone, name, type)', () => {
    when('the record exists', () => {
      then('it should return the record', async () => {
        const context = getMockedCloudflareApiContext();
        const mockRecord = createMockRecord();

        // mock async iterator for list
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                yield mockRecord;
              },
            }),
          },
        } as any;

        const result = await getOneDomainDnsRecord(
          {
            by: {
              unique: {
                zone: { id: 'zone-123' },
                name: 'www.example.com',
                type: 'A',
              },
            },
          },
          context,
        );

        expect(result).not.toBeNull();
        expect(result?.id).toEqual('record-123');
        expect(context.cloudflare.client.dns.records.list).toHaveBeenCalledWith(
          {
            zone_id: 'zone-123',
            name: { exact: 'www.example.com' },
            type: 'A',
          },
        );
      });
    });

    when('the record does not exist', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();

        // mock empty async iterator
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields nothing
              },
            }),
          },
        } as any;

        const result = await getOneDomainDnsRecord(
          {
            by: {
              unique: {
                zone: { id: 'zone-123' },
                name: 'nonexistent.example.com',
                type: 'A',
              },
            },
          },
          context,
        );

        expect(result).toBeNull();
      });
    });

    when('zone ref is by name', () => {
      then('it should resolve zone id first', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = {
          id: 'resolved-zone-id',
          name: 'example.com',
          type: 'full',
          paused: false,
          status: 'active',
          name_servers: [],
          original_name_servers: null,
          original_registrar: null,
          created_on: '2023-01-01T00:00:00Z',
          activated_on: null,
          account: { id: 'acc-123', name: 'Test' },
          development_mode: 0,
          modified_on: '2023-01-01T00:00:00Z',
          original_dnshost: null,
          permissions: [],
          owner: { id: 'owner-123', name: 'Owner', type: 'user' },
        };
        const mockRecord = createMockRecord();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                yield mockRecord;
              },
            }),
          },
        } as any;

        const result = await getOneDomainDnsRecord(
          {
            by: {
              unique: {
                zone: { name: 'example.com' },
                name: 'www.example.com',
                type: 'A',
              },
            },
          },
          context,
        );

        expect(result?.id).toEqual('record-123');
        expect(context.cloudflare.client.zones.list).toHaveBeenCalled();
        expect(context.cloudflare.client.dns.records.list).toHaveBeenCalledWith(
          {
            zone_id: 'resolved-zone-id',
            name: { exact: 'www.example.com' },
            type: 'A',
          },
        );
      });
    });
  });
});
