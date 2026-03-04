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

describe('getAllDomainDnsRecords', () => {
  given('a zone with DNS records', () => {
    when('queried by zone id', () => {
      then('it should return all records', async () => {
        const context = getMockedCloudflareApiContext();
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
          { zone: { id: 'zone-123' } },
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

    when('queried by zone name', () => {
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
        const mockRecords = [createMockRecord()];

        context.cloudflare.client.zones = {
          get: jest.fn(),
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
            zone_id: 'resolved-zone-id',
          },
        );
      });
    });
  });

  given('a zone with no DNS records', () => {
    when('queried', () => {
      then('it should return an empty array', async () => {
        const context = getMockedCloudflareApiContext();

        // mock empty async iterator
        context.cloudflare.client.dns = {
          records: {
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields nothing
              },
            }),
          },
        } as any;

        const result = await getAllDomainDnsRecords(
          { zone: { id: 'zone-123' } },
          context,
        );

        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
      });
    });
  });
});
