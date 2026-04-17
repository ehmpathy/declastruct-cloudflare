import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { delDomainZone } from './delDomainZone';

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

describe('delDomainZone', () => {
  given('a delete by primary key (id)', () => {
    when('the zone exists', () => {
      then('it should delete the zone and return deleted: true', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn(),
          delete: jest.fn().mockResolvedValue({ id: 'zone-123' }),
        } as any;

        const result = await delDomainZone(
          { by: { primary: { id: 'zone-123' } } },
          context,
        );

        expect(result).toEqual({ deleted: true });
        expect(context.cloudflare.client.zones.delete).toHaveBeenCalledWith({
          zone_id: 'zone-123',
        });
      });
    });

    when('the zone does not exist (not found error)', () => {
      then('it should return deleted: true (idempotent)', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn(),
          delete: jest.fn().mockRejectedValue(new Error('Zone not found')),
        } as any;

        const result = await delDomainZone(
          { by: { primary: { id: 'nonexistent-zone' } } },
          context,
        );

        expect(result).toEqual({ deleted: true });
      });
    });

    when('delete fails with unexpected error', () => {
      then('it should throw the error', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn(),
          delete: jest.fn().mockRejectedValue(new Error('Permission denied')),
        } as any;

        await expect(
          delDomainZone({ by: { primary: { id: 'zone-123' } } }, context),
        ).rejects.toThrow('Permission denied');
      });
    });
  });

  given('a delete by unique key (name)', () => {
    when('the zone exists', () => {
      then('it should lookup and delete the zone', async () => {
        const context = getMockedCloudflareApiContext();
        const existingZone = createMockZone();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [existingZone] }),
          delete: jest.fn().mockResolvedValue({ id: 'zone-123' }),
        } as any;

        const result = await delDomainZone(
          { by: { unique: { name: 'example.com' } } },
          context,
        );

        expect(result).toEqual({ deleted: true });
        expect(context.cloudflare.client.zones.list).toHaveBeenCalled();
        expect(context.cloudflare.client.zones.delete).toHaveBeenCalledWith({
          zone_id: 'zone-123',
        });
      });
    });

    when('the zone does not exist', () => {
      then(
        'it should return deleted: true without calling delete',
        async () => {
          const context = getMockedCloudflareApiContext();

          context.cloudflare.client.zones = {
            get: jest.fn(),
            list: jest.fn().mockResolvedValue({ result: [] }),
            delete: jest.fn(),
          } as any;

          const result = await delDomainZone(
            { by: { unique: { name: 'nonexistent.com' } } },
            context,
          );

          expect(result).toEqual({ deleted: true });
          expect(context.cloudflare.client.zones.delete).not.toHaveBeenCalled();
        },
      );
    });
  });

  given('a delete by ref', () => {
    when('ref has name (unique key)', () => {
      then('it should delegate to unique key deletion', async () => {
        const context = getMockedCloudflareApiContext();
        const existingZone = createMockZone();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn().mockResolvedValue({ result: [existingZone] }),
          delete: jest.fn().mockResolvedValue({ id: 'zone-123' }),
        } as any;

        const result = await delDomainZone(
          { by: { ref: { name: 'example.com' } } },
          context,
        );

        expect(result).toEqual({ deleted: true });
        expect(context.cloudflare.client.zones.list).toHaveBeenCalled();
      });
    });

    when('ref has id (primary key)', () => {
      then('it should delegate to primary key deletion', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.zones = {
          get: jest.fn(),
          list: jest.fn(),
          delete: jest.fn().mockResolvedValue({ id: 'zone-ref-id' }),
        } as any;

        const result = await delDomainZone(
          { by: { ref: { id: 'zone-ref-id' } } },
          context,
        );

        expect(result).toEqual({ deleted: true });
        expect(context.cloudflare.client.zones.delete).toHaveBeenCalledWith({
          zone_id: 'zone-ref-id',
        });
      });
    });
  });
});
