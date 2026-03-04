import { given, then, useBeforeAll, when } from 'test-fns';

import { getSampleCloudflareApiContext } from '@src/.test/getSampleCloudflareApiContext';

import { getAllDomainRegistrations } from './getAllDomainRegistrations';
import { getOneDomainRegistration } from './getOneDomainRegistration';

/**
 * .what = integration tests for domain registration operations
 * .why = verifies registration operations work against real cloudflare API
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests are read-only to avoid modifying registrations
 */
describe('domainRegistration', () => {
  // skip if credentials not configured
  const hasCredentials =
    process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID;
  const describeWithCredentials = hasCredentials ? describe : describe.skip;

  describeWithCredentials('with live cloudflare api', () => {
    const getContext = () => getSampleCloudflareApiContext();

    given('a cloudflare account', () => {
      when('[t0] getAllDomainRegistrations is called', () => {
        then('it should return an array of registrations', async () => {
          const registrations = await getAllDomainRegistrations(getContext());

          expect(Array.isArray(registrations)).toBe(true);
          // verify each registration has expected shape
          registrations.forEach((registration) => {
            expect(registration.id).toBeDefined();
            expect(registration.name).toBeDefined();
            expect(registration.zone).toBeDefined();
          });
        });
      });

      when(
        '[t1] getOneDomainRegistration is called with non-existent domain',
        () => {
          then('it should return null', async () => {
            const registration = await getOneDomainRegistration(
              { by: { primary: { id: 'non-existent-domain-12345.xyz' } } },
              getContext(),
            );

            expect(registration).toBeNull();
          });
        },
      );
    });

    given('a cloudflare account with at least one registration', () => {
      const registrationsData = useBeforeAll(async () => {
        const allRegistrations = await getAllDomainRegistrations(getContext());
        return {
          registrations: allRegistrations,
          firstRegistration: allRegistrations[0] ?? null,
        };
      });

      when('[t0] getOneDomainRegistration is called by primary key', () => {
        then('it should return the registration', async () => {
          // skip if no registrations in account
          if (!registrationsData.firstRegistration) return;

          const registration = await getOneDomainRegistration(
            { by: { primary: { id: registrationsData.firstRegistration.id } } },
            getContext(),
          );

          expect(registration).not.toBeNull();
          expect(registration?.id).toEqual(
            registrationsData.firstRegistration.id,
          );
          expect(registration?.name).toEqual(
            registrationsData.firstRegistration.name,
          );
        });
      });

      when('[t1] getOneDomainRegistration is called by unique key', () => {
        then('it should return the registration', async () => {
          // skip if no registrations in account
          if (!registrationsData.firstRegistration) return;

          const registration = await getOneDomainRegistration(
            {
              by: {
                unique: { name: registrationsData.firstRegistration.name },
              },
            },
            getContext(),
          );

          expect(registration).not.toBeNull();
          expect(registration?.id).toEqual(
            registrationsData.firstRegistration.id,
          );
        });
      });

      when('[t2] getOneDomainRegistration is called with zone ref', () => {
        then('it should include the zone ref in the result', async () => {
          // skip if no registrations in account
          if (!registrationsData.firstRegistration) return;

          const registration = await getOneDomainRegistration(
            {
              by: { primary: { id: registrationsData.firstRegistration.id } },
              zone: { id: 'custom-zone-id' },
            },
            getContext(),
          );

          expect(registration).not.toBeNull();
          expect(registration?.zone).toEqual({ id: 'custom-zone-id' });
        });
      });
    });
  });
});
