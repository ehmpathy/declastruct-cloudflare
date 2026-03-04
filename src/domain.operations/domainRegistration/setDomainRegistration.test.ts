import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { setDomainRegistration } from './setDomainRegistration';

const createMockDomain = (overrides: Partial<any> = {}) => ({
  id: 'example.com',
  available: false,
  can_register: false,
  created_at: '2023-01-01T00:00:00Z',
  current_registrar: 'cloudflare',
  expires_at: '2025-01-01T00:00:00Z',
  locked: true,
  registry_statuses: 'ok',
  supported_tld: true,
  updated_at: '2023-06-15T00:00:00Z',
  ...overrides,
});

describe('setDomainRegistration', () => {
  given('a findsert operation', () => {
    when('the registration exists', () => {
      then(
        'it should return the existing registration without modification',
        async () => {
          const context = getMockedCloudflareApiContext();
          const existingDomain = createMockDomain();

          context.cloudflare.client.registrar = {
            domains: {
              get: jest.fn().mockResolvedValue(existingDomain),
              list: jest.fn(),
              update: jest.fn(),
            },
          } as any;

          const result = await setDomainRegistration(
            {
              findsert: {
                id: 'example.com',
                name: 'example.com',
                zone: { name: 'example.com' },
                autoRenew: true,
                locked: false,
                privacyProtection: true,
              },
            },
            context,
          );

          expect(result.id).toEqual('example.com');
          expect(
            context.cloudflare.client.registrar.domains.update,
          ).not.toHaveBeenCalled();
        },
      );
    });

    when('the registration does not exist', () => {
      then('it should throw an error', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockRejectedValue(new Error('Domain not found')),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const error = await getError(
          setDomainRegistration(
            {
              findsert: {
                id: 'nonexistent.com',
                name: 'nonexistent.com',
                zone: { name: 'nonexistent.com' },
              },
            },
            context,
          ),
        );

        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('registration not found for findsert');
      });
    });
  });

  given('an upsert operation', () => {
    when('the registration exists', () => {
      then('it should update the registration settings', async () => {
        const context = getMockedCloudflareApiContext();
        const existingDomain = createMockDomain();
        const updatedDomain = createMockDomain({ locked: false });

        let callCount = 0;
        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockImplementation(() => {
              callCount++;
              // first call: return existing, second call: return updated
              return Promise.resolve(
                callCount === 1 ? existingDomain : updatedDomain,
              );
            }),
            list: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedDomain),
          },
        } as any;

        const result = await setDomainRegistration(
          {
            upsert: {
              id: 'example.com',
              name: 'example.com',
              zone: { name: 'example.com' },
              autoRenew: true,
              locked: false,
              privacyProtection: true,
            },
          },
          context,
        );

        expect(result.locked).toEqual(false);
        expect(
          context.cloudflare.client.registrar.domains.update,
        ).toHaveBeenCalledWith('example.com', {
          account_id: 'mock-account-id-123',
          auto_renew: true,
          locked: false,
          privacy: true,
        });
      });
    });

    when('the registration does not exist', () => {
      then('it should throw an error (cannot create via API)', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockRejectedValue(new Error('Domain not found')),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const error = await getError(
          setDomainRegistration(
            {
              upsert: {
                id: 'nonexistent.com',
                name: 'nonexistent.com',
                zone: { name: 'nonexistent.com' },
                autoRenew: true,
              },
            },
            context,
          ),
        );

        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('registration not found for upsert');
      });
    });

    when('update succeeds but refetch fails', () => {
      then('it should throw an error', async () => {
        const context = getMockedCloudflareApiContext();
        const existingDomain = createMockDomain();

        let callCount = 0;
        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) return Promise.resolve(existingDomain);
              // second call (after update) returns not found
              return Promise.reject(new Error('Domain not found'));
            }),
            list: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        } as any;

        const error = await getError(
          setDomainRegistration(
            {
              upsert: {
                id: 'example.com',
                name: 'example.com',
                zone: { name: 'example.com' },
                autoRenew: true,
              },
            },
            context,
          ),
        );

        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('registration not found after update');
      });
    });
  });

  given('an invalid input', () => {
    when('neither findsert nor upsert is provided', () => {
      then('it should throw an error', async () => {
        const context = getMockedCloudflareApiContext();

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn(),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const error = await getError(setDomainRegistration({} as any, context));

        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('no registration in input');
      });
    });
  });
});
