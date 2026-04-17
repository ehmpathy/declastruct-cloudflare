import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getMockedCloudflareApiContext } from '@src/.test/getMockedCloudflareApiContext';
import { HumanGuidanceError } from '@src/domain.objects/HumanGuidanceError';

import { setDomainRegistration } from './setDomainRegistration';

const createMockDomain = (overrides: Partial<any> = {}) => ({
  id: 'example.com',
  available: false,
  can_register: false,
  created_at: '2023-01-01T00:00:00Z',
  current_registrar: 'cloudflare',
  expires_at: '2025-01-01T00:00:00Z',
  locked: true,
  auto_renew: true,
  privacy: true,
  registry_statuses: 'ok',
  supported_tld: true,
  updated_at: '2023-06-15T00:00:00Z',
  ...overrides,
});

describe('setDomainRegistration', () => {
  given('a findsert operation', () => {
    when('the registration exists with same attributes', () => {
      then(
        'it should return the extant registration without modification',
        async () => {
          const context = getMockedCloudflareApiContext();
          const domainFound = createMockDomain();

          context.cloudflare.client.registrar = {
            domains: {
              get: jest.fn().mockResolvedValue(domainFound),
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
                locked: true,
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

    when('the registration exists with different attributes', () => {
      then('it should throw a BadRequestError', async () => {
        const context = getMockedCloudflareApiContext();
        const domainFound = createMockDomain({ locked: true });

        context.cloudflare.client.registrar = {
          domains: {
            get: jest.fn().mockResolvedValue(domainFound),
            list: jest.fn(),
            update: jest.fn(),
          },
        } as any;

        const error = await getError(
          setDomainRegistration(
            {
              findsert: {
                id: 'example.com',
                name: 'example.com',
                zone: { name: 'example.com' },
                autoRenew: true,
                locked: false, // differs from mock (true)
                privacyProtection: true,
              },
            },
            context,
          ),
        );

        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('cannot findsert registration');
        expect(error.message).toContain('different attributes');
      });
    });

    when('the registration does not exist and zone is not active', () => {
      then(
        'it should throw a HumanGuidanceError with nameserver guidance',
        async () => {
          const context = getMockedCloudflareApiContext();

          context.cloudflare.client.registrar = {
            domains: {
              get: jest.fn().mockRejectedValue(new Error('Domain not found')),
              list: jest.fn(),
              update: jest.fn(),
            },
          } as any;

          // mock zone as pending (not active)
          context.cloudflare.client.zones = {
            get: jest.fn(),
            list: jest.fn().mockResolvedValue({
              result: [
                {
                  id: 'zone-123',
                  name: 'pending-domain.com',
                  status: 'pending',
                  paused: false,
                  type: 'full',
                  name_servers: [
                    'gannon.ns.cloudflare.com',
                    'tia.ns.cloudflare.com',
                  ],
                  created_on: '2023-01-01T00:00:00Z',
                  activated_on: null,
                  original_name_servers: null,
                  original_registrar: null,
                },
              ],
            }),
            create: jest.fn(),
            delete: jest.fn(),
            edit: jest.fn(),
          } as any;

          const error = await getError(
            setDomainRegistration(
              {
                findsert: {
                  id: 'pending-domain.com',
                  name: 'pending-domain.com',
                  zone: { name: 'pending-domain.com' },
                },
              },
              context,
            ),
          );

          expect(error).toBeInstanceOf(HumanGuidanceError);
          expect(error.message).toContain('zone awaits nameserver delegation');
          expect(error.message).toContain('nameserver update required');
          expect(error.message).toContain('current status: pending');
          expect(error.message).toContain('gannon.ns.cloudflare.com');
        },
      );
    });

    when(
      'the registration does not exist and domain is within 60-day lock',
      () => {
        then(
          'it should throw a HumanGuidanceError with 60-day lock guidance',
          async () => {
            const context = getMockedCloudflareApiContext();

            context.cloudflare.client.registrar = {
              domains: {
                get: jest.fn().mockRejectedValue(new Error('Domain not found')),
                list: jest.fn(),
                update: jest.fn(),
              },
            } as any;

            // mock zone as active (so we proceed to WHOIS check)
            context.cloudflare.client.zones = {
              get: jest.fn(),
              list: jest.fn().mockResolvedValue({
                result: [
                  {
                    id: 'zone-123',
                    name: 'new-domain.com',
                    status: 'active',
                    paused: false,
                    type: 'full',
                    name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
                    created_on: '2023-01-01T00:00:00Z',
                    activated_on: '2023-01-01T00:00:00Z',
                    original_name_servers: null,
                    original_registrar: null,
                  },
                ],
              }),
              create: jest.fn(),
              delete: jest.fn(),
              edit: jest.fn(),
            } as any;

            // mock WHOIS with recent created_date (within 60 days)
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 30); // 30 days ago
            context.cloudflare.client.intel = {
              whois: {
                get: jest.fn().mockResolvedValue({
                  domain: 'new-domain.com',
                  found: true,
                  dnssec: false,
                  extension: 'com',
                  punycode: 'new-domain.com',
                  nameservers: ['ns1.squarespace.com'],
                  registrant: 'REDACTED',
                  registrar: 'SQUARESPACE DOMAINS II LLC',
                  registrar_name: 'Squarespace',
                  created_date: recentDate.toISOString(),
                }),
              },
            } as any;

            const error = await getError(
              setDomainRegistration(
                {
                  findsert: {
                    id: 'new-domain.com',
                    name: 'new-domain.com',
                    zone: { name: 'new-domain.com' },
                  },
                },
                context,
              ),
            );

            expect(error).toBeInstanceOf(HumanGuidanceError);
            expect(error.message).toContain('cannot be transferred yet');
            expect(error.message).toContain('60-day lock active');
            expect(error.message).toContain('Squarespace');
            expect(error.message).toContain('30 days ago');
            expect(error.message).toContain('30 days');
          },
        );
      },
    );

    when(
      'the registration does not exist and WHOIS shows registered elsewhere',
      () => {
        then(
          'it should throw a HumanGuidanceError with transfer guidance',
          async () => {
            const context = getMockedCloudflareApiContext();

            context.cloudflare.client.registrar = {
              domains: {
                get: jest.fn().mockRejectedValue(new Error('Domain not found')),
                list: jest.fn(),
                update: jest.fn(),
              },
            } as any;

            // mock zone as active (so we proceed to WHOIS check)
            context.cloudflare.client.zones = {
              get: jest.fn(),
              list: jest.fn().mockResolvedValue({
                result: [
                  {
                    id: 'zone-123',
                    name: 'nonexistent.com',
                    status: 'active',
                    paused: false,
                    type: 'full',
                    name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
                    created_on: '2023-01-01T00:00:00Z',
                    activated_on: '2023-01-01T00:00:00Z',
                    original_name_servers: null,
                    original_registrar: null,
                  },
                ],
              }),
              create: jest.fn(),
              delete: jest.fn(),
              edit: jest.fn(),
            } as any;

            context.cloudflare.client.intel = {
              whois: {
                get: jest.fn().mockResolvedValue({
                  domain: 'nonexistent.com',
                  found: true,
                  dnssec: false,
                  extension: 'com',
                  punycode: 'nonexistent.com',
                  nameservers: ['ns1.godaddy.com'],
                  registrant: 'REDACTED',
                  registrar: 'GODADDY.COM, LLC',
                  registrar_name: 'GoDaddy',
                }),
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

            expect(error).toBeInstanceOf(HumanGuidanceError);
            expect(error.message).toContain(
              'not found in cloudflare registrar',
            );
            expect(error.message).toContain('transfer required');
            expect(error.message).toContain('GoDaddy');
            expect(error.message).toContain('disable dnssec');
            expect(error.message).toContain('get auth code');
          },
        );
      },
    );

    when(
      'the registration does not exist and WHOIS shows not registered',
      () => {
        then(
          'it should throw a HumanGuidanceError with purchase guidance',
          async () => {
            const context = getMockedCloudflareApiContext();

            context.cloudflare.client.registrar = {
              domains: {
                get: jest.fn().mockRejectedValue(new Error('Domain not found')),
                list: jest.fn(),
                update: jest.fn(),
              },
            } as any;

            // mock zone as active (so we proceed to WHOIS check)
            context.cloudflare.client.zones = {
              get: jest.fn(),
              list: jest.fn().mockResolvedValue({
                result: [
                  {
                    id: 'zone-123',
                    name: 'available-domain.xyz',
                    status: 'active',
                    paused: false,
                    type: 'full',
                    name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
                    created_on: '2023-01-01T00:00:00Z',
                    activated_on: '2023-01-01T00:00:00Z',
                    original_name_servers: null,
                    original_registrar: null,
                  },
                ],
              }),
              create: jest.fn(),
              delete: jest.fn(),
              edit: jest.fn(),
            } as any;

            context.cloudflare.client.intel = {
              whois: {
                get: jest.fn().mockResolvedValue({
                  domain: 'available-domain.xyz',
                  found: false,
                  dnssec: false,
                  extension: 'xyz',
                  punycode: 'available-domain.xyz',
                  nameservers: [],
                  registrant: '',
                  registrar: '',
                }),
              },
            } as any;

            const error = await getError(
              setDomainRegistration(
                {
                  findsert: {
                    id: 'available-domain.xyz',
                    name: 'available-domain.xyz',
                    zone: { name: 'available-domain.xyz' },
                  },
                },
                context,
              ),
            );

            expect(error).toBeInstanceOf(HumanGuidanceError);
            expect(error.message).toContain(
              'not found in cloudflare registrar',
            );
            expect(error.message).toContain('purchase required');
            expect(error.message).toContain('available for registration');
            expect(error.message).toContain('add to cart');
          },
        );
      },
    );
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
      then(
        'it should throw a HumanGuidanceError (cannot create via API)',
        async () => {
          const context = getMockedCloudflareApiContext();

          context.cloudflare.client.registrar = {
            domains: {
              get: jest.fn().mockRejectedValue(new Error('Domain not found')),
              list: jest.fn(),
              update: jest.fn(),
            },
          } as any;

          // mock zone as active (so we proceed to WHOIS check)
          context.cloudflare.client.zones = {
            get: jest.fn(),
            list: jest.fn().mockResolvedValue({
              result: [
                {
                  id: 'zone-123',
                  name: 'nonexistent.com',
                  status: 'active',
                  paused: false,
                  type: 'full',
                  name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
                  created_on: '2023-01-01T00:00:00Z',
                  activated_on: '2023-01-01T00:00:00Z',
                  original_name_servers: null,
                  original_registrar: null,
                },
              ],
            }),
            create: jest.fn(),
            delete: jest.fn(),
            edit: jest.fn(),
          } as any;

          context.cloudflare.client.intel = {
            whois: {
              get: jest.fn().mockResolvedValue({
                domain: 'nonexistent.com',
                found: false,
                dnssec: false,
                extension: 'com',
                punycode: 'nonexistent.com',
                nameservers: [],
                registrant: '',
                registrar: '',
              }),
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

          expect(error).toBeInstanceOf(HumanGuidanceError);
          expect(error.message).toContain('not found in cloudflare registrar');
        },
      );
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
