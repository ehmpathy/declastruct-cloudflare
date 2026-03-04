import { given, then, useBeforeAll, when } from 'test-fns';

import type { ContextCloudflareApi } from '@src/domain.objects/ContextCloudflareApi';

import {
  createCloudflareClient,
  DeclaredCloudflareDomainDnsRecord,
  DeclaredCloudflareDomainZone,
  getAllDomainDnsRecords,
  getAllDomainZones,
  getDeclastructCloudflareProvider,
  getOneDomainDnsRecord,
  getOneDomainZone,
} from './index';

/**
 * .what = acceptance tests for declastruct-cloudflare SDK
 * .why = verifies end-to-end functionality with real cloudflare API
 *
 * .note
 *   - requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars
 *   - tests are read-only to avoid creating resources
 */
describe('declastruct-cloudflare', () => {
  // skip if credentials not configured
  const hasCredentials =
    process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID;

  // use conditional describe to skip if no credentials
  const describeWithCredentials = hasCredentials ? describe : describe.skip;

  describeWithCredentials('with live cloudflare api', () => {
    const context = useBeforeAll(async (): Promise<ContextCloudflareApi> => {
      const client = createCloudflareClient({
        apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      });
      return {
        cloudflare: {
          client,
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        },
      };
    });

    given('the declastruct cloudflare provider', () => {
      when('[t0] initialized', () => {
        then('it should create successfully', async () => {
          const provider = await getDeclastructCloudflareProvider(
            {
              apiToken: process.env.CLOUDFLARE_API_TOKEN!,
              accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            },
            { log: console },
          );
          expect(provider).toBeDefined();
          expect(provider.name).toEqual('cloudflare');
        });
      });
    });

    given('a cloudflare account with zones', () => {
      when('[t0] getAllDomainZones is called', () => {
        then('it should return an array', async () => {
          const zones = await getAllDomainZones(context);
          expect(Array.isArray(zones)).toBe(true);
        });
      });

      when('[t1] getOneDomainZone is called with non-existent zone', () => {
        then('it should return null', async () => {
          const zone = await getOneDomainZone(
            { by: { unique: { name: 'non-existent-domain-12345.xyz' } } },
            context,
          );
          expect(zone).toBeNull();
        });
      });
    });

    given('a cloudflare account with DNS records', () => {
      const zonesData = useBeforeAll(async () => {
        const allZones = await getAllDomainZones(context);
        return { zones: allZones, firstZone: allZones[0] ?? null };
      });

      when('[t0] getAllDomainDnsRecords is called on a zone', () => {
        then('it should return an array if a zone exists', async () => {
          // skip if no zones
          if (!zonesData.firstZone) return;

          const records = await getAllDomainDnsRecords(
            { zone: { id: zonesData.firstZone.id } },
            context,
          );
          expect(Array.isArray(records)).toBe(true);
        });
      });

      when(
        '[t1] getOneDomainDnsRecord is called with non-existent record',
        () => {
          then('it should return null', async () => {
            // skip if no zones
            if (!zonesData.firstZone) return;

            const record = await getOneDomainDnsRecord(
              {
                by: {
                  unique: {
                    zone: { id: zonesData.firstZone.id },
                    name: 'nonexistent.test.com',
                    type: 'A',
                  },
                },
              },
              context,
            );
            expect(record).toBeNull();
          });
        },
      );
    });
  });

  // basic type export tests that don't require API
  describe('type exports', () => {
    then('DeclaredCloudflareDomainZone should be exported', () => {
      expect(DeclaredCloudflareDomainZone).toBeDefined();
      expect(DeclaredCloudflareDomainZone.primary).toEqual(['id']);
      expect(DeclaredCloudflareDomainZone.unique).toEqual(['name']);
    });

    then('DeclaredCloudflareDomainDnsRecord should be exported', () => {
      expect(DeclaredCloudflareDomainDnsRecord).toBeDefined();
      expect(DeclaredCloudflareDomainDnsRecord.primary).toEqual(['id']);
    });
  });
});
