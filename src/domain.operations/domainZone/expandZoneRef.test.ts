import { BadRequestError } from 'helpful-errors';
import { getError } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { expandZoneRef } from './expandZoneRef';

describe('expandZoneRef', () => {
  describe('given a ref with id (primary key)', () => {
    it('should lookup zone by id and return both id and name', async () => {
      const context = getMockedCloudflareApiContext();
      const mockZone = {
        id: 'zone-123',
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

      context.cloudflare.client.zones = {
        get: jest.fn().mockResolvedValue(mockZone),
        list: jest.fn(),
      } as any;

      const result = await expandZoneRef({ id: 'zone-123' }, context);

      expect(result).toEqual({ id: 'zone-123', name: 'example.com' });
      expect(context.cloudflare.client.zones.get).toHaveBeenCalledWith({
        zone_id: 'zone-123',
      });
    });

    it('should throw BadRequestError if zone not found by id', async () => {
      const context = getMockedCloudflareApiContext();

      context.cloudflare.client.zones = {
        get: jest.fn().mockRejectedValue(new Error('not found')),
        list: jest.fn(),
      } as any;

      const error = await getError(
        expandZoneRef({ id: 'nonexistent-id' }, context),
      );

      expect(error).toBeDefined();
    });
  });

  describe('given a ref with name (unique key)', () => {
    it('should lookup the zone and return both id and name', async () => {
      const context = getMockedCloudflareApiContext();
      const mockZone = {
        id: 'found-zone-id',
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

      context.cloudflare.client.zones = {
        get: jest.fn(),
        list: jest.fn().mockResolvedValue({ result: [mockZone] }),
      } as any;

      const result = await expandZoneRef({ name: 'example.com' }, context);

      expect(result).toEqual({ id: 'found-zone-id', name: 'example.com' });
      expect(context.cloudflare.client.zones.list).toHaveBeenCalledWith({
        account: { id: 'mock-account-id-123' },
        name: 'example.com',
      });
    });

    it('should throw BadRequestError if zone not found by name', async () => {
      const context = getMockedCloudflareApiContext();

      context.cloudflare.client.zones = {
        get: jest.fn(),
        list: jest.fn().mockResolvedValue({ result: [] }),
      } as any;

      const error = await getError(
        expandZoneRef({ name: 'nonexistent.com' }, context),
      );

      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('zone not found');
    });
  });

  describe('given an invalid ref', () => {
    it('should throw BadRequestError', async () => {
      const context = getMockedCloudflareApiContext();

      const error = await getError(expandZoneRef({} as any, context));

      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('invalid zone ref');
    });
  });
});
