import { given, then, useBeforeAll, when } from 'test-fns';

import { getSampleCloudflareApiContext } from '@src/.test/getSampleCloudflareApiContext';

import { getAllDomainZones } from './getAllDomainZones';
import { getOneDomainZone } from './getOneDomainZone';

/**
 * .what = integration tests for domain zone operations
 * .why = verifies zone operations work against real cloudflare API
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests are read-only to avoid creating resources
 */
describe('domainZone', () => {
  // skip if credentials not configured
  const hasCredentials =
    process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID;
  const describeWithCredentials = hasCredentials ? describe : describe.skip;

  describeWithCredentials('with live cloudflare api', () => {
    const getContext = () => getSampleCloudflareApiContext();

    given('a cloudflare account', () => {
      when('[t0] getAllDomainZones is called', () => {
        then('it should return an array of zones', async () => {
          const zones = await getAllDomainZones(getContext());

          expect(Array.isArray(zones)).toBe(true);
          // verify each zone has expected shape
          zones.forEach((zone) => {
            expect(zone.id).toBeDefined();
            expect(zone.name).toBeDefined();
          });
        });
      });

      when(
        '[t1] getOneDomainZone is called with non-existent zone name',
        () => {
          then('it should return null', async () => {
            const zone = await getOneDomainZone(
              { by: { unique: { name: 'non-existent-zone-98765.xyz' } } },
              getContext(),
            );

            expect(zone).toBeNull();
          });
        },
      );
    });

    given('a cloudflare account with at least one zone', () => {
      const zonesData = useBeforeAll(async () => {
        const allZones = await getAllDomainZones(getContext());
        return { zones: allZones, firstZone: allZones[0] ?? null };
      });

      when('[t0] getOneDomainZone is called by primary key', () => {
        then('it should return the zone if zones exist', async () => {
          // skip if no zones in account
          if (!zonesData.firstZone) return;

          const zone = await getOneDomainZone(
            { by: { primary: { id: zonesData.firstZone.id } } },
            getContext(),
          );

          expect(zone).not.toBeNull();
          expect(zone?.id).toEqual(zonesData.firstZone.id);
          expect(zone?.name).toEqual(zonesData.firstZone.name);
        });
      });

      when('[t1] getOneDomainZone is called by unique key', () => {
        then('it should return the zone if zones exist', async () => {
          // skip if no zones in account
          if (!zonesData.firstZone) return;

          const zone = await getOneDomainZone(
            { by: { unique: { name: zonesData.firstZone.name } } },
            getContext(),
          );

          expect(zone).not.toBeNull();
          expect(zone?.id).toEqual(zonesData.firstZone.id);
          expect(zone?.name).toEqual(zonesData.firstZone.name);
        });
      });

      when('[t2] getOneDomainZone is called by ref with name', () => {
        then('it should expand the ref and return the zone', async () => {
          // skip if no zones in account
          if (!zonesData.firstZone) return;

          const zone = await getOneDomainZone(
            { by: { ref: { name: zonesData.firstZone.name } } },
            getContext(),
          );

          expect(zone).not.toBeNull();
          expect(zone?.id).toEqual(zonesData.firstZone.id);
        });
      });

      when('[t3] getOneDomainZone is called by ref with id', () => {
        then('it should expand the ref and return the zone', async () => {
          // skip if no zones in account
          if (!zonesData.firstZone) return;

          const zone = await getOneDomainZone(
            { by: { ref: { id: zonesData.firstZone.id } } },
            getContext(),
          );

          expect(zone).not.toBeNull();
          expect(zone?.name).toEqual(zonesData.firstZone.name);
        });
      });
    });
  });
});
