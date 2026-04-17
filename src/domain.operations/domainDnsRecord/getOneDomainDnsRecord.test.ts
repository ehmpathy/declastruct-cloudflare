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

describe('getOneDomainDnsRecord', () => {
  given('a query by primary key (id)', () => {
    when('the record exists', () => {
      then('it should return the record', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();
        const mockRecord = createMockRecord();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn().mockResolvedValue(mockRecord),
            list: jest.fn(),
          },
        } as any;

        const result = await getOneDomainDnsRecord(
          {
            by: {
              primary: { id: 'record-123', zone: { name: 'example.com' } },
            },
          },
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
        const mockZone = createMockZone();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn().mockRejectedValue(new Error('Record not found')),
            list: jest.fn(),
          },
        } as any;

        const result = await getOneDomainDnsRecord(
          {
            by: {
              primary: { id: 'nonexistent', zone: { name: 'example.com' } },
            },
          },
          context,
        );

        expect(result).toBeNull();
      });
    });
  });

  given('a query by unique key (zone, name, type, content)', () => {
    when('the record exists', () => {
      then('it should return the record', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();
        const mockRecord = createMockRecord();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

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
                zone: { name: 'example.com' },
                name: 'www.example.com',
                type: 'A',
                content: '192.168.1.1',
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
          },
        } as any;

        const result = await getOneDomainDnsRecord(
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

        expect(result).toBeNull();
      });
    });

    when('zone is expanded from name', () => {
      then('it should use expanded zone id', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone({ id: 'expanded-zone-id' });
        const mockRecord = createMockRecord();

        context.cloudflare.client.zones = {
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
                content: '192.168.1.1',
              },
            },
          },
          context,
        );

        expect(result?.id).toEqual('record-123');
        expect(context.cloudflare.client.zones.list).toHaveBeenCalled();
        expect(context.cloudflare.client.dns.records.list).toHaveBeenCalledWith(
          {
            zone_id: 'expanded-zone-id',
            name: { exact: 'www.example.com' },
            type: 'A',
          },
        );
      });
    });
  });
});
