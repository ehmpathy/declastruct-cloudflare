import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { getAllDomainDnsRecords } from './getAllDomainDnsRecords';

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

describe('getAllDomainDnsRecords', () => {
  given('a zone with DNS records', () => {
    when('queried by zone name', () => {
      then('it should return all records', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();
        const mockRecords = [
          createMockRecord({ id: 'record-1', name: 'www.example.com' }),
          createMockRecord({ id: 'record-2', name: 'api.example.com' }),
          createMockRecord({
            id: 'record-3',
            name: 'mail.example.com',
            type: 'MX',
            priority: 10,
          }),
        ];

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        // mock async iterator
        context.cloudflare.client.dns = {
          records: {
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                for (const record of mockRecords) {
                  yield record;
                }
              },
            }),
          },
        } as any;

        const result = await getAllDomainDnsRecords(
          { zone: { name: 'example.com' } },
          context,
        );

        expect(result).toHaveLength(3);
        expect(result[0]?.name).toEqual('www.example.com');
        expect(result[1]?.name).toEqual('api.example.com');
        expect(result[2]?.name).toEqual('mail.example.com');
        expect(context.cloudflare.client.dns.records.list).toHaveBeenCalledWith(
          {
            zone_id: 'zone-123',
          },
        );
      });
    });

    when('zone is expanded from name', () => {
      then('it should use expanded zone id', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone({ id: 'expanded-zone-id' });
        const mockRecords = [createMockRecord()];

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        context.cloudflare.client.dns = {
          records: {
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                for (const record of mockRecords) {
                  yield record;
                }
              },
            }),
          },
        } as any;

        const result = await getAllDomainDnsRecords(
          { zone: { name: 'example.com' } },
          context,
        );

        expect(result).toHaveLength(1);
        expect(context.cloudflare.client.zones.list).toHaveBeenCalled();
        expect(context.cloudflare.client.dns.records.list).toHaveBeenCalledWith(
          {
            zone_id: 'expanded-zone-id',
          },
        );
      });
    });
  });

  given('a zone with no DNS records', () => {
    when('queried', () => {
      then('it should return an empty array', async () => {
        const context = getMockedCloudflareApiContext();
        const mockZone = createMockZone();

        context.cloudflare.client.zones = {
          list: jest.fn().mockResolvedValue({ result: [mockZone] }),
        } as any;

        // mock empty async iterator
        context.cloudflare.client.dns = {
          records: {
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields none
              },
            }),
          },
        } as any;

        const result = await getAllDomainDnsRecords(
          { zone: { name: 'example.com' } },
          context,
        );

        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
      });
    });
  });
});
