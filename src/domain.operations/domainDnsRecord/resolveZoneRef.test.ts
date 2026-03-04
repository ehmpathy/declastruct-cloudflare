import { BadRequestError } from 'helpful-errors';
import { getError } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { resolveZoneRef } from './resolveZoneRef';

describe('resolveZoneRef', () => {
  describe('given a ref with id (primary key)', () => {
    it('should return the id directly without API call', async () => {
      const context = getMockedCloudflareApiContext();
      context.cloudflare.client.zones = {
        get: jest.fn(),
        list: jest.fn(),
      } as any;

      const result = await resolveZoneRef({ id: 'zone-123' }, context);

      expect(result).toEqual('zone-123');
      expect(context.cloudflare.client.zones.list).not.toHaveBeenCalled();
    });
  });

  describe('given a ref with name (unique key)', () => {
    it('should lookup the zone and return its id', async () => {
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

      context.cloudflare.client.zones = {
        get: jest.fn(),
        list: jest.fn().mockResolvedValue({ result: [mockZone] }),
      } as any;

      const result = await resolveZoneRef({ name: 'example.com' }, context);

      expect(result).toEqual('resolved-zone-id');
      expect(context.cloudflare.client.zones.list).toHaveBeenCalledWith({
        account: { id: 'mock-account-id-123' },
        name: 'example.com',
      });
    });

    it('should throw BadRequestError if zone not found', async () => {
      const context = getMockedCloudflareApiContext();

      context.cloudflare.client.zones = {
        get: jest.fn(),
        list: jest.fn().mockResolvedValue({ result: [] }),
      } as any;

      const error = await getError(
        resolveZoneRef({ name: 'nonexistent.com' }, context),
      );

      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('zone not found');
    });
  });

  describe('given an invalid ref', () => {
    it('should throw BadRequestError', async () => {
      const context = getMockedCloudflareApiContext();

      const error = await getError(resolveZoneRef({} as any, context));

      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('invalid zone ref');
    });
  });
});
