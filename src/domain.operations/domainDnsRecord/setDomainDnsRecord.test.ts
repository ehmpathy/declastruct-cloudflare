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

describe('setDomainDnsRecord', () => {
  given('a findsert operation', () => {
    when('the record already exists', () => {
      then(
        'it should return the existing record without modification',
        async () => {
          const context = getMockedCloudflareApiContext();
          const existingRecord = createMockRecord();

          // mock async iterator for list (used by getOneDomainDnsRecord)
          context.cloudflare.client.dns = {
            records: {
              get: jest.fn(),
              list: jest.fn().mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                  yield existingRecord;
                },
              }),
              create: jest.fn(),
              update: jest.fn(),
            },
          } as any;

          const result = await setDomainDnsRecord(
            {
              findsert: {
                zone: { id: 'zone-123' },
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

        // mock empty async iterator (record not found)
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields nothing
              },
            }),
            create: jest.fn().mockResolvedValue(createdRecord),
            update: jest.fn(),
          },
        } as any;

        const result = await setDomainDnsRecord(
          {
            findsert: {
              zone: { id: 'zone-123' },
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
    when('the record already exists', () => {
      then('it should update the existing record', async () => {
        const context = getMockedCloudflareApiContext();
        const existingRecord = createMockRecord();
        const updatedRecord = createMockRecord({ content: '10.0.0.1' });

        // mock async iterator for list
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                yield existingRecord;
              },
            }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedRecord),
          },
        } as any;

        const result = await setDomainDnsRecord(
          {
            upsert: {
              zone: { id: 'zone-123' },
              name: 'www.example.com',
              type: 'A',
              content: '10.0.0.1',
              ttl: 3600,
              proxied: true,
            },
          },
          context,
        );

        expect(result.content).toEqual('10.0.0.1');
        expect(
          context.cloudflare.client.dns.records.update,
        ).toHaveBeenCalledWith(
          'record-123',
          expect.objectContaining({
            zone_id: 'zone-123',
            content: '10.0.0.1',
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

        // mock empty async iterator
        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields nothing
              },
            }),
            create: jest.fn().mockResolvedValue(createdRecord),
            update: jest.fn(),
          },
        } as any;

        const result = await setDomainDnsRecord(
          {
            upsert: {
              zone: { id: 'zone-123' },
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
    when('existing record id differs from expected id', () => {
      then('it should throw an error', async () => {
        const context = getMockedCloudflareApiContext();
        const existingRecord = createMockRecord({ id: 'different-record-id' });

        context.cloudflare.client.dns = {
          records: {
            get: jest.fn(),
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                yield existingRecord;
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
                zone: { id: 'zone-123' },
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
