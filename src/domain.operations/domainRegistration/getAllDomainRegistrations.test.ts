import { given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';

import { getAllDomainRegistrations } from './getAllDomainRegistrations';

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

describe('getAllDomainRegistrations', () => {
  given('an account with domain registrations', () => {
    when('registrations exist', () => {
      then('it should return all registrations', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomains = [
          createMockDomain({ id: 'example.com' }),
          createMockDomain({ id: 'test.org' }),
          createMockDomain({ id: 'mysite.net' }),
        ];

        // mock async iterator
        context.cloudflare.client.registrar = {
          domains: {
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                for (const domain of mockDomains) {
                  yield domain;
                }
              },
            }),
          },
        } as any;

        const result = await getAllDomainRegistrations(context);

        expect(result).toHaveLength(3);
        expect(result[0]?.id).toEqual('example.com');
        expect(result[0]?.name).toEqual('example.com');
        expect(result[1]?.id).toEqual('test.org');
        expect(result[1]?.name).toEqual('test.org');
        expect(result[2]?.id).toEqual('mysite.net');
        expect(result[2]?.name).toEqual('mysite.net');
        expect(
          context.cloudflare.client.registrar.domains.list,
        ).toHaveBeenCalledWith({
          account_id: 'mock-account-id-123',
        });
      });
    });

    when('registrations have zone refs set to domain name', () => {
      then(
        'each registration should have zone ref matching its name',
        async () => {
          const context = getMockedCloudflareApiContext();
          const mockDomains = [
            createMockDomain({ id: 'domain1.com' }),
            createMockDomain({ id: 'domain2.org' }),
          ];

          context.cloudflare.client.registrar = {
            domains: {
              list: jest.fn().mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                  for (const domain of mockDomains) {
                    yield domain;
                  }
                },
              }),
            },
          } as any;

          const result = await getAllDomainRegistrations(context);

          expect(result[0]?.zone).toEqual({ name: 'domain1.com' });
          expect(result[1]?.zone).toEqual({ name: 'domain2.org' });
        },
      );
    });
  });

  given('an account with no domain registrations', () => {
    when('queried', () => {
      then('it should return an empty array', async () => {
        const context = getMockedCloudflareApiContext();

        // mock empty async iterator
        context.cloudflare.client.registrar = {
          domains: {
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                // yields nothing
              },
            }),
          },
        } as any;

        const result = await getAllDomainRegistrations(context);

        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
      });
    });
  });

  given('a domain without id field', () => {
    when('id is undefined', () => {
      then('it should use empty string as domain name', async () => {
        const context = getMockedCloudflareApiContext();
        const mockDomains = [
          {
            available: false,
            expires_at: '2025-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-06-15T00:00:00Z',
          },
        ]; // no id but has required readonly fields

        context.cloudflare.client.registrar = {
          domains: {
            list: jest.fn().mockReturnValue({
              [Symbol.asyncIterator]: async function* () {
                for (const domain of mockDomains) {
                  yield domain;
                }
              },
            }),
          },
        } as any;

        const result = await getAllDomainRegistrations(context);

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toEqual('');
        expect(result[0]?.name).toEqual('');
      });
    });
  });
});
