import { given, then, useBeforeAll, when } from 'test-fns';

import { getSampleCloudflareApiContext } from '@src/.test/getSampleCloudflareApiContext';
import { getAllDomainZones } from '@src/domain.operations/domainZone/getAllDomainZones';

import { getAllDomainDnsRecords } from './getAllDomainDnsRecords';
import { getOneDomainDnsRecord } from './getOneDomainDnsRecord';

/**
 * .what = integration tests for domain DNS record operations
 * .why = verifies DNS record operations work against real cloudflare API
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests are read-only to avoid creating resources
 */
describe('domainDnsRecord', () => {
  // skip if credentials not configured
  const hasCredentials =
    process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID;
  const describeWithCredentials = hasCredentials ? describe : describe.skip;

  describeWithCredentials('with live cloudflare api', () => {
    const getContext = () => getSampleCloudflareApiContext();

    // get zones to use for DNS record tests
    const zonesData = useBeforeAll(async () => {
      const allZones = await getAllDomainZones(getContext());
      return { zones: allZones, firstZone: allZones[0] ?? null };
    });

    given('a zone with DNS records', () => {
      when('[t0] getAllDomainDnsRecords is called by zone id', () => {
        then('it should return an array of records', async () => {
          // skip if no zones in account
          if (!zonesData.firstZone) return;

          const records = await getAllDomainDnsRecords(
            { zone: { id: zonesData.firstZone.id } },
            getContext(),
          );

          expect(Array.isArray(records)).toBe(true);
          // verify each record has expected shape
          records.forEach((record) => {
            expect(record.id).toBeDefined();
            expect(record.name).toBeDefined();
            expect(record.type).toBeDefined();
            expect(record.zone).toBeDefined();
          });
        });
      });

      when('[t1] getAllDomainDnsRecords is called by zone name', () => {
        then('it should resolve zone and return records', async () => {
          // skip if no zones in account
          if (!zonesData.firstZone) return;

          const records = await getAllDomainDnsRecords(
            { zone: { name: zonesData.firstZone.name } },
            getContext(),
          );

          expect(Array.isArray(records)).toBe(true);
        });
      });

      when(
        '[t2] getOneDomainDnsRecord is called with non-existent record',
        () => {
          then('it should return null', async () => {
            // skip if no zones in account
            if (!zonesData.firstZone) return;

            const record = await getOneDomainDnsRecord(
              {
                by: {
                  unique: {
                    zone: { id: zonesData.firstZone.id },
                    name: `nonexistent-test-record-${Date.now()}.${zonesData.firstZone.name}`,
                    type: 'A',
                  },
                },
              },
              getContext(),
            );

            expect(record).toBeNull();
          });
        },
      );
    });

    given('a zone with at least one DNS record', () => {
      const recordsAndZone = useBeforeAll(async () => {
        // skip if no zones in account
        if (!zonesData.firstZone) return { records: [], zone: null };

        const records = await getAllDomainDnsRecords(
          { zone: { id: zonesData.firstZone.id } },
          getContext(),
        );
        return { records, zone: zonesData.firstZone };
      });

      when('[t0] getOneDomainDnsRecord is called by primary key', () => {
        then('it should return the record', async () => {
          const { records, zone } = recordsAndZone;
          // skip if no records
          if (records.length === 0 || !zone) return;

          const record = await getOneDomainDnsRecord(
            {
              by: {
                primary: {
                  id: records[0]!.id,
                  zone: { id: zone.id },
                },
              },
            },
            getContext(),
          );

          expect(record).not.toBeNull();
          expect(record?.id).toEqual(records[0]!.id);
          expect(record?.name).toEqual(records[0]!.name);
          expect(record?.type).toEqual(records[0]!.type);
        });
      });

      when('[t1] getOneDomainDnsRecord is called by unique key', () => {
        then('it should return the record', async () => {
          const { records, zone } = recordsAndZone;
          // skip if no records
          if (records.length === 0 || !zone) return;

          const record = await getOneDomainDnsRecord(
            {
              by: {
                unique: {
                  zone: { id: zone.id },
                  name: records[0]!.name,
                  type: records[0]!.type,
                },
              },
            },
            getContext(),
          );

          expect(record).not.toBeNull();
          expect(record?.id).toEqual(records[0]!.id);
        });
      });

      when('[t2] getOneDomainDnsRecord is called with zone name ref', () => {
        then('it should resolve zone and return the record', async () => {
          const { records, zone } = recordsAndZone;
          // skip if no records
          if (records.length === 0 || !zone) return;

          const record = await getOneDomainDnsRecord(
            {
              by: {
                unique: {
                  zone: { name: zone.name },
                  name: records[0]!.name,
                  type: records[0]!.type,
                },
              },
            },
            getContext(),
          );

          expect(record).not.toBeNull();
          expect(record?.id).toEqual(records[0]!.id);
        });
      });
    });
  });
});
