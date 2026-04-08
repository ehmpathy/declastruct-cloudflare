import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { getOneDomainRegistration } from './getOneDomainRegistration';

const createMockDomain = (overrides: Partial<any> = {}) => ({
  id: 'example.com',
  available: false,
  can_register: false,
  created_at: '2023-01-01T00:00:00Z',
  current_registrar: 'cloudflare',
  expires_at: '2025-01-01T00:00:00Z',
  locked: true,
  registrant_contact: {
    id: 'contact-123',
    first_name: 'John',
    last_name: 'Doe',
    organization: 'Acme',
    address: '123 Main St',
    city: 'SF',
    state: 'CA',
    zip: '94102',
    country: 'US',
    phone: '+14155551234',
    email: 'john@example.com',
  },
  registry_statuses: 'ok',
  supported_tld: true,
  updated_at: '2023-06-15T00:00:00Z',
  ...overrides,
});

describe('getOneDomainRegistration', () => {
  given('a query by primary key (id)', () => {
    when('the registration exists', () => {
      then('it should return the registration', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomain = createMockDomain();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(mockDomain),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          { by: { primary: { id: 'example.com' } } },
          context,
        );

        expect(result).not.toBeNull();
        expect(result?.id).toEqual('example.com');
        expect(result?.name).toEqual('example.com');
        expect(result?.locked).toEqual(true);
        expect(
          context.cloudflare.client.registrar.domains.get,
        ).toHaveBeenCalledWith('example.com', {
          account_id: 'mock-account-id-123',
        });
      });
    });

    when('the registration does not exist', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockRejectedValue(new Error('Domain not found')),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          { by: { primary: { id: 'nonexistent.com' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });

    when('get returns null', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(null),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          { by: { primary: { id: 'null-domain.com' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });
  });

  given('a query by unique key (name)', () => {
    when('the registration exists', () => {
      then('it should return the registration', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomain = createMockDomain();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(mockDomain),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          { by: { unique: { name: 'example.com' } } },
          context,
        );

        expect(result).not.toBeNull();
        expect(result?.name).toEqual('example.com');
        expect(
          context.cloudflare.client.registrar.domains.get,
        ).toHaveBeenCalledWith('example.com', {
          account_id: 'mock-account-id-123',
        });
      });
    });
  });

  given('a query with zone ref', () => {
    when('zone ref is provided', () => {
      then('it should use the provided zone name', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomain = createMockDomain();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(mockDomain),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          {
            by: { primary: { id: 'example.com' } },
            zone: { name: 'custom-zone.com' },
          },
          context,
        );

        expect(result?.zone).toEqual({ name: 'custom-zone.com' });
      });
    });

    when('zone ref is not provided', () => {
      then('it should default to zone name matching domain name', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomain = createMockDomain();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(mockDomain),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          { by: { primary: { id: 'example.com' } } },
          context,
        );

        expect(result?.zone).toEqual({ name: 'example.com' });
      });
    });
  });

  given('domain is registered elsewhere (not cloudflare)', () => {
    when('current_registrar is another registrar', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomain = createMockDomain({
          current_registrar: 'Squarespace Domains',
        });

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(mockDomain),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          { by: { primary: { id: 'example.com' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });

    when('current_registrar is godaddy', () => {
      then('it should return null', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomain = createMockDomain({
          current_registrar: 'GoDaddy.com, LLC',
        });

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(mockDomain),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const result = await getOneDomainRegistration(
          { by: { unique: { name: 'example.com' } } },
          context,
        );

        expect(result).toBeNull();
      });
    });
  });

  given('an unexpected error', () => {
    when('error is not "not found"', () => {
      then('it should rethrow the error', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockRejectedValue(new Error('Permission denied')),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        await expect(
          getOneDomainRegistration(
            { by: { primary: { id: 'example.com' } } },
            context,
          ),
        ).rejects.toThrow('Permission denied');
      });
    });
  });
});
